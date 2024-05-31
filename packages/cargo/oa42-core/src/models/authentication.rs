#[oa42_macros::model_container]
pub struct Authentication {
  pub name: String,
  pub r#type: String,
  pub r#in: Option<String>,
  pub scheme: Option<String>,
}
