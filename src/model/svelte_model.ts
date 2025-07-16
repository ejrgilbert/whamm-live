import { Helper_sidebar_provider } from "../user_interface/sidebarProviderHelper";
import { WhammWebviewPanel } from "../user_interface/webviewPanel";

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
            response: {out_of_date: webview.model.__api_response_out_of_date}
        })
    }
}