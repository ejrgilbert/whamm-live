import { get_all_webviews } from "../extensionListeners/documentChangesListener";
import { Helper_sidebar_provider } from "../user_interface/sidebarProviderHelper";
import { WasmWebviewPanel } from "../user_interface/wasmWebviewPanel";
import { WizardWebviewPanel } from "../user_interface/wizardWebviewPanel";
import { Types } from "../whammServer";
import { injection_circle, valid_wasm_model, valid_wizard_model, WhammLiveInjection } from "./types";

// Class that is related with the APIModel
// APIModel handles the model from the whamm API
// This class handles communicating those changes with the svelte webviews side
export class SvelteModel{

    static update_svelte_model(webview: WasmWebviewPanel | WizardWebviewPanel){
        SvelteModel.update_sidebar_model();
        SvelteModel.update_wasm_webview_model(webview);
    }

    static update_svelte_models(){
        SvelteModel.update_sidebar_model();
        for (let webview of get_all_webviews())
            SvelteModel.update_wasm_webview_model(webview);
    }

    static update_sidebar_model(){
        // nofify the sidebar side of the change
        let message = WasmWebviewPanel.webviews.map(view=> [view.fileName, view.model.__api_response_out_of_date]);
        if (WizardWebviewPanel.webview !== null) {
            message.push(["wizard", WizardWebviewPanel.webview.model.__api_response_out_of_date]);
        }

        Helper_sidebar_provider.post_message('whamm-api-models-update', message);
    }

    private static update_wasm_webview_model(webview: WasmWebviewPanel | WizardWebviewPanel){

        let model : valid_wasm_model | valid_wizard_model | null;

        if (webview.model.__api_response_out_of_date || webview.model.whamm_live_response.is_err)
            model = null;
        else
            model = (webview instanceof WasmWebviewPanel) ? (SvelteModel.create_valid_wasm_model(webview)) : (SvelteModel.create_valid_wizard_model(webview)); 

        webview.webviewPanel.webview.postMessage({
            command: 'api-response-update',
            response: {out_of_date: webview.model.__api_response_out_of_date,
                        model: model
            }
        })
    }

    // Create model to be used in the svelte side by the webview
    // Check svelte/src/lib/api_response.svelte.ts
    private static create_valid_wasm_model(webview: WasmWebviewPanel): valid_wasm_model{
        let injected_wat = webview.model.injected_wat_content;
        let lines_injected: number[] = [];
        for (let injection of webview.model.whamm_live_response.injecting_injections){
            for (let start_line = injection.wat_range.l1; start_line <= injection.wat_range.l2; start_line++){
                lines_injected.push(start_line);
            }
        }

        let wat_to_injection_circle : Record<number, injection_circle[]> = {};

        for (let injection of webview.model.whamm_live_response.other_injections){
            for (let start_line=injection.wat_range.l1; start_line <= injection.wat_range.l2; start_line++){
                let injection_circle_array = wat_to_injection_circle[start_line] ?? [];
                let color: string = "orange";
                switch(injection.type){
                    case Types.WhammDataType.opProbeType:
                        color="red";
                        break;
                    case Types.WhammDataType.localType:
                        color="blue";
                        break;
                    case Types.WhammDataType.funcProbeType:
                        color = "green";
                        break;
                }
                let body = create_html_content(injection);
                injection_circle_array.push(create_default_injection_circle(injection, body, color));
                wat_to_injection_circle[start_line] = injection_circle_array;
        }
        }
        return {
            injected_wat: injected_wat,
            lines_injected: lines_injected,
            wat_to_injection_circle
        } as valid_wasm_model;
    }

    private static create_valid_wizard_model(webview: WizardWebviewPanel): valid_wizard_model{
       // Get all the lines from the injections who causes aren't `whamm` but rather some logic in the whamm file
       let whamm_file_related_wat_lines: Set<number> = new Set();
       for (let injection of webview.model.whamm_live_response.injections){
        if (injection.whamm_span !== null){
            for (let i=injection.wat_range.l1; i <= injection.wat_range.l2; i++){
                whamm_file_related_wat_lines.add(i);
            }
        }
       }

       return {
            injected_wat: webview.model.whamm_live_response.injected_wat,
            whamm_file_related_wat_lines: Array.from(whamm_file_related_wat_lines),
        }  as valid_wizard_model;
    }
}

// Helper functions

function create_default_injection_circle(injection: WhammLiveInjection, body: string, color: string){
    return {
        color: color,
        body: body,
        injection_id: injection.id,
        highlighted: false,
        highlight_color: undefined
    } as injection_circle;
}

// Helper functions to help create the html content to be displayed on the svelte side for dangling probes

function create_html_content(injection: WhammLiveInjection): string{
    let header_div: string;
    switch(injection.type){
        case Types.WhammDataType.localType:
            header_div = `;; Local Injection\n;; Source: Line ${injection.wat_range.l1}-${injection.wat_range.l2}\n(\n`;
            break;
        case Types.WhammDataType.opProbeType:
            header_div = `;; opcode injection\n;; mode ${injection.mode}\n;; Source: Line ${injection.wat_range.l1}-${injection.wat_range.l2}\n(\n`;
            break;
        case Types.WhammDataType.funcProbeType:
            header_div = `;; Func Injection\n;; mode: function ${injection.mode}\n;; Source: Line ${injection.wat_range.l1}-${injection.wat_range.l2}\n(\n`;
            break;
        default:
            throw Error("Unsupported injection type");
    }
    let injections = injection.code.join("");
    return header_div + injections + ")";
}