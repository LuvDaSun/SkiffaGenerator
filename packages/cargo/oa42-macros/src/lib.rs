use heck::ToLowerCamelCase;
use quote::{format_ident, quote};
use syn::{parse_macro_input, ItemStruct};

#[proc_macro_attribute]
pub fn model(
  _attr: proc_macro::TokenStream,
  item: proc_macro::TokenStream,
) -> proc_macro::TokenStream {
  let item = parse_macro_input!(item as ItemStruct);
  let visibility = item.vis;
  let name = item.ident;
  let interior_name = format_ident!("{}Interior", name);
  let fields = item.fields.iter().flat_map(|field| {
    let name = field.ident.as_ref()?;
    let ty = &field.ty;
    let visibility = &field.vis;

    Some(quote! {
      #visibility #name: #ty,
    })
  });

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
    #visibility struct #interior_name {
      #(#fields)*
    }

    #[wasm_bindgen::prelude::wasm_bindgen]
    #[derive(Clone)]
    #visibility struct #name(std::rc::Rc<#interior_name>);

    impl #name {
      pub fn new(interior: #interior_name) -> Self {
        let interior = std::rc::Rc::new(interior);
        Self(interior)
      }
    }

    #[wasm_bindgen::prelude::wasm_bindgen]
    impl #name {
      #(#getters)*
    }

  };

  tokens.into()
}
