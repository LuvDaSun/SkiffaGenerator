use super::AuthenticationRequirementContainer;

#[oa42_macros::model_container]
pub struct AuthenticationRequirementGroup {
  pub requirements: Vec<AuthenticationRequirementContainer>,
}
