import { Helper_sidebar_provider } from "../user_interface/sidebarProviderHelper";
import { WhammWebviewPanel } from "../user_interface/webviewPanel";
import { Types } from "../whammServer";
import { injection_circle, valid_model } from "./types";

// Class that is related with the APIModel
// APIModel handles the model from the whamm API
// This class handles communicating those changes with the svelte webviews side
export class SvelteModel{

    static update_svelte_model(webview: WhammWebviewPanel){
        SvelteModel.update_sidebar_model();
        SvelteModel.update_wasm_webview_model(webview);
    }

    static update_svelte_models(){
        SvelteModel.update_sidebar_model();
        for (let webview of WhammWebviewPanel.webviews)
            SvelteModel.update_wasm_webview_model(webview);
    }

    private static update_sidebar_model(){
        // nofify the sidebar side of the change
        Helper_sidebar_provider.post_message('whamm-api-models-update',
                WhammWebviewPanel.webviews.map(view=> [view.fileName, view.model.__api_response_out_of_date]));
    }

    private static update_wasm_webview_model(webview: WhammWebviewPanel){
        webview.webviewPanel.webview.postMessage({
            command: 'api-response-update',
            response: {out_of_date: webview.model.__api_response_out_of_date,
                        model: (webview.model.__api_response_out_of_date || webview.model.whamm_live_response.is_err) ? null : SvelteModel.create_valid_model(webview)
            }
        })
    }

    // Create model to be used in the svelte side by the webview
    // Check svelte/src/lib/api_response.svelte.ts
    private static create_valid_model(webview: WhammWebviewPanel): valid_model{
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
                switch(injection.type){
                    case Types.WhammDataType.opProbeType:
                        injection_circle_array.push({color: "red", body: injection.code.join('\n')});
                        break;

                    case Types.WhammDataType.localType:
                        injection_circle_array.push({color: "blue", body: injection.code.join('\n')});
                        break;

                    case Types.WhammDataType.funcProbeType:
                        injection_circle_array.push({color: "green", body: injection.code.join('\n')});
                        break;
                }
                wat_to_injection_circle[start_line] = injection_circle_array;
        }
        }
        return {
            injected_wat: injected_wat,
            lines_injected: lines_injected,
            wat_to_injection_circle
        } as valid_model;
    }
}