import fs from 'fs';
import path from 'path';
import toml from 'toml';
import {span} from '../src/model/types';
import {ModelHelper} from '../src/model/utils/model_helper';
import {Node} from '../src/model/utils/cell';

const toml_file_path = path.resolve(__dirname, 'cell.test.toml'); 
describe('testing whamm span size', () => {

  const config = toml.parse(fs.readFileSync(toml_file_path, 'utf-8'));
  for (let key of Object.keys(config)) {
    if (config[key]["test"] === "calculate_span_size"){
        test('test the span size value in columns', () => {

            // create valid span
            let lc0 = config[key]["lc0"];
            let lc1 = config[key]["lc1"];
            let span = {
                lc0: {l: lc0.l, c:lc0.c},
                lc1: {l: lc1.l, c:lc1.c},
            } as span;

            // create jagged array based on string contents
            let jagged_array = ModelHelper.create_jagged_array(config[key]["string_contents"]);
            let span_size = Node.calculate_span_size(span, jagged_array);
            expect(span_size).toBe(config[key]["span_size"]);
        });
}
}
});