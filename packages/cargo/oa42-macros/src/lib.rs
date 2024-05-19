use heck::ToLowerCamelCase;
use quote::{format_ident, quote};
use syn::{parse_macro_input, ItemStruct};

#[proc_macro_attribute]
pub fn model_container(
  _attr: proc_macro::TokenStream,
  item: proc_macro::TokenStream,
) -> proc_macro::TokenStream {
  let item = parse_macro_input!(item as ItemStruct);
  let visibility = &item.vis;
  let name = &item.ident;
  let container_name = format_ident!("{}Container", name);

  let getters = item.fields.iter().flat_map(|field| {
    let field_name = field.ident.as_ref()?;
    let getter_name = format_ident!("{}", field_name);
    let js_name = field_name.to_string().to_lower_camel_case();
    let ty = &field.ty;

    Some(quote! {
      #[wasm_bindgen::prelude::wasm_bindgen(getter, js_name = #js_name)]
      pub fn #getter_name(&self) -> #ty {
        self.0.#field_name.clone()
      }
    })
  });

  let tokens = quote! {
    #item

    #[wasm_bindgen::prelude::wasm_bindgen]
    #[derive(Clone)]
    #visibility struct #container_name(std::rc::Rc<#name>);

    impl #container_name {
      pub fn new(interior: #name) -> Self {
        let interior = std::rc::Rc::new(interior);
        Self(interior)
      }
    }

    #[wasm_bindgen::prelude::wasm_bindgen]
    impl #container_name {
      #(#getters)*
    }

  };

  tokens.into()
}
