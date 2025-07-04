use crate::vscode::example::types::{AppLoc, ErrorCode, Mode, Options, Probe, ScriptLoc};
use crate::log;
use orca_wasm::ir::module::Module;
use std::{cell::RefCell, collections::HashMap};

thread_local! {
    static APP_TO_BYTES: RefCell<HashMap<String, RefCell<Vec<u8>>>> = RefCell::new(HashMap::new());
    static SCRIPT: RefCell<String> = RefCell::new(String::default());
    static OPTIONS: RefCell<Options> = RefCell::new(Options::default())
}

pub fn setup(app_name: String, app_bytes: Vec<u8>, opts: Options) -> Result<String, ErrorCode> {

    APP_TO_BYTES.with(|app_to_bytes| {
        let mut app_to_bytes = app_to_bytes.borrow_mut();
        let all_bytes = RefCell::new(Vec::new());
        *all_bytes.borrow_mut() = app_bytes;
        app_to_bytes.insert(app_name.clone(), all_bytes);
        log(&format!("{app_name} is setup"));
    });

    // cache app bytes and options
    OPTIONS.with(|options| *options.borrow_mut() = opts);

    log("setup::success");
    Result::Ok("setup: success".to_string())
}

pub fn run(new_script: String, app_name: String) -> Result<Vec<Probe>, ErrorCode> {
    return APP_TO_BYTES.with(|app_to_bytes|{
        let app_to_bytes = app_to_bytes.borrow_mut();
        let bytes = app_to_bytes.get(&app_name).unwrap();
        let bytes = & *bytes.borrow();
        let wasm = Module::parse(bytes, true).unwrap();

        log(&format!("number of module globals: {:?}", wasm.globals.len()));
    
        return SCRIPT.with(|script| {
            let script_cache = &mut *script.borrow_mut();
    
            return if !new_script.eq(script_cache) {
                *script_cache = new_script.clone();
// TODO: CALL THE WHAMM API AND RETURN THAT RESPONSE INSTEAD
//                 let response = whamm::api::instrument::instrument_as_dry_run_with_contents(
//                     (*bytes).clone(), new_script, vec![], None, None);

                Result::Ok(vec![
                    Probe {
                        app_loc: AppLoc { byte_offset: 1, mode: Mode::Before },
                        script_loc: ScriptLoc { l: 2, c: 3 },
                        wat: "i32.const 1234".to_string()
                    }
                ])
            } else {
                Result::Err(ErrorCode::NoChange("No change between old and new whamm script".to_string()))
            }
            // });
        });
    });
}

impl From<wat::Error> for ErrorCode{
    fn from(_: wat::Error) -> Self {
        ErrorCode::Unexpected("Error reading file".to_string())
    }
}

pub fn wat2wat(_content: String) -> Result<String, ErrorCode>{
    let binary = wat::parse_str(_content)?;
    wasm2wat(binary)
}

pub fn wasm2wat(_content: Vec<u8>) -> Result<String, ErrorCode>{
    let _wat = wasmprinter::print_bytes(_content)
                    .expect("Problem parsing the wasm module");
    Ok(_wat)
}

// ===============
// ==== TYPES ====
// ===============

impl Options {
    fn default() -> Self {
        Self {
            as_monitor_module: false
        }
    }
}
