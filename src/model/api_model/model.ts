import * as vscode from 'vscode';
import { ModelHelper } from "../utils/model_helper";
import { WhammLiveInjection } from "../types";
import { Cell } from "../utils/cell";
import { SvelteModel } from '../svelte_model';
import { Helper_sidebar_provider } from '../../user_interface/sidebarProviderHelper';
import { get_all_webviews } from '../../extensionListeners/documentChangesListener';

// Class to store API responses [ MVC pattern's model ] 
export abstract class APIModel{
    static whamm_file_changing: boolean = false;
    static whamm_cached_content: string;

    api_response_setup_completed: boolean = false;
    __api_response_out_of_date!: boolean;
    // svelte side code updated or not
    codemirror_code_updated!: boolean;

    jagged_array: (Cell|null)[][];

    constructor(){
        this.jagged_array = [];
    }

    async setup_init(){
        this.api_response_out_of_date = true;
        this.codemirror_code_updated = false;
        // loadWatAndWasm should have been called to load the content
        return await Helper_sidebar_provider.helper_get_whamm_file_contents();
    }

    async update_jagged_array(injections: WhammLiveInjection[], file_contents: string){
        this.jagged_array = ModelHelper.create_jagged_array(file_contents);

        // loop over every injection
        // and for each injection's span
        // inject the wamm-live-injection object into that cell of the jagged array
        for (let whamm_live_injection of injections){
            if (whamm_live_injection.whamm_span === null) continue;

            // Get all the (line,col) pairs for the injection's span
            let line_col_values = ModelHelper.get_line_col_values(whamm_live_injection.whamm_span, this.jagged_array);
            let span_size = line_col_values.length;
            if (span_size <= 0) continue;

            // loop over each (line,col) pair and add the injection to its cell value
            for (let line_col of line_col_values){
                let row = line_col[0] -1;
                let col = line_col[1] -1;
                let cell = this.jagged_array[row][col];
                if (cell === null){
                    this.jagged_array[line_col[0] -1][line_col[1] -1] = new Cell(whamm_live_injection, span_size);
                } else {
                    cell.add(whamm_live_injection, span_size);
                }
            }
    }}

    /* getter and setters */
    abstract get api_response_out_of_date();
    abstract set api_response_out_of_date(value: boolean);

    // set all models's api out of date and notify the related svelte side(s) only once!
    static set_api_out_of_date(value: boolean){

        let all_webviews = get_all_webviews();
        for (let webview of all_webviews){
            webview.model.__api_response_out_of_date = value;
            webview.model.codemirror_code_updated = false;
        }
        SvelteModel.update_svelte_models();
    }

    // file related helper static method(s)
    static async loadFileAsString(path: string, context: vscode.ExtensionContext): Promise<string> {
        const encoded = await vscode.workspace.fs.readFile(vscode.Uri.file(path));
        return new TextDecoder('utf-8').decode(encoded);
    }
}