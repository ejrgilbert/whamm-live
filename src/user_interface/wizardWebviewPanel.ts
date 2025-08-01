import * as vscode from 'vscode';
import { Types } from '../whammServer';
import { WebviewPanel } from './webviewPanel';

export class WizardWebviewPanel extends WebviewPanel{

    // model which contains all the necessary information for APImodel data
    // model @todo

    static webview: WizardWebviewPanel | null;

    async init(){

        if (WizardWebviewPanel.webview !== null) throw new Error("Cannot have more then one wizard webview!")

        WizardWebviewPanel.addPanel(this);
        // Handle disposing of the panel afterwards
        this.webviewPanel.onDidDispose(()=>{
                WizardWebviewPanel.removePanel(this);
        })

        // setup model: @todo
        let [success, message] = [true, "success"];
        if (!success) {
            vscode.window.showErrorMessage(message);
            this.webviewPanel.dispose();
        }
    }

    // Static methods
    private static addPanel(webview: WizardWebviewPanel){
        WizardWebviewPanel.webview = webview;
    }

    static removePanel(webview: WizardWebviewPanel){
        WizardWebviewPanel.webview = null;
        WebviewPanel.endPanel(Types.WhammTarget.Wizard());
    }

    // Main method to load the html
    async setupHTML(){
        super.loadHTML();
        super.postMessage({
                command: 'init-data',
                show_wizard: false,
                // @todo send wat content
        });
        this.addListeners();
    }

    addListeners() {
        // @todo- cursor changes and code mirror updated
    }

}