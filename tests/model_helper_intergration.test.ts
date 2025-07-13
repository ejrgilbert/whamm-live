import fs from 'fs';
import path from 'path';
import {ModelHelper} from '../src/model/utils/model_helper';
import { Types } from '../src/whammServer';
import { FSM } from '../src/model/fsm';
import toml from 'toml';
import { InjectionRecord, InjectionRecordDanglingType, InjectType, span, WatLineRange, WhammDataTypes, WhammLiveInjection, WhammLiveInjections } from '../src/model/types';

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
    // 0th element is index for the injections to be injected in wat
    // 1st element is index for the injections to not be injected in wat
    let indexes: [number, number] = [0, 0];
    let lines_injected= 0;

    // The idea is to compare every `whamm_api_injection` with its corresponding `whamm_live_injection` object
    // instance that is in the `response` variable
    // It is pretty much a one-on-one comparison

    for (let inject_type of WhammDataTypes){
            let whamm_api_injections = injection_mappings.get(inject_type);
            if (whamm_api_injections){

                for (let whamm_api_injection of whamm_api_injections){
                    let whamm_live_instance: WhammLiveInjection = get_whamm_live_instance(inject_type, response, indexes);

                    // Check the injection type
                    expect(whamm_live_instance.type).toBe(whamm_api_injection.dataType);
                    
                    let [injection_record, original_wat] = get_injection_record_and_fsm_wat_line_number(whamm_api_injection, injected_fsm, response)
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

                          // Check the func wat range
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
                        case Types.WhammDataType.funcProbeType:
                        case Types.WhammDataType.localType:
                        case Types.WhammDataType.opProbeType:
                          {
                            let l1 =original_wat;
                            let l2 = original_wat;
                            let record = injection_record as InjectionRecordDanglingType;

                            // If the wat values are from the fsm, then that doesn't account for the newly injected lines
                            // so, we need to add those values
                            if (!response.injected_funcid_wat_map.has(record.targetFid)){
                              l1 = l1 + lines_injected;
                              l2 = l2 + lines_injected;
                            }
                            expect(whamm_live_instance.wat_range).toMatchObject({
                                  l1: l1,
                                  l2: l2
                            } as WatLineRange);
                          }
                          break;
                        // All the other injections should only inject **one** line
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

// Validate to make sure the whamm live injection object has the same span value(s) as its corresponding injection record
// that we recieved from the API response
function validate_whamm_span(whamm_live_instance: WhammLiveInjection, injection_record: InjectionRecord | undefined){
  if (injection_record && injection_record.cause["_tag"] != 'whamm'){
    let whamm_span = injection_record.cause["_value"];
    expect(whamm_live_instance.whamm_span).toMatchObject({
        lc0: {l:whamm_span.lc0.l, c: whamm_span.lc0.c},
        lc1: {l:whamm_span.lc1.l, c: whamm_span.lc1.c},
    } as span)
  }
}

// Get the correct injection record and also the corresponding wat line number using the fsm
// Also handles wat line values for locals, funcProbes and opBodyProbes which are inserted by whamm using the injected funcid to wat mapping if the funcID doesn't exist in the FSM
function get_injection_record_and_fsm_wat_line_number(record: Types.WhammInjection, fsm: FSM, response: WhammLiveInjections) : [InjectionRecord | undefined, undefined| number]{
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
      case Types.WhammDataType.funcProbeType:
        {
          let func_probe_data = record.funcProbeData;
          if (func_probe_data){
            let wat_line = fsm.func_mapping.get(func_probe_data.targetFid);
            if (wat_line === undefined) wat_line = response.injected_funcid_wat_map.get(func_probe_data.targetFid)?.func;
            return [record.funcProbeData, wat_line];
          }
        }
        break;
        case Types.WhammDataType.opProbeType:
        {
          let op_probe_data = record.opProbeData;
          let wat_line;

          if (op_probe_data){
            let probe_range = fsm.probe_mapping.get(op_probe_data.targetFid);
            
            // look at the injected funcid mapping incase it is there
            if (probe_range === undefined){
              wat_line = response.injected_funcid_wat_map.get(op_probe_data.targetFid)?.probe[0];
              if (wat_line !== undefined) wat_line = wat_line + op_probe_data.targetOpcodeIdx;

            } else wat_line = probe_range[0] + op_probe_data.targetOpcodeIdx

            return [op_probe_data, wat_line];
          }
        }
        break;
        case Types.WhammDataType.localType:
        {
          let local_data = record.localData;
          if (local_data){
            let wat_line = fsm.local_mapping.get(local_data.targetFid);
            if (wat_line === undefined) wat_line = response.injected_funcid_wat_map.get(local_data.targetFid)?.local;
            return [local_data, wat_line];
          }
        }
        break;
  }
  return [undefined, undefined];

}

// Get the correct whamm live injection object from `response` since it contains two arrays:
// one for injections to inject in the wat file and one for injections to show as dangling pointers
function get_whamm_live_instance(inject_type: Types.WhammDataType, response: WhammLiveInjections, indexes: [number, number]){
  switch (inject_type){
    case Types.WhammDataType.opProbeType:
    case Types.WhammDataType.funcProbeType:
    case Types.WhammDataType.localType:
      return response.other_injections[(indexes[1])++];
    default:
      return response.injecting_injections[(indexes[0])++];
  }
}