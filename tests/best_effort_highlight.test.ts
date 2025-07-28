import fs from 'fs';
import path from 'path';
import toml from 'toml';
import {BestEffortHighlight} from '../src/extensionListeners/utils/bestEffortHighlight';
import { jagged_array, span, WhammLiveInjection } from '../src/model/types';
import { ModelHelper } from '../src/model/utils/model_helper';
import { Types } from '../src/whammServer';

const toml_file_path = path.resolve(__dirname, 'best_effort_highlight_run.test.toml'); 
const config = toml.parse(fs.readFileSync(toml_file_path, 'utf-8'));
  

describe('testing Best effort highlighting class `unionize_whamm_spans` method', () => {

  for (let key of Object.keys(config)) {

    if (config[key]["test"] === "unionize_whamm_spans"){
      test('test the `unionize_whamm_spans`', () => {
        let spans: span[] = config[key].spans;
        let span = BestEffortHighlight.unionize_whamm_spans(spans, ModelHelper.create_jagged_array(config[key]["jagged_array"]));
        expect(JSON.stringify(span)).toBe(
          JSON.stringify(config[key]["expected"])
        );
      });

    } else if (config[key]["test"] === "unionize_whamm_spans_error"){
      test('test the `unionize_whamm_spans_error`', () => {
        let spans: span[] = config[key].spans;
        try {
          // expect to throw an error
            BestEffortHighlight.unionize_whamm_spans(spans, ModelHelper.create_jagged_array(config[key]["jagged_array"]));
            expect(true).toBe(false);
        } catch (e){
            expect(e.message.startsWith("Whamm unionize error")).toBe(true);
        }
      });
    }
  }
});

describe('testing Best effort highlighting class `run` method', () => {

  for (let key of Object.keys(config)) {

    if (config[key]["test"] === "run_error"){
      test('test the `run` method\'s error messages', () => {
        let error_message = config[key]["message"];
        var injections = [];
        if (error_message === "Expected sorted whamm live injections"){
          var injections = [create_dummy_whamm_live_injection(create_dummy_whamm_span(1,3, 2,1)),
                          create_dummy_whamm_live_injection(create_dummy_whamm_span(1,1, 2,1))]

        } else if (error_message === "Expected whamm span value"){
          var injections = [create_dummy_whamm_live_injection()];
        }
        check_for_error(error_message, injections, ModelHelper.create_jagged_array(config[key]["jagged_array"]));
      });
    }
  }
});

function create_dummy_whamm_live_injection(whamm_span: null | span = null): WhammLiveInjection{
  return { type: Types.WhammDataType.importType, mode: null, code: [], id: 0,
    wat_range: { l1: 0, l2: 0},
    whamm_span: whamm_span,
  };
}

function create_dummy_whamm_span(l1: number, c1: number, l2: number, c2: number): span{
  return {lc0: {l: l1, c:c1}, lc1: {l: l2, c: c2}};
}

function check_for_error(error_message: string, injections: WhammLiveInjection[], jagged_array: jagged_array){
  try {
    let values = BestEffortHighlight.run(injections, jagged_array);
    expect(true).toBe(false);
  } catch (error) {
    expect(error.message.startsWith(error_message)).toBe(true);
  }
}
