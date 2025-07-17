type dangling_injections={
	color: string,
	values: dangling_injection[]
}

type dangling_injection=[string, number];

export type valid_model = {
	injected_wat: string,
	lines_injected: number[],
	func_probes: dangling_injections,
	locals: dangling_injections,
	op_body_probes: dangling_injections
}

type APIResponse = {
	out_of_date: boolean,
	codemirror_code_updated: boolean,
	original_wat: string,
	model: valid_model | null,
}

export var api_response: APIResponse = $state({
	out_of_date: true,
	codemirror_code_updated: false,
	original_wat: '',
// if model is null, this means either error, or fetching API response
	model: null
});
