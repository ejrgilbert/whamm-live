import { Helper_sidebar_provider } from "../user_interface/sidebarProviderHelper";
import { WhammWebviewPanel } from "../user_interface/webviewPanel";
import { Types } from "../whammServer";
import { dangling_injections, valid_model } from "./types";

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
    private static create_valid_model(webview: WhammWebviewPanel): object{
        let injected_wat = webview.model.injected_wat_content;
        let lines_injected: number[] = [];
        for (let injection of webview.model.whamm_live_response.injecting_injections){
            for (let start_line = injection.wat_range.l1; start_line <= injection.wat_range.l2; start_line++){
                lines_injected.push(start_line);
            }
        }

        let op_body_probes: dangling_injections= {color: "red", values: []}
        let locals: dangling_injections= {color: "blue", values: []}
        let func_probes: dangling_injections= {color: "green", values: []}

        for (let injection of webview.model.whamm_live_response.other_injections){
            for (let start_line=injection.wat_range.l1; start_line <= injection.wat_range.l2; start_line++){
                switch(injection.type){
                    case Types.WhammDataType.opProbeType:
                        op_body_probes.values.push([injection.code.join('\n'), start_line]);
                        break;
                    case Types.WhammDataType.localType:
                        locals.values.push([injection.code.join('\n'), start_line]);
                        break;
                    case Types.WhammDataType.funcProbeType:
                        func_probes.values.push([injection.code.join('\n'), start_line]);
                        break;
                }
        }
        }
        return {
            injected_wat: injected_wat,
            lines_injected: lines_injected,
            func_probes: func_probes,
            locals: locals,
            op_body_probes: op_body_probes
        } as valid_model;
    }
}