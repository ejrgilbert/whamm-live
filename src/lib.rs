use whamm_server::{run, setup, wat2watandwasm, wasm2watandwasm, no_change, end, update_whamm};

use crate::{whamm_server::setup_wizard};

mod whamm_server;
// Use a procedural macro to generate bindings for the world we specified in `whamm-server.wit`
wit_bindgen::generate!({
	// the name of the world in the `*.wit` input file
	world: "whamm-server",
});

struct WhammServer;

impl Guest for WhammServer {

	fn setup(app_name: String, app_bytes: Vec<u8>, script: String) -> Result<String, ErrorCode> {
		log("Starting whamm setup");
		let result = setup(app_name, app_bytes, script);
		log("Finished whamm setup");
		result
	}

	fn setup_wizard(script: String) -> Result<String, ErrorCode>{
		setup_wizard(script)
	}

	fn no_change(new_script: String, target: WhammTarget) -> bool{
		no_change(new_script, target)
	}

	fn update_whamm(new_script:String, target: WhammTarget) {
		update_whamm(new_script, target);
	}

	fn end(target: WhammTarget){
		end(target);
	}

	fn run(script: String, script_path: String, target: WhammTarget) -> Result<Vec<InjectionPair>, ErrorWrapper>{
		log("Starting whamm run");
		let result = run(script, script_path, target);
		log("Finished whamm run");
		result
	}

	fn wat2watandwasm(content: String) -> Result<(String, Vec<u8>), ErrorCode> {
		let result = wat2watandwasm(content);
		result
	}

	fn wasm2watandwasm(content: Vec<u8>) -> Result<(String, Vec<u8>), ErrorCode> {
		let result = wasm2watandwasm(content);
		result
	}
}

// Export the WhammServer to the extension code.
export!(WhammServer);