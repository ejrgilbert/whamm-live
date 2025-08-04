import { StateEffect, StateField, RangeSetBuilder } from "@codemirror/state";
import { Decoration, EditorView, type DecorationSet } from "@codemirror/view";
import type { line_highlights_info } from "../data/highlight_data.svelte";

const setTempLineBackgrounds = StateEffect.define<line_highlights_info>();
const clearTempLineBackgrounds = StateEffect.define();

export const tempLineBackgroundField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(deco, tr) {
    for (let e of tr.effects) {
      if (e.is(setTempLineBackgrounds)) {
        const builder = new RangeSetBuilder<Decoration>();
        for (let [lineStr, color] of Object.entries(e.value)) {
          let lineNum = parseInt(lineStr);
          if (lineNum < 1 || lineNum > tr.startState.doc.lines) continue;
          const line = tr.startState.doc.line(lineNum);
          builder.add(line.from, line.from, 
            Decoration.line({
              attributes: { style: `background-color: ${color}` }
              }));
        }
        deco = builder.finish();
      }
      if (e.is(clearTempLineBackgrounds)) {
        deco = Decoration.none;
      }
    }
    return deco.map(tr.changes);
  },
  provide: f => EditorView.decorations.from(f)
});

export function setTempBackgroundColorForLines(view: EditorView, record: line_highlights_info) {
  view.dispatch({
    effects: setTempLineBackgrounds.of(record)
  });
}

export function clearTempBackgroundColors(view: EditorView) {
  view.dispatch({
    effects: clearTempLineBackgrounds.of(null)
  });
}

