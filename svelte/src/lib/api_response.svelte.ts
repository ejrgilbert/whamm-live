import type { injection_circle } from "./highlight_data.svelte";

export type valid_wasm_model = {
	injected_wat: string,
	lines_injected: number[],
    wat_to_injection_circle: Record<number, injection_circle[]>
}

export type valid_wizard_model = {
	injected_wat: string,
	whamm_file_related_lines: number[],
}

type APIResponse = {
	out_of_date: boolean,
	codemirror_code_updated: boolean,
	wat: string,
	wasm_model: valid_wasm_model | null,
	wizard_model: valid_wizard_model | null,
}

type configuration = {
	show_wizard: boolean,
	init_complete: boolean,
}

export const config : configuration = $state({
	show_wizard: false,
	init_complete: false
});

export var api_response: APIResponse = $state({
	out_of_date: true,
	codemirror_code_updated: false,
	wat: '',
// if model is null, this means either error, or fetching API response
	wasm_model: null,
	wizard_model: null
});
