import { StateEffect, StateField, RangeSetBuilder } from "@codemirror/state";
import { Decoration, EditorView, type DecorationSet } from "@codemirror/view";

/**
 * Credit: https://blog.pamelafox.org/2022/07/line-highlighting-extension-for-code.html
 */

const setLineBackgrounds = StateEffect.define<{ lines: number[], className: string }>();
const clearLineBackgrounds = StateEffect.define();

export const lineBackgroundField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(deco, tr) {
    for (let e of tr.effects) {
      if (e.is(setLineBackgrounds)) {
        const builder = new RangeSetBuilder<Decoration>();
        for (const lineNum of e.value.lines) {
          const line = tr.state.doc.line(lineNum);
          builder.add(line.from, line.from, Decoration.line({ class: e.value.className }));
        }
        deco = builder.finish();
      }
      if (e.is(clearLineBackgrounds)) {
        deco = Decoration.none;
      }
    }
    return deco;
  },
  provide: f => EditorView.decorations.from(f)
});

export function setBackgroundColorForLines(view: EditorView, lines: number[], className: string) {
  view.dispatch({
    effects: setLineBackgrounds.of({ lines, className })
  });
}

export function clearBackgroundColors(view: EditorView) {
  view.dispatch({
    effects: clearLineBackgrounds.of(null)
  });
}

