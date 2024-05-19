#[oa42_macros::model]
pub struct AuthenticationRequirement {
  authentication_name: String,
  scopes: Vec<String>,
}
