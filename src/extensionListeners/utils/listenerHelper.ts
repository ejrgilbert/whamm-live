import * as vscode from 'vscode';
import { WasmWebviewPanel } from '../../user_interface/wasmWebviewPanel';
import { ExtensionContext } from '../../extensionContext';
import { WizardWebviewPanel } from '../../user_interface/wizardWebviewPanel';

export function debounce(callback: Function, delay: number){
  let timer: number;
  return ()=>{
    clearTimeout(timer)
    timer = setTimeout(() => {
      callback();
    }, delay)
  }    
}

// The workspace state must have a whamm-live selected and there must be at least
// one webview open for our extension to be "active"
export function isExtensionActive():boolean{
    return ((ExtensionContext.context.workspaceState.get('whamm-file') !== undefined)
            && (WasmWebviewPanel.number_of_webviews >= 1 || (WizardWebviewPanel.webview !== null)))
}

export class DiagnosticCollection{
  static collection: vscode.DiagnosticCollection;

  static create_collection(){
    DiagnosticCollection.collection = vscode.languages.createDiagnosticCollection();
    ExtensionContext.context.subscriptions.push(DiagnosticCollection.collection);
  }
}