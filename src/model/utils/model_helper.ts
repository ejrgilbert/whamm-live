import { Types } from "../../whammServer";
import { FSM } from "../fsm";
import { InjectionRecord, InjectType, span, WatLineRange, WhammLiveInjection } from "../types";

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
                                    // get the required injection record as well as the fsm line to inject at
                                    let [inj , start_wat_line] = ModelHelper.get_required_inject_data_and_wat_line(injection.importData,
                                            InjectType.Import, fsm, "Import injection expected to be defined");
                                    let import_injection = inj as Types.ImportRecord;

                                    // create whamm live instance with empty code block
                                    let whamm_live_instance = ModelHelper.create_whamm_live_instance_for_one_line_injections(
                                        import_injection,
                                        inject_type,
                                        // new line would be where it was initially supposed to be injected + the new offset because
                                        // of other injected lines prior
                                        start_wat_line + (number_of_lines_injected++),
                                    )

                                    // add the new whamm live instance and add it's relevant code
                                    whamm_live_instance.code.push(
                                            `(import "${import_injection.module}" "${import_injection.name}" (${import_injection.typeRef}))`
                                    )
                                    whamm_live_injections_to_inject.push(whamm_live_instance);
                                }
                                break;

                            case Types.WhammDataType.exportType:
                                {
                                    let [inj , start_wat_line] = ModelHelper.get_required_inject_data_and_wat_line(injection.exportData,
                                            InjectType.Export, fsm, "Export injection expected to be defined");
                                    let export_injection = inj as Types.ExportRecord;
                                    let whamm_live_instance = ModelHelper.create_whamm_live_instance_for_one_line_injections(
                                        export_injection,
                                        inject_type,
                                        start_wat_line + (number_of_lines_injected++),
                                    )
                                    whamm_live_instance.code.push(
                                        `(export "${export_injection.name}" (${export_injection.kind} ${export_injection.index}))`
                                    )
                                    whamm_live_injections_to_inject.push(whamm_live_instance);
                                }
                                break;

                            case Types.WhammDataType.typeType:
                                {
                                    let [inj , start_wat_line] = ModelHelper.get_required_inject_data_and_wat_line(injection.typeData,
                                            InjectType.Type, fsm, "Type injection expected to be defined");
                                    let type_injection = inj as Types.TypeRecord;
                                    let whamm_live_instance = ModelHelper.create_whamm_live_instance_for_one_line_injections(
                                        type_injection,
                                        inject_type,
                                        start_wat_line + (number_of_lines_injected++),
                                    )
                                    whamm_live_instance.code.push(`(type ${type_injection.ty})`);
                                    whamm_live_injections_to_inject.push(whamm_live_instance);
                                }
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

    // private helper methods to help with whamm live injection instance creation

    private static create_whamm_span(cause: Types.WhammCause): undefined | span{
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

    // create wat range and whamm span for injections which only inject one line
    private static create_wat_range_and_whamm_span_for_one_line_injections(injection_record: InjectionRecord, new_wat_line: number): [WatLineRange, span|undefined]{
        let wat_range = {l1: new_wat_line,l2: new_wat_line} as WatLineRange;
        let whamm_span = ModelHelper.create_whamm_span(injection_record.cause);
        return [wat_range, whamm_span];
    }

    // helps throw error otherwise just gives record data and fsm line for the given section
    private static get_required_inject_data_and_wat_line(injection_data: undefined | InjectionRecord, injection_type: InjectType, fsm: FSM, err_msg: string): [InjectionRecord, number]{
        if (injection_data === undefined) throw new Error(`API response error: ${err_msg}`);
        // use FSM to find where this injection should be injected
        let start_wat_line = fsm.section_to_line_mapping.get(injection_type);
        if (start_wat_line === undefined) throw new Error("FSM error: Local fsm mapping not present");
        return [injection_data, start_wat_line + 1]
    }

    private static create_whamm_live_instance_for_one_line_injections(record: InjectionRecord, inject_type: Types.WhammDataType, new_wat_line: number){
        // create the whamm live instance for one line injections
        let [wat_range, whamm_span] = ModelHelper.create_wat_range_and_whamm_span_for_one_line_injections(record, new_wat_line);
        return {
            type: inject_type,
            code: [],
            wat_range: wat_range,
            whamm_span: whamm_span
        } as WhammLiveInjection;
    }
}