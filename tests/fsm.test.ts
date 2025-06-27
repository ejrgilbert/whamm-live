import {FSM } from '../src/model/fsm';
import fs from 'fs';
import path from 'path';
import toml from 'toml';

const file_path = path.resolve(__dirname, 'fsm.test.toml'); 
describe('testing FSM', () => {

  const config = toml.parse(fs.readFileSync(file_path, 'utf-8'));
  
  // test each file
  for (let key of Object.keys(config)) {

    test('test the mappings', () => {

      // test the section mappings: after which line should each section be inserted
      // test the local mappings [ after which line or which line should locals be inserted for each funcID]
      // test the probe mappings [ for each funcID, which line does the first opcode start and which line does it end]
      // test the func mappings [ for each funcID, which line is the func declaration]
      for (let mapping_type of ["section_to_line_mapping", "func_mapping", "probe_mapping", "local_mapping"]){

        const temp_map = objToMap(config[key][mapping_type]);
        let expected_map = mapWithNumberKeys(temp_map);
        let instance = load_instance(key, config);

        expect(instance[mapping_type]).
          toMatchObject(
            expected_map);
      }
    });

}
});

// Test helper methods
function load_instance(toml_key: string, config: any){

  const wat_file_path = path.resolve(__dirname, 'wat', config[toml_key]["file_name"]); 
  let file_string = fs.readFileSync(wat_file_path, 'utf-8')
  let instance = new FSM(file_string);
  instance.run();

  return instance;
}

function objToMap(object: object){
  return new Map(Object.entries(object));
}

function mapWithNumberKeys(map: Map<string, number>){
  return new Map(Array.from(map.entries()).map(([key, value]) => [parseInt(key), value]));
}

