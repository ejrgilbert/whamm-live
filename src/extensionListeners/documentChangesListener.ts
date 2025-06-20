import * as vscode from 'vscode';
import { isExtensionActive } from './listenerHelper';
import { ExtensionContext } from '../extensionContext';
import { WhammWebviewPanel } from '../user_interface/webviewPanel';

export function shouldUpdateModel(): boolean{
    // The extension should be active and we must be making changes 
    // to the selected whamm file for us to update the model
    return isExtensionActive()
        && ExtensionContext.context.workspaceState.get
            ('whamm-file') == vscode.window.activeTextEditor?.document.uri.fsPath;
}

// Is only called when we NEED to update the model
export function handleDocumentChanges(){
    // TODO
}