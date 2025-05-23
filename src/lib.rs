use whamm_server::{run, setup};

mod whamm_server;

// Use a procedural macro to generate bindings for the world we specified in `whamm-server.wit`
wit_bindgen::generate!({
	// the name of the world in the `*.wit` input file
	world: "whamm-server",
});

struct WhammServer;

impl Guest for WhammServer {

	fn setup(app_bytes: Vec<u8>, opts: Options) -> Result<String, ErrorCode> {
		log("Starting whamm setup");
		let result = setup(app_bytes, opts);
		log("Finished whamm setup");
		result
	}

	fn run(script: String) -> Result<Vec<Probe>, ErrorCode> {
		log("Starting whamm run");
		let result = run(script);
		log("Finished whamm run");
		result
	}
}

// Export the WhammServer to the extension code.
export!(WhammServer);