// Gutter for codemirror to show the related
// local injections, opBodyProbe injections and funcProbe injections

/**
 * Followed this guide: https://codemirror.net/examples/gutter/
 */

import {EditorView, GutterMarker, gutter} from "@codemirror/view"
import {type injection_circle, type valid_model} from "../api_response.svelte"
import {StateField, StateEffect, RangeSetBuilder} from "@codemirror/state"

// `injectionCircleEffect` contains all of my dangling injections
export const injectionCircleEffect = StateEffect.define<Record<number, injection_circle[]>>();
export const clearCirclesEffect = StateEffect.define();

// State field which will be updated with the `injectionCircleEffect`
// the field is a mapping from line number to all the different `injection_circle` objects we need to show at that line
const injectionCircleState = StateField.define<Map<number, injection_circle[]>>({
  create() { return new Map() },
  update(oldMap, transaction) {
    for (let effect of transaction.effects) {
      
    // Only care about injectionCircleEffect
      if (effect.is(injectionCircleEffect)) {
        const new_map = new Map<number, injection_circle[]>()
        const record = effect.value
        for (const key in record) {
          const line_number = Number(key);
          new_map.set(line_number, record[key])
        }
        return new_map

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
  // container to contain the entire div for the line
	let container = this.load_container();
	for (const { color, body } of this.circles) {

	      // each div for each circle
	      	let circle_element = this.load_circle_element(color);
	       	let hidden_body_element = this.load_hidden_body_element(body);
	      	circle_element.appendChild(hidden_body_element);

	      // add event listenet to show the hidden div on hover
	      	circle_element.addEventListener("mouseenter", ()=>{
		hidden_body_element.style.display = "block";
	      });
	      	circle_element.addEventListener("mouseleave", ()=>{
		hidden_body_element.style.display = "none";
	      });
		container.appendChild(circle_element);
			}

		return container
	}

  private load_container(): HTMLDivElement{
		const container = document.createElement("div")
		container.style.display = "flex"
		container.style.gap = "2px"
    return container;
  }
  private load_circle_element(color: string):HTMLDivElement{
			const circle = document.createElement("div");
			circle.style.width = "10px";
			circle.style.height = "10px";
			circle.style.borderRadius = "50%";
			circle.style.backgroundColor = color;
      return circle
  }

  private load_hidden_body_element(body: string): HTMLDivElement{
      // div to show on hover which contains the body of the injection
			const hidden_body = document.createElement("div");
      hidden_body.style.display = "none";
      hidden_body.style.position = "absolute";
      hidden_body.style.background = "beige";
      hidden_body.style.fontSize = "smaller";
      hidden_body.style.border= "1px solid";
      hidden_body.style.width= "max-content";
      hidden_body.style.padding= "10%";
      hidden_body.innerHTML = body;
      return hidden_body
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
        effects: injectionCircleEffect.of(model.wat_to_injection_circle)
    })
}
