// Gutter for codemirror to show the related
// local injections, opBodyProbe injections and funcProbe injections

/**
 * Followed this guide: https://codemirror.net/examples/gutter/
 */

import {EditorView, GutterMarker, gutter, lineNumbers} from "@codemirror/view"
import {type dangling_injections, type injection_circle, type valid_model} from "../api_response.svelte"
import {StateField, StateEffect, RangeSet, RangeSetBuilder} from "@codemirror/state"

const breakpointEffect = StateEffect.define<{pos: number, on: boolean}>({
  map: (val, mapping) => ({pos: mapping.mapPos(val.pos), on: val.on})
})

// `injectionCircleEffect` contains all of my dangling injections
export const injectionCircleEffect = StateEffect.define<dangling_injections[]>();
export const clearCirclesEffect = StateEffect.define();

// State field which will be updated with the `injectionCircleEffect`
// the field is a mapping from line number to all the different `injection_circle` objects we need to show at that line
const injectionCircleState = StateField.define<Map<number, injection_circle[]>>({
  create() { return new Map() },
  update(oldMap, transaction) {
    for (let effect of transaction.effects) {
      
    // Only care about injectionCircleEffect
      if (effect.is(injectionCircleEffect)) {
        let newMap = new Map<number, injection_circle[]>();
        for (let dangling_injections of effect.value){
            for (let [html_content, line] of dangling_injections.values){
                const existing = newMap.get(line) ?? [];
			    existing.push({ color: dangling_injections.color, body: html_content })
				newMap.set(line, existing)
            }
        }
        return newMap;

      // Clear all the injection circles with this effect
      } else if (effect.is(clearCirclesEffect)){
        return new Map();
      }
    }
    return oldMap
  }
});
// Need to extend the GutterMarker class to handle the DOM side
class injectionCircleMarker extends GutterMarker {
    circles: injection_circle[];

    constructor(circles: injection_circle[]){ 
        super()
        this.circles = circles;
    };

  toDOM() {
		const container = document.createElement("div")
		container.style.display = "flex"
		container.style.gap = "2px"
		container.style.alignItems = "center"
		container.style.justifyContent = "center"

		for (const { color, body } of this.circles) {
			const circle = document.createElement("div")
			circle.style.width = "10px"
			circle.style.height = "10px"
			circle.style.borderRadius = "50%"
			circle.style.backgroundColor = color
			container.appendChild(circle)
		}

		return container
	}
}

export const injectionCircleGutter = [
    injectionCircleState,
    gutter({
	class: "cm-injection-circle-gutter",
	markers(view) {
		const builder = new RangeSetBuilder<GutterMarker>()
		const map = view.state.field(injectionCircleState)
		const maxLine = view.state.doc.lines

		for (const [lineNumber, circles] of map.entries()) {
			if (lineNumber >= 1 && lineNumber <= maxLine) {
				const line = view.state.doc.line(lineNumber)
				builder.add(line.from, line.from, new injectionCircleMarker(circles))
			}
		}

		return builder.finish()
	},
	initialSpacer: () => new injectionCircleMarker([]),
})
];
export function clearInjectedCircles(view: EditorView){
    view.dispatch({
        effects: clearCirclesEffect.of(null)
    })
}

export function addDanglingCircleInjections(view: EditorView, model: valid_model){
    view.dispatch({
        effects: injectionCircleEffect.of([model.func_probes, model.op_body_probes, model.locals])
    })
}