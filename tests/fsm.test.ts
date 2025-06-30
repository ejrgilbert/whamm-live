import {FSM } from '../src/model/fsm';
import fs from 'fs';
import path from 'path';
import toml from 'toml';

const toml_file_path = path.resolve(__dirname, 'fsm.test.toml'); 
const error_toml_file_path = path.resolve(__dirname, 'fsm_errors.test.toml'); 
describe('testing FSM', () => {

  const config = toml.parse(fs.readFileSync(toml_file_path, 'utf-8'));
  
  // test each file
  for (let key of Object.keys(config)) {

    test('test the mappings', () => {

      // test the section mappings: after which line should each section be inserted
      // test the local mappings [ after which line or which line should locals be inserted for each funcID]
      // test the probe mappings [ for each funcID, which line does the first opcode start and which line does it end]
      // test the func mappings [ for each funcID, which line is the func declaration]
      for (let mapping_type of ["section_to_line_mapping", "func_mapping", "probe_mapping", "local_mapping"]){

        let mapping_value =  config[key][mapping_type];
        if (mapping_value){
          const temp_map = objToMap(mapping_value);
          let expected_map = mapWithNumberKeys(temp_map);
          let instance = load_instance(key, config);
          instance.run();

          expect(instance[mapping_type]).
            toMatchObject(
              expected_map);
        }
    }
    });

}
});

// Test for errors
describe('testing FSM errors', () => {

  const config = toml.parse(fs.readFileSync(error_toml_file_path, 'utf-8'));
  
  // test each file
  for (let key of Object.keys(config)) {
      if (config[key]["error"])
        test('test for error', () => {
            let instance = load_instance(key, config);
            expect(()=>{instance.run()}).toThrow(Error);
        });
}
});

// Test for folding expressions
describe('testing FSM fold expressions', () => {

  const config = toml.parse(fs.readFileSync(error_toml_file_path, 'utf-8'));
  
  // test 'fold_expression.wat'
  // should be no errors in running but mapped values should be wrong
  test('test for error', () => {
            let instance = load_instance('fold_expression', config);
            instance.run();
            
          for (let mapping_type of ["probe_mapping", "local_mapping"]){
                const temp_map = objToMap(config['fold_expression'][mapping_type]);
                let expected_map = mapWithNumberKeys(temp_map);
                expect(instance[mapping_type]).not.toMatchObject(expected_map);
          }
        });
});

// Test other values like current_line_number if present in test files 
describe('testing FSM field values', () => {

  const config = toml.parse(fs.readFileSync(toml_file_path, 'utf-8'));
  
  for (let key of Object.keys(config)) {

    test('test for current_line_number', () => {

      for (let mapping_type of ["current_line_number"]){

        let mapping_value =  config[key][mapping_type];
        if (mapping_value){
          let instance = load_instance(key, config);
          instance.run();
          expect(instance[mapping_type]).
            toBe(
              mapping_value);
        }
    }
    });
  }
});



// Test helper methods
function load_instance(toml_key: string, config: any){

  const wat_file_path = path.resolve(__dirname, 'wat', config[toml_key]["file_name"]); 
  let file_string = fs.readFileSync(wat_file_path, 'utf-8')
  let instance = new FSM(file_string);
  return instance;
}

function objToMap(object: object){
  return new Map(Object.entries(object));
}

function mapWithNumberKeys(map: Map<string, number>){
  return new Map(Array.from(map.entries()).map(([key, value]) => [parseInt(key), value]));
}

