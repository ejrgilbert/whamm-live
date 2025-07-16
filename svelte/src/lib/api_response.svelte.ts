import { writable } from "svelte/store"
export var api_response = $state({
	out_of_date: true,
	codemirror_code_updated: false,
});
