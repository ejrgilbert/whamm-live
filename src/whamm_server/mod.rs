use crate::log;
use crate::vscode::example::types::{ErrorCode, InjectionPair, Options, WhammInjection, WhammApiError, ErrorWrapper};
use std::{cell::RefCell, collections::HashMap};

thread_local! {
    static APP_TO_BYTES: RefCell<HashMap<String, RefCell<Vec<u8>>>> = RefCell::new(HashMap::new());
    static APP_TO_SCRIPT: RefCell<HashMap<String, String>> = RefCell::new(HashMap::new());
    static OPTIONS: RefCell<Options> = RefCell::new(Options::default())
}

mod rust_to_wit_error;
mod rust_to_wit;

pub fn setup(app_name: String, app_bytes: Vec<u8>, script: String, opts: Options) -> Result<String, ErrorCode> {
    APP_TO_BYTES.with(|app_to_bytes| {
        let mut app_to_bytes = app_to_bytes.borrow_mut();
        let all_bytes = RefCell::new(Vec::new());
        *all_bytes.borrow_mut() = app_bytes;
        app_to_bytes.insert(app_name.clone(), all_bytes);
        log(&format!("{app_name} is setup"));
    });

    APP_TO_SCRIPT.with(|app_to_script|{
        let mut app_to_script = app_to_script.borrow_mut();
        app_to_script.insert(app_name.clone(), script)
    });

    // cache app bytes and options
    OPTIONS.with(|options| *options.borrow_mut() = opts);

    log(format!("setup::success for {app_name}").as_str());
    Result::Ok("setup: success".to_string())
}

pub fn end(app_name: String){
    APP_TO_BYTES.with(|app_to_bytes| {
        let mut app_to_bytes = app_to_bytes.borrow_mut();
        app_to_bytes.remove(&app_name);
    });
    APP_TO_SCRIPT.with(|app_to_script| {
        let mut app_to_script = app_to_script.borrow_mut();
        app_to_script.remove(&app_name);
    });
}

pub fn no_change(
    new_script: String,
    app_name: String
) -> bool {
    return APP_TO_SCRIPT.with(|app_to_script|{
        let app_to_script = app_to_script.borrow_mut();
        let script_cache = app_to_script.get(&app_name).unwrap();
        return if new_script.eq(script_cache) {
            true
        } else {
            false
        };
    });
}

// Only runs if it absolutely needs to
// if `no_change` gives false
pub fn run(
    new_script: String,
    app_name: String,
    script_path: String,
) -> Result<Vec<InjectionPair>, ErrorWrapper> {
    return APP_TO_BYTES.with(|app_to_bytes| {
        let app_to_bytes = app_to_bytes.borrow_mut();
        let bytes = app_to_bytes.get(&app_name).unwrap();
        let bytes = &*bytes.borrow();

        return APP_TO_SCRIPT.with(|app_to_script| {
            let app_to_script = app_to_script.borrow_mut();
            let script_cache = &mut app_to_script.get(&app_name).unwrap();
                *script_cache = &new_script.clone();
                
                // Call the WHAMM api
                let response = whamm::api::instrument::instrument_as_dry_run_with_bytes(
                    (*bytes).clone(),
                    script_path,
                    new_script,
                    Vec::new(),
                );
                // let response:  Result<HashMap<InjectType, Vec<Injection>>, Vec<WhammError>> = Ok(HashMap::new());

                match response{
                    // handle valid response
                    Ok(ok_response) => {

                        let mut api_response :Vec<InjectionPair>= Vec::new();
                        // Go through all the different inject types
                        // and convert their vec of injections to the wit supported type
                        for (key, values) in ok_response{
                            let mut injection_pair = InjectionPair{
                                injection_type: key.to_string(),
                                injection_value: Vec::new()
                            };
                            for value in values{
                                injection_pair.injection_value.push(WhammInjection::from(value));
                            }
                            api_response.push(injection_pair);
                        }
                        log(format!("{api_response:#?}").as_str());
                        Result::Ok(api_response)

                    },

                    // handle error response
                    Err(whamm_errors) =>{
                        let mut api_response = Vec::new();
                        for whamm_error in whamm_errors{
                            api_response.push(WhammApiError::from(whamm_error));
                        }
                        log(format!("{api_response:#?}").as_str());
                        Result::Err(ErrorWrapper::ApiError(api_response))
                    }
                }
        });
    });
}

impl From<wat::Error> for ErrorCode {
    fn from(_: wat::Error) -> Self {
        ErrorCode::Unexpected("Error reading file".to_string())
    }
}

pub fn wat2watandwasm(_content: String) -> Result<(String, Vec<u8>), ErrorCode> {
    let binary = wat::parse_str(_content)?;
    let _wat = wasmprinter::print_bytes(&binary).expect("Problem parsing the wasm module");
    Ok((_wat, binary))
}

pub fn wasm2watandwasm(_content: Vec<u8>) -> Result<(String, Vec<u8>), ErrorCode> {
    let _wat = wasmprinter::print_bytes(_content).expect("Problem parsing the wasm module");
    let binary = wat::parse_str(&_wat)?;
    Ok((_wat, binary))
}

// ===============
// ==== TYPES ====
// ===============

impl Options {
    fn default() -> Self {
        Self {
            as_monitor_module: false,
        }
    }
}
