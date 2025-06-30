use crate::vscode::example::types::{AppLoc, ErrorCode, Mode, Options, Probe, ScriptLoc};
use crate::log;
use orca_wasm::ir::module::Module;
use std::cell::RefCell;

thread_local! {
    static APP_BYTES: RefCell<Vec<u8>> = RefCell::new(Vec::new());
    static SCRIPT: RefCell<String> = RefCell::new(String::default());
    static OPTIONS: RefCell<Options> = RefCell::new(Options::default())
}

pub fn setup(app_bytes: Vec<u8>, opts: Options) -> Result<String, ErrorCode> {
    // cache app bytes and options
    APP_BYTES.with(|bytes| *bytes.borrow_mut() = app_bytes);
    OPTIONS.with(|options| *options.borrow_mut() = opts);

    log("setup::success");
    Result::Ok("setup: success".to_string())
}

pub fn run(new_script: String) -> Result<Vec<Probe>, ErrorCode> {
    return APP_BYTES.with(|bytes| {
        let bytes = & *bytes.borrow();
        let wasm = Module::parse(bytes, true).unwrap();

        log("HEEEYYYYYY");
        log(&format!("number of module globals: {:?}", wasm.globals.len()));
    
        return SCRIPT.with(|script| {
            let script_cache = &mut *script.borrow_mut();
    
            return if !new_script.eq(script_cache) {
                *script_cache = new_script;
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

pub fn wat2wat(content: String) -> Result<String, ErrorCode>{
    let mut _wat;
    let binary = wat::parse_str(content)?;
    _wat = wasmprinter::print_bytes(&binary)
            .expect("Problem parsing the .wat file");
    Ok(_wat)
}

pub fn wasm2wat(content: Vec<u8>) -> Result<String, ErrorCode>{
    let _wat = wasmprinter::print_bytes(content)
                    .expect("Problem parsing the .wasm file");
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
