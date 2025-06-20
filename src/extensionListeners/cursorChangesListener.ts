import * as vscode from 'vscode';
import { isExtensionActive } from './listenerHelper';
import { ExtensionContext } from '../extensionContext';
import { Model } from '../model/model';
import { shouldUpdateModel } from './documentChangesListener';

export function shouldUpdateView():boolean{
    // shouldUpdateModel also works here because the extension will be active
    // and the user would be on the active whamm file
    // However, shouldUpdateModel is not used to avoid confusion
    return (!Model.whamm_file_changing)
        && isExtensionActive()
        && ExtensionContext.context.workspaceState.get
            ('whamm-file') == vscode.window.activeTextEditor?.document.uri.fsPath;
}

export function handleCursorChange(){
    if (Model.whamm_file_changing) return;
    console.log('fired view');
}