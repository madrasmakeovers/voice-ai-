use serde_json::{Map, Value, json};
use dino_sdk::{Integration, IntegrationError, Request};

struct DemoCrmEmbedded;

#[derive(Debug, thiserror::Error)]
enum ValidationError {
    #[error("unknown operation")]
    UnknownOperation,
    #[error("{field} is required")]
    MissingField { field: &'static str },
}

impl Integration for DemoCrmEmbedded {
    fn validate(request: &Request) -> Result<Value, IntegrationError> {
        Self::validate(request).map_err(|error| IntegrationError::new(error.to_string()))
    }

    fn execute(request: Request) -> Result<Value, IntegrationError> {
        Self::execute(request).map_err(|error| IntegrationError::new(error.to_string()))
    }
}

impl DemoCrmEmbedded {
    fn validate(req: &Request) -> Result<Value, ValidationError> {
        if req.tool.operation().as_str() != "send_message" {
            return Err(ValidationError::UnknownOperation);
        }
        let args = req.tool.fields();
        let record = req.record.as_map();
        let context = req.context.as_map();
        required_string(record, "unique_id")?;
        required_string(args, "message")?;
        required_string(context, "recipient_phone")?;
        Ok(json!({
            "contextReady": true,
            "recipientConfigured": true
        }))
    }

    fn execute(req: Request) -> Result<Value, ValidationError> {
        Self::validate(&req)?;
        let record = req.record.as_map();
        let context = req.context.as_map();
        let unique_id = required_string(record, "unique_id")?;
        let recipient = required_string(context, "recipient_phone")?;
        let account = context
            .get("account")
            .and_then(Value::as_str)
            .unwrap_or("demo");
        Ok(json!({
            "sent": true,
            "uniqueId": unique_id,
            "recipientPhone": recipient,
            "account": account,
            "messageId": format!("demo-{account}-{unique_id}"),
            "contextSnapshot": context_snapshot(context)
        }))
    }
}

fn required_string<'a>(
    value: &'a Map<String, Value>,
    key: &'static str,
) -> Result<&'a str, ValidationError> {
    value
        .get(key)
        .and_then(Value::as_str)
        .filter(|value| !value.trim().is_empty())
        .ok_or(ValidationError::MissingField { field: key })
}

fn context_snapshot(context: &Map<String, Value>) -> Value {
    let mut snapshot = serde_json::Map::new();
    for key in [
        "account",
        "recipient_phone",
        "customer_name",
        "city",
        "campaign_id",
        "segment",
        "locale",
    ] {
        if let Some(value) = context.get(key) {
            snapshot.insert(key.to_string(), value.clone());
        }
    }
    Value::Object(snapshot)
}

dino_sdk::export_integration!(DemoCrmEmbedded);
