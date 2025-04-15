use crate::vscode::example::types::{AppLoc, ErrorCode, Mode, Options, Probe, ScriptLoc};
use crate::log;
use orca_wasm::ir::module::Module;
use std::cell::RefCell;
use std::fs;

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

// pub struct Probe {
//     app_loc: AppLoc,
//     script_loc: ScriptLoc,
//     wat: Wat
// }

// pub type Wat = String;
// pub type Wasm = Vec<u8>;

// pub struct AppLoc {
//     byte_offset: u64,
//     mode: Mode
// }
// pub struct ScriptLoc {
//     line: u32,
//     char: u32
// }

// pub enum Mode {
//     Before,
//     After,
//     Alt,
//     Entry,
//     Exit
// }

// pub struct Options {
//     as_monitor_module: bool
// }