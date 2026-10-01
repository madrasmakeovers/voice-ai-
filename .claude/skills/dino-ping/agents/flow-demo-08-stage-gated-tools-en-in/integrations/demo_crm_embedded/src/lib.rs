use serde_json::{Map, Value, json};
use dino_sdk::{Integration, IntegrationError, Request};

struct DemoCrmEmbedded;

#[derive(Debug, thiserror::Error)]
enum ValidationError {
    #[error("unknown operation")]
    UnknownOperation,
    #[error("{field} is required")]
    MissingField { field: &'static str },
    #[error("pin must contain exactly four digits")]
    InvalidPin,
    #[error("detail must be account_status, plan, balance_due, last_payment, or support_note")]
    InvalidDetail,
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
        match req.tool.operation().as_str() {
            "verify_pin" => validate_pin(args),
            "lookup_customer_info" => validate_detail(args),
            _ => Err(ValidationError::UnknownOperation),
        }
        .map(|()| Value::Null)
    }

    fn execute(req: Request) -> Result<Value, ValidationError> {
        Self::validate(&req)?;
        let args = req.tool.fields();
        let data = match req.tool.operation().as_str() {
            "verify_pin" => {
                let verified = required_string(args, "pin")? == "1234";
                json!({
                    "verified": verified,
                    "customerName": if verified { "Ravi Kumar" } else { "" },
                    "message": if verified { "PIN verified." } else { "PIN did not match." }
                })
            }
            "lookup_customer_info" => {
                let detail = required_string(args, "detail")?;
                let value = match detail {
                    "account_status" => "active",
                    "plan" => "Gold Care",
                    "balance_due" => "INR 0",
                    "last_payment" => "paid on 2026-06-10",
                    "support_note" => "no open service tickets",
                    _ => unreachable!("validate_detail accepted the value"),
                };
                json!({
                    "found": true,
                    "customerName": "Ravi Kumar",
                    "detail": detail,
                    "value": value
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

fn validate_pin(args: &Map<String, Value>) -> Result<(), ValidationError> {
    let pin = required_string(args, "pin")?;
    if pin.len() == 4 && pin.chars().all(|character| character.is_ascii_digit()) {
        Ok(())
    } else {
        Err(ValidationError::InvalidPin)
    }
}

fn validate_detail(args: &Map<String, Value>) -> Result<(), ValidationError> {
    match required_string(args, "detail")? {
        "account_status" | "plan" | "balance_due" | "last_payment" | "support_note" => Ok(()),
        _ => Err(ValidationError::InvalidDetail),
    }
}

dino_sdk::export_integration!(DemoCrmEmbedded);
