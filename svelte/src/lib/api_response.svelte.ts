export type injection_circle = { color: string; body: string };

export type valid_model = {
	injected_wat: string,
	lines_injected: number[],
    wat_to_injection_circle: Record<number, injection_circle[]>
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
