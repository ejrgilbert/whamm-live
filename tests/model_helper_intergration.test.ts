import fs from 'fs';
import path from 'path';
import {ModelHelper} from '../src/model/utils/model_helper';
import { Types } from '../src/whammServer';
import { FSM } from '../src/model/fsm';
import toml from 'toml';
import { InjectionRecord, InjectType, span, WatLineRange, WhammLiveInjection, WhammLiveInjections } from '../src/model/types';

const toml_file_path = path.resolve(__dirname, 'model_helper.test.toml'); 
const config = toml.parse(fs.readFileSync(toml_file_path, 'utf-8'));

/*
  Integration testing for `create_whamm_live_injection_instances` method
  Will test a bunch of helper methods together:
    1. `create_whamm_data_type_to_whamm_injection_mapping` method tested
    2. `update_fsm_funcIDs` method tested
    3. And finally, `create_whamm_live_injection_instances` method tested
*/
describe('testing Model Helper\'s static `create_whamm_live_injection_instances` method', () => {
      
  for (let key of Object.keys(config)) {
    if (config[key]["test"] === "create_whamm_live_injection_instances"){
      test('integration testing for model helper', () => {
        
        // load the FSM
        const wat_file_path = path.resolve(__dirname, 'wat', config[key]["app"]); 
        let fsm = new FSM(fs.readFileSync(wat_file_path, 'utf-8'));
        fsm.run();

        // Test whether the mappings are as expected for each inject type
        let data: Types.InjectionPair[]= load_whamm_api_response(config[key].app, config[key].script)
        let injection_mappings = ModelHelper.create_whamm_data_type_to_whamm_injection_mapping(data);
        // Initially test that all the mappings are as expected
        for (let injection_mapping of injection_mappings){
          for (let injection of injection_mapping[1]){
            expect(injection.dataType).toBe(injection_mapping[0]);
          }
        }

        /*
         Check for injected FSM funcID values
        */
        let injected_fsm = ModelHelper.update_fsm_funcIDs(fsm, injection_mappings);
        let import_functions_injected = config[key]["number_of_import_functions_injected"];
        type FSMKey = keyof FSM;

        // test for local_mapping, probe_mapping and func_mapping only since these are the only ones
        // that need to have their funcID updated
        let mappings: FSMKey[] = ["local_mapping", "probe_mapping", "func_mapping"];
        for (let mapping of mappings){
          let map = fsm[mapping];
          let new_map = injected_fsm[mapping];

          if (map instanceof Map && new_map instanceof Map){
            for (const [old_funcid, value] of map.entries()){
              expect(value).toBe(new_map.get(old_funcid + import_functions_injected));
            }
          }
        }

        // Create the whamm live injection object instances
        let response = ModelHelper.create_whamm_live_injection_instances(injected_fsm, injection_mappings)
        // test the injections and whether their wat ranges are what we expect
        validate_whamm_live_injection_instances(injected_fsm, injection_mappings, response)

      });
    }
    }
});

// Test helper methods
function load_whamm_api_response(app_name: string, script: string): Types.InjectionPair[]{
  const response_file_path = path.resolve(__dirname, 'whamm_api_responses',script.split('.')[0], `${app_name.split('.')[0]}.json`); 
  let file_string = fs.readFileSync(response_file_path, 'utf-8')
  const data = JSON.parse(file_string);
  return data;
}

function validate_whamm_live_injection_instances(injected_fsm: FSM, injection_mappings: Map<string, Types.WhammInjection[]>, response: WhammLiveInjections){
    // validate in section order
    let injection_index = 0;
    let lines_injected= 0;

    for (let inject_type of
        [Types.WhammDataType.typeType, Types.WhammDataType.importType, Types.WhammDataType.tableType,
           Types.WhammDataType.memoryType, Types.WhammDataType.globalType, Types.WhammDataType.exportType, Types.WhammDataType.elementType,
           Types.WhammDataType.functionType, Types.WhammDataType.activeDataType, Types.WhammDataType.passiveDataType]){

            let whamm_api_injections = injection_mappings.get(inject_type);
            if (whamm_api_injections){
                for (let whamm_api_injection of whamm_api_injections){
                    let whamm_live_instance = response.injecting_injections[injection_index++];

                    // Check the injection type
                    expect(whamm_live_instance.type).toBe(whamm_api_injection.dataType);
                    
                    let [injection_record, original_wat] = get_injection_record_and_fsm_wat_line_number(whamm_api_injection, injected_fsm)
                    expect(injection_record).not.toBe(undefined);
                    expect(original_wat).not.toBe(undefined);
                    if (injection_record && original_wat){

                      // Test the instance object's whamm cause span
                      validate_whamm_span(whamm_live_instance, injection_record);

                      // Check the instance object's wat range
                      switch(inject_type){
                        case Types.WhammDataType.functionType:{
                          let func_record = injection_record as Types.FunctionRecord;

                          // calculate all the line mappings for the injected function
                          let l1 = original_wat + lines_injected + 1;
                          let func_lines_injected = func_record.body.length + ((func_record.locals.length > 0) ? 1 : 0) + 2;
                          let l2= l1 + func_lines_injected -1;
                          let local_line = (func_record.locals.length === 0) ? l1 : l1+1;

                          expect(whamm_live_instance.wat_range).toMatchObject({l1: l1,l2: l2});
                          lines_injected = lines_injected + func_lines_injected;
                          
                          // check for injected funcid_wat_map values
                          expect(response.injected_funcid_wat_map.get(func_record.id)).toMatchObject({
                            local: local_line,
                            probe: [local_line+1,l2],
                            func: l1
                          })
                        }
                          break;
                        default:
                          expect(whamm_live_instance.wat_range).toMatchObject({
                                l1: original_wat + (++lines_injected),
                                l2: original_wat + lines_injected
                          } as WatLineRange);
                        break;
                      }
                  }
                }
            }
    }
}

function validate_whamm_span(whamm_live_instance: WhammLiveInjection, injection_record: InjectionRecord | undefined){
  if (injection_record && injection_record.cause["_tag"] != 'whamm'){
    let whamm_span = injection_record.cause["_value"];
    expect(whamm_live_instance.whamm_span).toMatchObject({
        lc0: {l:whamm_span.lc0.l, c: whamm_span.lc0.c},
        lc1: {l:whamm_span.lc1.l, c: whamm_span.lc1.c},
    } as span)
  }
}

function get_injection_record_and_fsm_wat_line_number(record: Types.WhammInjection, fsm: FSM) : [InjectionRecord | undefined, undefined| number]{
  switch (record.dataType) {
      case Types.WhammDataType.typeType:
        return [record.typeData, fsm.section_to_line_mapping.get(InjectType.Type)];
      case Types.WhammDataType.importType:
        return [record.importData, fsm.section_to_line_mapping.get(InjectType.Import)];
      case Types.WhammDataType.tableType:
        return [record.tableData, fsm.section_to_line_mapping.get(InjectType.Table)];
      case Types.WhammDataType.memoryType:
        return [record.memoryData, fsm.section_to_line_mapping.get(InjectType.Memory)];
      case Types.WhammDataType.globalType:
        return [record.globalData, fsm.section_to_line_mapping.get(InjectType.Global)];
      case Types.WhammDataType.exportType:
        return [record.exportData, fsm.section_to_line_mapping.get(InjectType.Export)];
      case Types.WhammDataType.elementType:
        return [record.elementData, fsm.section_to_line_mapping.get(InjectType.Element)];
      case Types.WhammDataType.functionType:
        return [record.functionData, fsm.section_to_line_mapping.get(InjectType.Func)];
      case Types.WhammDataType.activeDataType:
        return [record.activeData, fsm.section_to_line_mapping.get(InjectType.Data)];
      case Types.WhammDataType.passiveDataType:
        return [record.passiveData, fsm.section_to_line_mapping.get(InjectType.Data)];
  }
  return [undefined, undefined];
}