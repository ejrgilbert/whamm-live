// Helper functions for sidebar provider for user interace event handling
import * as vscode from 'vscode';
import { ExtensionContext } from '../extensionContext'; 
import { WasmWebviewPanel } from './wasmWebviewPanel'; 
import { handleDocumentChanges } from '../extensionListeners/documentChangesListener';
import { LineHighlighterDecoration } from '../extensionListeners/utils/lineHighlighterDecoration';
import { APIModel } from '../model/api_model/model';
import { WizardWebviewPanel } from './wizardWebviewPanel';

// Open whamm file using file dialog and VS Code API
// Returns true if whamm file opens, false otherwise
export class Helper_sidebar_provider{
    static webview: vscode.Webview;
    static file_listener: vscode.Disposable;

    static async helper_open_whamm_file(): Promise<boolean> {
        
        // open file dialog and only allow user to select .mm files
        const fileURI = await vscode.window.showOpenDialog({

            canSelectMany: false,
            openLabel: 'Open Whamm file',
            filters: {
                'Whamm files': ['*\.mm'],}})
        
        if (fileURI && fileURI[0]) {
            let filePath = vscode.Uri.file(fileURI[0].fsPath);
            return Helper_sidebar_provider.helper_show_whamm_file(filePath);

        } else 
            return false;
    }

    static async helper_open_webview(wasm_wizard_engine: boolean): Promise<boolean> {
        
        if (wasm_wizard_engine){
            Helper_sidebar_provider.helper_show_wasm_file(undefined);
        } else {

            const fileURI = await vscode.window.showOpenDialog({

                canSelectMany: false,
                openLabel: 'Open wat/wasm file',
                filters: {
                    'Wat/Wasm files': ['.*\.wat', '.*\.wasm'],}})
            
            if (fileURI && fileURI[0]) {
                await Helper_sidebar_provider.helper_show_wasm_file(fileURI[0].fsPath);
            } else 
                return false;
    }
        return true;
    }

    static async helper_show_wasm_file(path: string | undefined){
        let panel: WasmWebviewPanel | WizardWebviewPanel;
        if (path){
            // Check if webview for this path already exists
            // if it does, then just reveal and make that active
            for (let webview of WasmWebviewPanel.webviews){
                if (webview.fileName === path){
                    webview.webviewPanel.reveal();
                    return;
                }
            }
            panel = new WasmWebviewPanel(path);
        } else{
            if (WizardWebviewPanel.webview !== null){
                WizardWebviewPanel.webview.webviewPanel.reveal();
                return;
            }
            else {
                panel = new WizardWebviewPanel();
            }
        }
        await panel.init();
        panel.setupHTML();
    }

    static async helper_show_whamm_file(filePath: vscode.Uri) : Promise<boolean>{
            if (WasmWebviewPanel.number_of_webviews > 0 && ExtensionContext.get_editors().length > 0){
                LineHighlighterDecoration.clear_all_decorations();
            }
            
            APIModel.whamm_cached_content = await APIModel.loadFileAsString(filePath.fsPath, ExtensionContext.context);
            // Open and show the text document
            let document = await vscode.workspace.openTextDocument(filePath)
            await vscode.window.showTextDocument(document, {
                                    preview: false,         // open a new tab
                                    preserveFocus: false,   // bring the new tab into focus
                                });
            
            // Update workspace state
            Helper_sidebar_provider.helper_update_whamm_workspace_state(filePath.fsPath);

            // Update the webview model data if there are any open
            if (WasmWebviewPanel.number_of_webviews > 0){
                await handleDocumentChanges();
            }

            // When text document is no longer in memory
            vscode.workspace.onDidCloseTextDocument((textDocument)=>{
                if (textDocument.uri.fsPath === filePath.fsPath === ExtensionContext.context.workspaceState.get('whamm-file')){
                    Helper_sidebar_provider.helper_update_whamm_workspace_state(undefined);
                }
            })

            return true;
    }

    static helper_update_whamm_workspace_state(whamm_file: string | undefined){
            ExtensionContext.context.workspaceState.update('whamm-file',
                whamm_file
            );

            // let the WhammFileSidebar.svelte file know about the workspace update changes so that the html can update accordingly
            if (whamm_file) {
                let whamm_file_list : string[] = whamm_file.split('/');
                whamm_file = whamm_file_list[whamm_file_list.length - 1];
            }
            Helper_sidebar_provider.webview.postMessage({
                command: 'workspace-whamm-update',
                whamm_file: whamm_file,
            });
    }

    static helper_reset_sidebar_webview_state(){
        Helper_sidebar_provider.helper_update_whamm_workspace_state(
            undefined
        )

    }

    static helper_restore_sidebar_webview_state(){
        Helper_sidebar_provider.helper_update_whamm_workspace_state(
            ExtensionContext.context.workspaceState.get('whamm-file'),
        )
        Helper_sidebar_provider.post_message('whamm-api-models-update',
                WasmWebviewPanel.webviews.map(view=> [view.fileName, view.model.__api_response_out_of_date]));
    }

    static async helper_get_whamm_file_contents(): Promise<string | null>{
        let file_path: string | undefined = ExtensionContext.context.workspaceState.get('whamm-file');
        if (file_path){

            var file_contents: string;
            let editor = vscode.window.activeTextEditor;
            if (editor?.document.uri.fsPath === file_path){
                file_contents = editor.document.getText();
            } else{
                file_contents = await APIModel.loadFileAsString(file_path, ExtensionContext.context);
            }
            return file_contents;
        }
        return null;
    }

    static post_message(command: string, values: any){
        Helper_sidebar_provider.webview.postMessage({
                command: command,
                values: values
        });
    }

    static async restart_extension(){
        let soft_reset_message = "Soft reset: Restart the extension";
        let hard_reset_message = "Hard reset: Restart the window";
        const choice = await vscode.window.showWarningMessage(
            "Restart the extension?",
            { modal: true },
            soft_reset_message, hard_reset_message
        );

        if (choice){
            switch (choice){
                case soft_reset_message:
                    {
                        for (let webview of WasmWebviewPanel.webviews){
                            webview.webviewPanel.dispose();
                            Helper_sidebar_provider.helper_reset_sidebar_webview_state();
                        }
                    }
                    break;
                case hard_reset_message:
                    vscode.commands.executeCommand("workbench.action.reloadWindow");
                    break;
            }
        }
    }
}