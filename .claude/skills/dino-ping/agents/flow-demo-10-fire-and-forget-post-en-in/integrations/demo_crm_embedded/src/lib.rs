use serde_json::{Map, Value, json};
use dino_sdk::{Integration, IntegrationError, Request};

struct DemoCrmEmbedded;

#[derive(Debug, thiserror::Error)]
enum ValidationError {
    #[error("unknown operation")]
    UnknownOperation,
    #[error("{field} is required")]
    MissingField { field: &'static str },
    #[error("{field} must be one of {}", allowed.join(", "))]
    InvalidChoice {
        field: &'static str,
        allowed: &'static [&'static str],
    },
    #[error("registered_mobile must be a valid phone number")]
    InvalidMobile,
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
        let args = req.tool.fields();
        let message = match req.tool.operation().as_str() {
            "check_otp_status" => {
                validate_mobile(args)?;
                required_string(args, "app_version")?;
                "The OTP-status check was accepted for background execution."
            }
            "log_kapture_note" => {
                validate_mobile(args)?;
                require_enum(args, "issue_type", &["login_otp_not_generated"])?;
                require_enum(
                    args,
                    "resolution_status",
                    &["resolved", "escalated", "unresolved"],
                )?;
                required_string(args, "notes")?;
                "The support note was accepted for background execution."
            }
            _ => return Err(ValidationError::UnknownOperation),
        };
        Ok(json!(message))
    }

    fn execute(req: Request) -> Result<Value, ValidationError> {
        Self::validate(&req)?;
        let args = req.tool.fields();
        let data = match req.tool.operation().as_str() {
            "check_otp_status" => {
                let mobile = required_string(args, "registered_mobile")?;
                let app_version = required_string(args, "app_version")?;
                let digits = mobile.trim_start_matches('+');
                let (status, next_step) = if digits.ends_with("0000") {
                    ("server_error", "Escalate the temporary system issue.")
                } else if digits.ends_with("1111") {
                    ("gateway_failure", "Escalate the SMS gateway failure.")
                } else if digits.ends_with("2222") {
                    (
                        "number_inactive",
                        "Guide the driver to update the registered number.",
                    )
                } else {
                    (
                        "generated",
                        "Ask the driver to retry login and check blocked SMS.",
                    )
                };
                json!({
                    "status": status,
                    "nextStep": next_step,
                    "registeredMobile": mobile,
                    "appVersion": app_version,
                    "source": "demo_bpp_dashboard"
                })
            }
            "log_kapture_note" => {
                let mobile = required_string(args, "registered_mobile")?;
                let disposition = required_string(args, "resolution_status")?;
                json!({
                    "accepted": true,
                    "ticketId": "KAP-OTP-2048",
                    "registeredMobile": mobile,
                    "disposition": disposition,
                    "source": "demo_kapture"
                })
            }
            _ => return Err(ValidationError::UnknownOperation),
        };
        Ok(data)
    }
}

fn required_string<'a>(
    args: &'a Map<String, Value>,
    key: &'static str,
) -> Result<&'a str, ValidationError> {
    args.get(key)
        .and_then(Value::as_str)
        .filter(|value| !value.trim().is_empty())
        .ok_or(ValidationError::MissingField { field: key })
}

fn require_enum<'a>(
    args: &'a Map<String, Value>,
    key: &'static str,
    allowed: &'static [&'static str],
) -> Result<&'a str, ValidationError> {
    let value = required_string(args, key)?;
    if allowed.contains(&value) {
        Ok(value)
    } else {
        Err(ValidationError::InvalidChoice {
            field: key,
            allowed,
        })
    }
}

fn validate_mobile(args: &Map<String, Value>) -> Result<(), ValidationError> {
    let mobile = required_string(args, "registered_mobile")?;
    let digits = mobile.trim_start_matches('+');
    if digits.len() >= 10 && digits.chars().all(|character| character.is_ascii_digit()) {
        Ok(())
    } else {
        Err(ValidationError::InvalidMobile)
    }
}

dino_sdk::export_integration!(DemoCrmEmbedded);
