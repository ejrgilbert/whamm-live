import fs from 'fs';
import path from 'path';
import toml from 'toml';
import {BestEffortHighlight} from '../src/extensionListeners/utils/bestEffortHighlight';
import { span } from '../src/model/types';
import { ModelHelper } from '../src/model/utils/model_helper';

const toml_file_path = path.resolve(__dirname, 'best_effort_highlight.test.toml'); 
const config = toml.parse(fs.readFileSync(toml_file_path, 'utf-8'));
  

describe('testing Best effort highlighting class', () => {

  for (let key of Object.keys(config)) {
    if (config[key]["test"] === "unionize_whamm_spans"){
      test('test the `unionize_whamm_spans`', () => {
        let spans: span[] = config[key].spans;
        let span = BestEffortHighlight.unionize_whamm_spans(spans, ModelHelper.create_jagged_array(config[key]["jagged_array"]));
        expect(JSON.stringify(span)).toBe(
          JSON.stringify(config[key]["expected"])
        );
      });
    }
  }
});