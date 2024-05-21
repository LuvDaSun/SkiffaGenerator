#[oa42_macros::model_container]
pub struct AuthenticationRequirement {
  pub authentication_name: String,
  pub scopes: Vec<String>,
}
