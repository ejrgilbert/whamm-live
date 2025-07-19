import * as vscode from 'vscode';
import { type highlights_info, span } from "../model/types";
import { ExtensionContext } from '../extensionContext';
import { WhammWebviewPanel } from '../user_interface/webviewPanel';

export class LineHighlighterDecoration{

    static decorations: vscode.TextEditorDecorationType[] = [];
    static colors: string[] = [
        "rgba(76, 175, 80, 1)",
        "rgba(244, 67, 54, 1)",
        "rgba(255, 235, 59, 1)",
        "rgba(142, 36, 170, 1)",
        "rgba(255, 152, 0, 1)",
        "rgba(121, 85, 72, 1)",
        "rgba(233, 30, 99, 1)",
        "rgba(158, 158, 158, 1)",
        "rgba(0, 150, 136, 1)",
    ]

    static highlightColors: string []= [
            "rgba(76, 175, 80, 0.2)",    // soft green
            "rgba(244, 67, 54, 0.4)",    // soft red
            "rgba(255, 235, 59, 0.2)",   // soft yellow
            "rgba(142, 36, 170, 0.3)", // soft violet
            "rgba(255, 152, 0, 0.3)",    // soft orange
            "rgba(121, 85, 72, 0.4)",     // soft brown
            "rgba(233, 30, 99, 0.3)",     // rose pink
            "rgba(158, 158, 158, 0.3)",   // neutral gray
            "rgba(0, 150, 136, 0.3)",     // teal-green
    ]

    static highlight_whamm_file(whamm_span: span, color: string){

        const editor = vscode.window.activeTextEditor;
        if (!editor) return
        if (editor.document.uri.fsPath !== ExtensionContext.context.workspaceState.get("whamm-file")) return;

        const start = new vscode.Position(whamm_span.lc0.l - 1, whamm_span.lc0.c -1);
        const end = new vscode.Position(whamm_span.lc1.l - 1, whamm_span.lc1.c -1);
        const range = new vscode.Range(start, end);

        let decorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: color,
            isWholeLine: false,
        })
        LineHighlighterDecoration.decorations.push(decorationType);
        editor.setDecorations(decorationType, [{range}]);
    }

    static highlight_wasm_webview_lines(webview: WhammWebviewPanel, data: highlights_info){
        webview.webviewPanel.webview.postMessage({
            command: 'temp-line-highlight',
            data: data
        });
    }
    
    static clear_all_decorations(editor: vscode.TextEditor | undefined){
        if (editor){
            for (let decorationType of LineHighlighterDecoration.decorations){
                editor.setDecorations(decorationType, []);
            }
            LineHighlighterDecoration.decorations = [];
            
            this.clear_wasm_line_decorations();
        }
    }

    static clear_wasm_line_decorations(){
        for (let webview of WhammWebviewPanel.webviews){
            LineHighlighterDecoration.highlight_wasm_webview_lines(webview, {});
        }
    }
}