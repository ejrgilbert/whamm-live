import * as vscode from 'vscode';
import { span } from "../model/types";
import { ExtensionContext } from '../extensionContext';

export class LineHighlighterDecoration{

    static decorations: vscode.TextEditorDecorationType[] = [];
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

    static highlight_whamm_file(whamm_span: span, color_index: number){

        const editor = vscode.window.activeTextEditor;
        if (!editor) return
        if (editor.document.uri.fsPath !== ExtensionContext.context.workspaceState.get("whamm-file")) return;

        const start = new vscode.Position(whamm_span.lc0.l - 1, whamm_span.lc0.c -1);
        const end = new vscode.Position(whamm_span.lc1.l - 1, whamm_span.lc1.c -1);
        const range = new vscode.Range(start, end);

        let decorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: LineHighlighterDecoration.highlightColors[color_index],
            isWholeLine: false,
        })
        LineHighlighterDecoration.decorations.push(decorationType);
        editor.setDecorations(decorationType, [{range}]);
    }
    
    static clear_all_decorations(editor: vscode.TextEditor | undefined){
        if (editor){
            for (let decorationType of LineHighlighterDecoration.decorations){
                editor.setDecorations(decorationType, []);
            }
            LineHighlighterDecoration.decorations = [];
        }
    }
}