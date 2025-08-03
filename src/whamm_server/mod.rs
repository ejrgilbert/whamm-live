use crate::{log};
use crate::vscode::example::types::{ErrorCode, ErrorWrapper, InjectionPair, WhammApiError, WhammInjection, WhammTarget};
use std::{cell::RefCell, collections::HashMap};

thread_local! {
    static APP_TO_BYTES: RefCell<HashMap<String, RefCell<Vec<u8>>>> = RefCell::new(HashMap::new());
    static APP_TO_SCRIPT: RefCell<HashMap<String, String>> = RefCell::new(HashMap::new());
    static WIZARD_SCRIPT: RefCell<Option<String>> = RefCell::new(None);
}

mod rust_to_wit_error;
mod rust_to_wit;

pub fn setup(app_name: String, app_bytes: Vec<u8>, script: String) -> Result<String, ErrorCode> {
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

    log(format!("setup::success for {app_name}").as_str());
    Result::Ok("setup: success".to_string())
}

pub fn setup_wizard(script: String) -> Result<String, ErrorCode>{
    WIZARD_SCRIPT.with(|whamm_script|{
        let mut whamm_script = whamm_script.borrow_mut();
        *whamm_script = Some(script);
    });

    log(format!("setup::success for wizard").as_str());
    Result::Ok("wizard setup: success".to_string())
}

pub fn end(target: WhammTarget){
    match target{
        WhammTarget::Wasm(app_name) =>{
            APP_TO_BYTES.with(|app_to_bytes| {
                let mut app_to_bytes = app_to_bytes.borrow_mut();
                app_to_bytes.remove(&app_name);
            });
            APP_TO_SCRIPT.with(|app_to_script| {
                let mut app_to_script = app_to_script.borrow_mut();
                app_to_script.remove(&app_name);
            });
        },
        WhammTarget::Wizard =>{
            WIZARD_SCRIPT.with(|whamm_script|{
                let mut whamm_script = whamm_script.borrow_mut();
                *whamm_script = None;
            });
        }
    }
}

fn compare_scripts(new_script: String, script_cache: &String)-> bool{
    if new_script.eq(script_cache) {
        true
    } else {
        false
    }
}

pub fn no_change(
    new_script: String,
    target: WhammTarget
) -> bool {
    match target {
       WhammTarget::Wasm(app_name) =>{
            return APP_TO_SCRIPT.with(|app_to_script|{
                let app_to_script = app_to_script.borrow_mut();
                let script_cache = app_to_script.get(&app_name).unwrap();
                compare_scripts(new_script, script_cache)
            });
    },
        WhammTarget::Wizard=>{
            return WIZARD_SCRIPT.with(|whamm_script|{
                let whamm_script = whamm_script.borrow_mut();
                let whamm_script = &(*whamm_script);
                if let Some(content) = whamm_script {
                    return compare_scripts(new_script, content);
                } else{
                    return false;
                }
            });
        }
    }
}

pub fn update_whamm(new_script: String, target: WhammTarget){
    match target {
       WhammTarget::Wasm(app_name) =>{
            APP_TO_SCRIPT.with(|app_to_script|{
                let mut app_to_script = app_to_script.borrow_mut();
                app_to_script.insert(app_name, new_script);
            });
       },
       WhammTarget::Wizard =>{
            WIZARD_SCRIPT.with(|app_to_script|{
                let mut whamm_script = app_to_script.borrow_mut();
                *whamm_script =  Some(new_script);
            });
       }
    }
}

// Only runs if it absolutely needs to
// if `no_change` gives false
pub fn run(
    new_script: String,
    script_path: String,
    target: WhammTarget,
) -> Result<Vec<InjectionPair>, ErrorWrapper> {
    let bytes: Option<Vec<u8>>;
    let for_wizard: bool;
    match &target {
       WhammTarget::Wasm(app_name) =>{
            for_wizard = false;
            // get the wasm bytes
            bytes = Some(APP_TO_BYTES.with(|app_to_bytes| {
                let app_to_bytes = app_to_bytes.borrow_mut();
                let bytes = app_to_bytes.get(app_name).unwrap();
                let bytes = &*bytes.borrow();
                bytes.clone()
            }));
       },
       WhammTarget::Wizard=>{
            bytes = None;
            for_wizard = true;
       }
    }
    // update the whamm script
    update_whamm(new_script.clone(), target);
                
    // Call the WHAMM api
    let response = whamm::api::instrument::instrument_as_dry_run_with_bytes(
        bytes,
        script_path,
        new_script,
        Vec::new(),
        for_wizard
    );

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
            Result::Ok(api_response)

        },

        // handle error response
        Err(whamm_errors) =>{
            let mut api_response = Vec::new();
            for whamm_error in whamm_errors{
                api_response.push(WhammApiError::from(whamm_error));
            }
            Result::Err(ErrorWrapper::ApiError(api_response))
        }
    }
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