use dino_sdk::builtins::{self, HttpHeader, HttpMethod, HttpRequest, ResponseBodyMode};
use dino_sdk::{Integration, IntegrationError, Request};
use serde_json::{Map, Value, json};

const OPERATION: &str = "submit_report";
const TIMEOUT_MS: u32 = 9_000;
const MAX_RESPONSE_BYTES: u32 = 4_096;

struct ReportRelay;

struct Settings {
    endpoint: String,
    relay_key: String,
}

fn settings(req: &Request) -> Result<Settings, IntegrationError> {
    let base_url = req
        .configuration
        .get("baseUrl")
        .and_then(Value::as_str)
        .map(|url| url.trim_end_matches('/'))
        .filter(|url| url.starts_with("https://"))
        .ok_or_else(|| IntegrationError::new("configuration.baseUrl must be an https URL"))?;
    let relay_key = req
        .configuration
        .get("relayKey")
        .and_then(Value::as_str)
        .filter(|key| key.len() >= 32)
        .ok_or_else(|| IntegrationError::new("configuration.relayKey is missing"))?;
    Ok(Settings {
        endpoint: format!("{base_url}/api/reports"),
        relay_key: relay_key.to_string(),
    })
}

fn check_report(fields: &Map<String, Value>) -> Result<(), IntegrationError> {
    for key in ["report_status", "project_name"] {
        let present = fields
            .get(key)
            .and_then(Value::as_str)
            .is_some_and(|value| !value.trim().is_empty());
        if !present {
            return Err(IntegrationError::new(format!(
                "{key} is required. Fill it from the recorded notes and call submit_report again."
            )));
        }
    }
    Ok(())
}

fn hex(bytes: &[u8]) -> String {
    const DIGITS: &[u8; 16] = b"0123456789abcdef";
    let mut out = String::with_capacity(bytes.len() * 2);
    for byte in bytes {
        out.push(char::from(DIGITS[usize::from(byte >> 4)]));
        out.push(char::from(DIGITS[usize::from(byte & 0x0f)]));
    }
    out
}

fn header(name: &str, value: &str) -> HttpHeader {
    HttpHeader {
        name: name.to_string(),
        value: value.as_bytes().to_vec(),
    }
}

impl Integration for ReportRelay {
    fn validate(req: &Request) -> Result<Value, IntegrationError> {
        if req.tool.operation().as_str() != OPERATION {
            return Err(IntegrationError::new(format!(
                "unknown operation '{}'",
                req.tool.operation()
            )));
        }
        settings(req)?;
        check_report(req.tool.fields())?;
        Ok(json!("Report accepted for filing."))
    }

    fn execute(req: Request) -> Result<Value, IntegrationError> {
        Self::validate(&req)?;
        let settings = settings(&req)?;
        let body = json!({
            "executionId": req.execution_id.as_str(),
            "callId": req.call_id.as_str(),
            "report": Value::Object(req.tool.fields().clone()),
        })
        .to_string()
        .into_bytes();
        let signature = hex(&builtins::hmac_sha256(settings.relay_key.as_bytes(), &body));
        let response = builtins::http(HttpRequest {
            method: HttpMethod::Post,
            url: settings.endpoint,
            headers: vec![
                header("content-type", "application/json"),
                header("x-report-signature", &signature),
            ],
            body,
            timeout_ms: TIMEOUT_MS,
            max_response_bytes: MAX_RESPONSE_BYTES,
            response_body: ResponseBodyMode::IgnoreSuccess,
        })
        .map_err(|failure| {
            IntegrationError::new(format!("report service unreachable: {failure:?}"))
        })?;
        if !(200..300).contains(&response.status) {
            return Err(IntegrationError::new(format!(
                "report service returned HTTP {}",
                response.status
            )));
        }
        Ok(json!("The daily report was filed and emailed."))
    }
}

dino_sdk::export_integration!(ReportRelay);
