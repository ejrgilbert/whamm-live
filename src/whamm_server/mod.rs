use crate::vscode::example::types::{AppLoc, Mode, Probe, ScriptLoc};


pub fn run() -> Vec<Probe> {
    vec![
        Probe {
            app_loc: AppLoc { byte_offset: 1, mode: Mode::Before },
            script_loc: ScriptLoc { l: 2, c: 3 },
            wat: "i32.const 1234".to_string()
        }
    ]
}

// ===============
// ==== TYPES ====
// ===============

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