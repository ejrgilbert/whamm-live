import * as vscode from 'vscode';
import { WhammWebviewPanel } from '../user_interface/webviewPanel';
import { ExtensionContext } from '../extensionContext';

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
            && (WhammWebviewPanel.number_of_webviews >= 1))
}