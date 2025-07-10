import { Types } from "../../whammServer";
import { FSM } from "../fsm";
import { InjectType, span, WatLineRange, WhammLiveInjection } from "../types";

export class ModelHelper{

    // Inject wat builds the injected wat content
    // by combining the original wat string and the whamm_injections
    static inject_wat(original: string, whamm_injections: WhammLiveInjection[], number_of_lines_injected: number) :string[]{

        let lines = original.split('\n');
        let injected_wat = new Array(lines.length + number_of_lines_injected);

        for (let whamm_injection of whamm_injections){
            for (let i =whamm_injection.wat_range.l1; i <= whamm_injection.wat_range.l2; i++){
                injected_wat[i-1] = whamm_injection.code[i - whamm_injection.wat_range.l1];
            }
        }
        
        let index = 0;
        for (let i=0; i < injected_wat.length; i++){
            if (injected_wat[i] == undefined && lines[index]?.length > 0){
                injected_wat[i] = lines[index++]
            }
        }
        return injected_wat;
    }

    // Create a mapping from specific inject-type to the vec of related injections from the API response from whamm and wit so that 
    // we can use the injections in sections order based on the line they are going to be injected in w.r.t to the wat file
    // expected order: type, import, table, memory, tag, global, export, elem, (probes), func, data
    static create_whamm_data_type_to_whamm_injection_mapping(whamm_response: Types.InjectionPair[]): Map<string, Types.WhammInjection[]>{
        let mapping: Map<string, Types.WhammInjection[]>= new Map();
        for (let key of Object.keys(Types.WhammDataType)){
            mapping.set(key, []);
        }

        for (let injection_pair of whamm_response){
            for (let injection of injection_pair.injectionValue){
			    mapping.get(Types.WhammDataType[injection.dataType])?.push(injection);
                }
            }
        return mapping;
    }

    // Build a jagged array [ matrix ] based on the input provided
    // every new line becomes a new row and every character in the line gets its own cell
    static create_jagged_array(string_contents: string): null[][]{
        let string_contents_array = string_contents.split('\n');
        let jagged_array: null[][]= new Array(string_contents_array.length);
        for (let i=0; i < jagged_array.length; i++){
            let new_array: null[] = new Array(string_contents_array[i].length);
            jagged_array[i] = new_array;
        }
        return jagged_array;
    }

    // Use the injection mappings created from `ModelHelper.create_whamm_data_type_to_whamm_injection_mapping`
    // to create `WhammLiveInjection` instances. These instances will store their new wat locations
    // This method returns a tuple with the first element being instances that are to be injected in the new wat
    // and the other element being a list of instances that are to **not** be injected and instead be used as dangling references like `funcProbes`, `OpBodyProbes`, `Locals`
    static create_whamm_live_injection_instances(fsm: FSM, whamm_live_mappings: Map<string, Types.WhammInjection[]>): [WhammLiveInjection[], WhammLiveInjection[]]{
        // all the other injections except `funcProbes`, `OpBodyProbes`, `Locals` should update the number_of_lines_injected since they are literally injecting new wat content
        var number_of_lines_injected = 0;
        var whamm_live_injections_to_inject : WhammLiveInjection[]= [];
        var whamm_live_injections_to_not_inject : WhammLiveInjection[]= [];

        // follow the section orderings
        for (let inject_type of
            [Types.WhammDataType.typeType, Types.WhammDataType.importType, Types.WhammDataType.tableType, Types.WhammDataType.memoryType, Types.WhammDataType.globalType, Types.WhammDataType.exportType,
            Types.WhammDataType.elementType, Types.WhammDataType.opProbeType, Types.WhammDataType.localType, Types.WhammDataType.funcProbeType, Types.WhammDataType.functionType, Types.WhammDataType.activeDataType, Types.WhammDataType.passiveDataType
            ]){
                // get the mapping
                let injections =  whamm_live_mappings.get(Types.WhammDataType[inject_type]);
                if (injections){
                    for (let injection of injections){
                        // for each of the the injection, create the appropriate injected content instance
                        // and figure where they should be injected
                        switch (inject_type){

                            case Types.WhammDataType.importType:
                                {
                                    let import_injection = injection.importData;
                                    if (import_injection === undefined) throw new Error("API response error: Import injectio is expected to be defined");

                                    // use FSM to find where this injection should be injected
                                    let start_wat_range = fsm.section_to_line_mapping.get(InjectType.Import);
                                    if (start_wat_range === undefined) throw new Error("FSM error: Local fsm mapping not present");

                                    // calculate the new wat line
                                    let wat_line = start_wat_range + number_of_lines_injected;
                                    let wat_range = {l1: wat_line,l2: wat_line} as WatLineRange;
                                    let whamm_span = ModelHelper.get_whamm_span(import_injection.cause);

                                    number_of_lines_injected++;
                                    whamm_live_injections_to_inject.push(
                                        {
                                            type: Types.WhammInjectType.importInject,
                                            code: [`(import "${import_injection.module}" "${import_injection.name}" (${import_injection.typeRef}))`],
                                            wat_range: wat_range,
                                            whamm_span: whamm_span
                                        } as WhammLiveInjection
                                    );
                                }
                                break;

                            case Types.WhammDataType.exportType:
                                break;

                            case Types.WhammDataType.typeType:
                                break;
                            
                            case Types.WhammDataType.memoryType:
                                break;

                            case Types.WhammDataType.activeDataType:
                                break;

                            case Types.WhammDataType.passiveDataType:
                                break;

                            case Types.WhammDataType.globalType:
                                break;

                            case Types.WhammDataType.functionType:
                                break;

                            case Types.WhammDataType.localType:
                                break;

                            case Types.WhammDataType.tableType:
                                break;

                            case Types.WhammDataType.elementType:
                                break;

                            case Types.WhammDataType.opProbeType:
                                break;

                            case Types.WhammDataType.funcProbeType:
                                break;
                        }
                    }
                }
            }

        // We need to follow the section ordering because if we do
        // then the injected wat line range is fixed and won't need to be updated until the next API call
        return [[], []];
    }

    static get_whamm_span(cause: Types.WhammCause): undefined | span{
        switch(cause.tag){
            case "whamm":
                return undefined;
            default:
                // _value exists!
                // @ts-ignore
                let lc0= cause._value.lc0;
                // @ts-ignore
                let lc1= cause._value.lc1;

                return {
                    lc0: {l: lc0.l, c:lc0.c},
                    lc1: {l: lc1.l, c:lc1.c}
                } as span;
        }
    }
}