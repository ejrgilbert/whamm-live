use whamm_server::run;

mod whamm_server;

// Use a procedural macro to generate bindings for the world we specified in
// `host.wit`
wit_bindgen::generate!({
	// the name of the world in the `*.wit` input file
	world: "whamm-server",
});

struct WhammServer;

impl Guest for WhammServer {

	fn setup(_app: String, _script: String, _opts: Options) -> Result<String, ErrorCode> {
		// TODO: read in and cache app
		// TODO: read in and cache script
		// TODO: read in and cache opts
		Result::Ok("setup: success".to_string())
	}

	fn run() -> Result<Vec<Probe>, ErrorCode> {
		// log(&format!("Starting whamm run on application: {:?}", app));
		log("Starting whamm run");
		let result = Result::Ok(run());
		// let result: Result<Vec<u32>, ErrorCode> = match op {
		// 	Operation::Add(operands) => Result::Ok(vec![operands.left + operands.right, 0]),
		// 	Operation::Sub(operands) => Result::Ok(vec![operands.left - operands.right, 1]),
		// 	Operation::Mul(operands) => Result::Ok(vec![operands.left * operands.right, 2]),
		// 	Operation::Div(operands) => if operands.right == 0 { Result::Err(ErrorCode::DivideByZero) } else { Result::Ok(vec![operands.left / operands.right, 3]) }
		// };
		log("Finished whamm run");
		result
	}
}

// Export the WhammServer to the extension code.
export!(WhammServer);