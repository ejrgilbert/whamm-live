import * as vscode from 'vscode';
import { whammServer } from './whammServer';

export class ExtensionContext{
	static context: vscode.ExtensionContext; 
	static api: whammServer.Exports;

	static get_editors(): vscode.TextEditor[]{
        return vscode.window.visibleTextEditors.filter(e => e.document.uri.fsPath === ExtensionContext.context.workspaceState.get("whamm-file"));
	}

    static async openWatInNewColumn(text: string) {
        const doc = await vscode.workspace.openTextDocument({ content: text, language: 'wat'});
        await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside, preview: false, preserveFocus: false});
    }

}
