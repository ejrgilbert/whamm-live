import * as vscode from 'vscode';
import { whammServer } from './whammServer';

export class ExtensionContext{
	static context: vscode.ExtensionContext; 
	static api: whammServer.Exports;

	static get_editor(): undefined | vscode.TextEditor{
        return vscode.window.visibleTextEditors.find(e => e.document.uri.fsPath === ExtensionContext.context.workspaceState.get("whamm-file"));
	}
}
