use serde_json::{Map, Value, json};
use dino_sdk::{Integration, IntegrationError, Request};

struct RandomNumber;

#[derive(Debug, thiserror::Error)]
enum ValidationError {
    #[error("unknown random-number operation")]
    UnknownOperation,
    #[error("arguments.max must be an integer from 1 through 1000000")]
    InvalidMaxType,
    #[error("arguments.max must be from 1 through 1000000")]
    InvalidMaxRange,
}

impl Integration for RandomNumber {
    fn validate(request: &Request) -> Result<Value, IntegrationError> {
        Self::validate(request).map_err(|error| IntegrationError::new(error.to_string()))
    }

    fn execute(request: Request) -> Result<Value, IntegrationError> {
        Self::execute(request).map_err(|error| IntegrationError::new(error.to_string()))
    }
}

impl RandomNumber {
    fn validate(request: &Request) -> Result<Value, ValidationError> {
        if request.tool.operation().as_str() != "roll" {
            return Err(ValidationError::UnknownOperation);
        }
        read_max(request.tool.fields()).map(|_| {
            json!({
                "ready": true,
                "operation": "roll",
                "next": "wait_for_random_number"
            })
        })
    }

    fn execute(request: Request) -> Result<Value, ValidationError> {
        Self::validate(&request)?;
        let max = read_max(request.tool.fields())?;
        Ok(json!(format!(
            "The random number is {}.",
            random_value(&request, max)
        )))
    }
}

fn read_max(arguments: &Map<String, Value>) -> Result<u64, ValidationError> {
    let max = arguments
        .get("max")
        .and_then(Value::as_u64)
        .ok_or(ValidationError::InvalidMaxType)?;
    if !(1..=1_000_000).contains(&max) {
        return Err(ValidationError::InvalidMaxRange);
    }
    Ok(max)
}

fn random_value(request: &Request, max: u64) -> u64 {
    let mut hash = 2_166_136_261_u32;
    for byte in request
        .execution_id
        .as_str()
        .bytes()
        .chain(request.call_id.as_str().bytes())
        .chain(request.tool.operation().as_str().bytes())
        .chain(
            serde_json::to_string(request.tool.fields())
                .expect("JSON object serialization is infallible")
                .bytes(),
        )
        .chain(
            serde_json::to_string(request.context.as_map())
                .expect("JSON object serialization is infallible")
                .bytes(),
        )
    {
        hash ^= u32::from(byte);
        hash = hash.wrapping_mul(16_777_619);
    }
    u64::from(hash) % max + 1
}

dino_sdk::export_integration!(RandomNumber);
