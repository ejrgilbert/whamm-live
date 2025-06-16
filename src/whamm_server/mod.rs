use crate::vscode::example::types::{AppLoc, ErrorCode, Mode, Options, Probe, ScriptLoc};
use crate::log;
use orca_wasm::ir::module::Module;
use std::cell::RefCell;
use whamm::common::instr::run;

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

        // TODO:
        //   - create a `dry_run` function that returns metadata
        //   - clean up the exported stuff (bare minimum)
        //   - clean up where whamm is located, just put at `../whamm`


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
