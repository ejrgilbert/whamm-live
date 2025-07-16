import { writable } from "svelte/store"
export const api_response = writable({
	out_of_date: true,
});
