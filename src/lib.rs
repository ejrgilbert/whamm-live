use whamm_server::{run, setup, wat2wat, wasm2wat};

mod whamm_server;

// Use a procedural macro to generate bindings for the world we specified in `whamm-server.wit`
wit_bindgen::generate!({
	// the name of the world in the `*.wit` input file
	world: "whamm-server",
});

struct WhammServer;

impl Guest for WhammServer {

	fn setup(app_name: String, app_bytes: Vec<u8>, opts: Options) -> Result<String, ErrorCode> {
		log("Starting whamm setup");
		let result = setup(app_name, app_bytes, opts);
		log("Finished whamm setup");
		result
	}

	fn run(script: String, app_name: String) -> Result<Vec<Probe>, ErrorCode> {
		log("Starting whamm run");
		let result = run(script, app_name);
		log("Finished whamm run");
		result
	}

	fn wat2wat(content: String) -> Result<String, ErrorCode> {
		let result = wat2wat(content);
		result
	}

	fn wasm2wat(content: Vec<u8>) -> Result<String, ErrorCode> {
		let result = wasm2wat(content);
		result
	}
}

// Export the WhammServer to the extension code.
export!(WhammServer);