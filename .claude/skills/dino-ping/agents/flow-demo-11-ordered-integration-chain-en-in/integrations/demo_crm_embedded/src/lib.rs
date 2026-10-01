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
        let args = req.tool.fields();
        let record = req.record.as_map();
        let acceptance = match req.tool.operation().as_str() {
            "lookup_customer" => {
                required_string(record, "unique_id")?;
                json!({
                    "ready": true,
                    "operation": "lookup_customer",
                    "next": "wait_for_customer_profile"
                })
            }
            "send_message" => {
                let context = req.context.as_map();
                required_string(record, "unique_id")?;
                required_string(args, "message")?;
                required_string(context, "recipient_phone")?;
                json!({
                    "ready": true,
                    "operation": "send_message",
                    "next": "wait_for_delivery_result"
                })
            }
            _ => return Err(ValidationError::UnknownOperation),
        };
        Ok(acceptance)
    }

    fn execute(req: Request) -> Result<Value, ValidationError> {
        Self::validate(&req)?;
        let args = req.tool.fields();
        let record = req.record.as_map();
        let context = req.context.as_map();
        let unique_id = required_string(record, "unique_id")?;
        let data = match req.tool.operation().as_str() {
            "lookup_customer" => {
                let profile = match unique_id {
                    "C-1001" => Some(json!({
                        "name": "Ravi Kumar",
                        "tier": "gold",
                        "preferredChannel": "whatsapp"
                    })),
                    "C-1002" => Some(json!({
                        "name": "Asha Singh",
                        "tier": "silver",
                        "preferredChannel": "voice"
                    })),
                    _ => None,
                };
                json!({
                    "uniqueId": unique_id,
                    "found": profile.is_some(),
                    "profile": profile
                })
            }
            "send_message" => {
                let recipient = required_string(context, "recipient_phone")?;
                let message = required_string(args, "message")?;
                json!({
                    "sent": true,
                    "uniqueId": unique_id,
                    "recipientPhone": recipient,
                    "messagePreview": message.chars().take(80).collect::<String>(),
                    "messageId": format!("demo-{unique_id}")
                })
            }
            _ => return Err(ValidationError::UnknownOperation),
        };
        Ok(data)
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

dino_sdk::export_integration!(DemoCrmEmbedded);
