use whamm_server::{run, setup, wat2watandwasm, wasm2watandwasm, no_change, end, update_whamm};

mod whamm_server;
// Use a procedural macro to generate bindings for the world we specified in `whamm-server.wit`
wit_bindgen::generate!({
	// the name of the world in the `*.wit` input file
	world: "whamm-server",
});

struct WhammServer;

impl Guest for WhammServer {

	fn setup(app_name: String, app_bytes: Vec<u8>, script: String, opts: Options) -> Result<String, ErrorCode> {
		log("Starting whamm setup");
		let result = setup(app_name, app_bytes, script, opts);
		log("Finished whamm setup");
		result
	}

	fn no_change(new_script: String, app_name: String) -> bool{
		no_change(new_script, app_name)
	}

	fn update_whamm(new_script:String, app_name: String) {
		update_whamm(new_script, app_name);
	}

	fn end(app_name: String){
		end(app_name);
	}

	fn run(script: String, app_name: String, script_path: String) -> Result<Vec<InjectionPair>, ErrorWrapper>{
		log("Starting whamm run");
		let result = run(script, app_name, script_path);
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