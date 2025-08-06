import * as vscode from 'vscode';
import { Types } from '../whammServer';
import { WebviewPanel } from './webviewPanel';
import { APIWizardModel } from '../model/api_model/model_wizard';
import { LineHighlighterDecoration } from '../extensionListeners/utils/lineHighlighterDecoration';

export class WizardWebviewPanel extends WebviewPanel{

    static webview: WizardWebviewPanel | null = null;
    model: APIWizardModel;

    constructor(){
        super("Target: Wizard");
        this.model = new APIWizardModel(this);
    }

    async init(){

        if (WizardWebviewPanel.webview !== null) throw new Error("Cannot have more then one wizard webview!")

        WizardWebviewPanel.addPanel(this);
        // Handle disposing of the panel afterwards
        this.webviewPanel.onDidDispose(()=>{
                WizardWebviewPanel.removePanel(this);
        })

        let [success, message] = await this.model.setup();
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
                show_wizard: true,
        });
        this.addListeners();
    }

    // init the wat content after the **first** model update
    initWizardComplete(){
        super.postMessage({
            command: 'init-wat-wizard',
        })
    }

    addListeners() {
        // @todo- cursor changes line highlight 
        this.webviewPanel.webview.onDidReceiveMessage(
            message => {
                switch (message.command){
                    case 'codemirror-code-updated':
                        this.model.codemirror_code_updated = true;
                        break;
                    case 'wat-line-highlight':
                        LineHighlighterDecoration.highlight_whamm_live_injection(this, message.line);
                        break;
                }
            }
        )
    }

}