// Use a procedural macro to generate bindings for the world we specified in
// `host.wit`
wit_bindgen::generate!({
	// the name of the world in the `*.wit` input file
	world: "calculator",
});

struct Calculator;

impl Guest for Calculator {

	fn calc(op: Operation) -> Result<Vec<u32>, ErrorCode> {
		log(&format!("Starting calculation: {:?}", op));
		let result: Result<Vec<u32>, ErrorCode> = match op {
			Operation::Add(operands) => Result::Ok(vec![operands.left + operands.right, 0]),
			Operation::Sub(operands) => Result::Ok(vec![operands.left - operands.right, 1]),
			Operation::Mul(operands) => Result::Ok(vec![operands.left * operands.right, 2]),
			Operation::Div(operands) => if operands.right == 0 { Result::Err(ErrorCode::DivideByZero) } else { Result::Ok(vec![operands.left / operands.right, 3]) }
		};
		log(&format!("Finished calculation: {:?}", op));
		result
	}
}

// Export the Calculator to the extension code.
export!(Calculator);