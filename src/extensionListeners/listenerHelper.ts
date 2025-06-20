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

export function isExtensionActive():boolean{
    return ((ExtensionContext.context.workspaceState.get('whamm-live') !== undefined)
            && (WhammWebviewPanel.number_of_webviews >= 1))
}