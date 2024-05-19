#[oa42_macros::model_container]
pub struct AuthenticationRequirement {
  authentication_name: String,
  scopes: Vec<String>,
}
