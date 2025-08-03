import { Types } from "../../whammServer";
import { APIWasmModel } from "../api_model/model_wasm";
import { APIWizardModel } from "../api_model/model_wizard";
import { FSM } from "../fsm";
import { injected_lines_info, InjectionFuncValue, InjectionRecord, InjectionRecordDanglingType, InjectType, InjectTypeDanglingType, jagged_array, span, WatLineRange, WhammDataTypes, WhammLiveInjection, WhammLiveResponseWasm, WhammLiveResponseWizard } from "../types";
import { WatGenerator } from "./wat_generator";

export class ModelHelper{

    /*
        Wat injection and WhammLiveInjection object related methods
        : to deal with the API response to have the extension model side ready
    */

    // Inject wat builds the injected wat content
    // by combining the original wat string and the whamm_injections
    // also returns a mapping from the wat line numbet to the whamm live injection for that line number
    static inject_wat(original: string, whamm_injections: WhammLiveInjection[], number_of_lines_injected: number) :[string[], Map<number, WhammLiveInjection>]{

        let lines = original.split('\n');
        let injected_wat = new Array(lines.length + number_of_lines_injected);
        
        // key is the wat line number and value is the whamm live injection at that line number
        let wat_to_whamm_mapping: Map<number, WhammLiveInjection> = new Map();

        for (let whamm_injection of whamm_injections){
            for (let i =whamm_injection.wat_range.l1; i <= whamm_injection.wat_range.l2; i++){
                injected_wat[i-1] = whamm_injection.code[i - whamm_injection.wat_range.l1];
                wat_to_whamm_mapping.set(i, whamm_injection);
            }
        }
        
        let index = 0;
        for (let i=0; i < injected_wat.length; i++){
            if (injected_wat[i] == undefined && lines[index]?.length > 0){
                injected_wat[i] = lines[index++]
            }
        }
        return [injected_wat, wat_to_whamm_mapping];
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
    static create_jagged_array(string_contents: string): jagged_array{
        let string_contents_array = string_contents.split('\n');
        let jagged_array: jagged_array = new Array(string_contents_array.length);
        for (let i=0; i < jagged_array.length; i++){
            let new_array: null[] = new Array(string_contents_array[i].length).fill(null);
            jagged_array[i] = new_array;
        }
        return jagged_array;
    }


    // This function's job is to update the funcID values for the different mappings like
    // the local mappings and func mappings since the funcID value changes after an injection
    static update_injected_fsm(fsm: FSM, whamm_live_mappings: Map<string, Types.WhammInjection[]>): FSM{
        let import_injections = whamm_live_mappings.get(Types.WhammDataType[Types.WhammDataType.importType]);

        if (import_injections){
            // calculate number of injected import functions
            let number_of_imported_functions = 0;
            for (let import_injection of import_injections){
                if (import_injection.importData?.typeRef.toLowerCase().startsWith("func")) number_of_imported_functions++;
            }
            // no change in fsm funcID values since no import functions injected
            if (number_of_imported_functions === 0) return fsm;

            let injected_fsm = new FSM (fsm.wat_string, false);
            injected_fsm.section_to_line_mapping = fsm.section_to_line_mapping;

            injected_fsm.probe_mapping = new Map();
            injected_fsm.local_mapping = new Map();
            injected_fsm.func_mapping = new Map();
            injected_fsm.number_of_func_imports = fsm.number_of_func_imports;

            for (let old_funcID of fsm.func_mapping.keys()){
                let new_funcID = old_funcID + number_of_imported_functions;

                let old_probe_value = fsm.probe_mapping.get(old_funcID);
                let old_local_value = fsm.local_mapping.get(old_funcID);
                let old_func_value = fsm.func_mapping.get(old_funcID);
                if (old_probe_value) injected_fsm.probe_mapping.set(new_funcID, old_probe_value);
                if (old_local_value) injected_fsm.local_mapping.set(new_funcID, old_local_value);
                if (old_func_value) injected_fsm.func_mapping.set(new_funcID, old_func_value);
            }
            return injected_fsm;
        }
        // no change in fsm funcID values since no imports injected
        return fsm;

    }

    static create_whamm_live_injection_instances_wizard(whamm_live_mappings: Map<string, Types.WhammInjection[]>): WhammLiveResponseWizard{
        var injected_wat = ["(module $wizardModule"]
        var number_of_lines_injected = 1;
        var injection_id = 0;
        var id_to_injection_mapping : Map<number, WhammLiveInjection>= new Map();
        var wat_to_whamm_mapping: Map<number, WhammLiveInjection> = new Map();
        var all_live_injections = [];

        for (let inject_type of WhammDataTypes){
                // get the mapping
                let injections =  whamm_live_mappings.get(Types.WhammDataType[inject_type]);
                if (injections){
                    for (let injection of injections){
                        // for each of the the injection, create the appropriate injected content instance
                        // and figure where they should be injected
                        switch (inject_type){

                            case Types.WhammDataType.functionType:
                                {
                                    let [func_injection, wat_code] = WatGenerator.generateWat(injection);
                                    var whamm_live_instance = ModelHelper.__new_whamm_live_injection_instance(
                                        func_injection,
                                        inject_type,
                                        (++number_of_lines_injected),
                                        injection_id++,
                                        id_to_injection_mapping
                                    )
                                    whamm_live_instance.code = wat_code.split('\n');
                                    whamm_live_instance.wat_range.l2 = number_of_lines_injected + whamm_live_instance.code.length - 1;
                                    number_of_lines_injected = whamm_live_instance.wat_range.l2;

                                    whamm_live_instance.code.forEach((elem)=>injected_wat.push(elem));
                                    for (let line_number=whamm_live_instance.wat_range.l1; line_number <= whamm_live_instance.wat_range.l2; line_number++){
                                        wat_to_whamm_mapping.set(line_number, whamm_live_instance)
                                    }
                                }
                                break;

                            case Types.WhammDataType.importType:
                            case Types.WhammDataType.exportType:
                            case Types.WhammDataType.typeType:
                            case Types.WhammDataType.memoryType:
                            case Types.WhammDataType.tableType:
                            case Types.WhammDataType.elementType:
                            case Types.WhammDataType.passiveDataType:
                            case Types.WhammDataType.activeDataType:
                            case Types.WhammDataType.globalType:
                                {
                                    var [inj_record, wat_code] = WatGenerator.generateWat(injection);
                                    var whamm_live_instance = ModelHelper.__new_whamm_live_injection_instance(
                                        inj_record,
                                        inject_type,
                                        (++number_of_lines_injected),
                                        injection_id++,
                                        id_to_injection_mapping
                                    )
                                    whamm_live_instance.code.push(wat_code);
                                    injected_wat.push(wat_code);
                                    wat_to_whamm_mapping.set(number_of_lines_injected, whamm_live_instance);
                                }
                                break;

                            default:
                                throw new Error(`Unexpected injection ${injection}`);
                        }
                        all_live_injections.push(whamm_live_instance);
                    }
                }
        }
        // End of module
        injected_wat.push(')');
        return {
            injections: all_live_injections,
            injected_wat: injected_wat.join("\n"),
            id_to_injection: id_to_injection_mapping,
            wat_to_injection: wat_to_whamm_mapping,
            whamm_errors: [],
            is_err: false
        } as WhammLiveResponseWizard;
    }

    // Use the injection mappings created from `ModelHelper.create_whamm_data_type_to_whamm_injection_mapping`
    // to create `WhammLiveInjection` instances. These instances will store their new wat locations
    // This method returns a tuple with the first element being instances that are to be injected in the new wat
    // and the other element being a list of instances that are to **not** be injected and instead be used as dangling references like `funcProbes`, `OpBodyProbes`, `Locals`
    static create_whamm_live_injection_instances(fsm: FSM, whamm_live_mappings: Map<string, Types.WhammInjection[]>): WhammLiveResponseWasm{
        // all the other injections except `funcProbes`, `OpBodyProbes`, `Locals` should update the number_of_lines_injected since they are literally injecting new wat content
        var number_of_lines_injected = 0;
        var number_of_func_imports_injected = 0;
        var injection_id = 0;
        var number_of_func_lines_and_data_sections_injected = 0;
        var whamm_live_injections_to_inject : WhammLiveInjection[]= [];
        var whamm_live_injections_to_not_inject : WhammLiveInjection[]= [];
        var id_to_injection_mapping : Map<number, WhammLiveInjection>= new Map();

        // Keep track of the injected functions to wat mapping because some opBodyProbes and funcProbes **can** target these injected functions
        // this would look something like
        // key: 1,
        // value: {
        //      'local': 3,
        //      'func': 2,
        //      'probe': [2,3]
        //  }
        var injected_func_id_to_wat_mapping: Map<number, InjectionFuncValue> = new Map();

        // follow the section orderings BUT deal with the opProbeType, localType and funcProbeTypes at the end
        // Why? Because they don't inject any lines
        // and if we deal with the remaining sections, we will have a completed `injected_func_id_to_wat_mapping` which we can use to track
        // the probes that targeted the injected functions
        for (let inject_type of
            WhammDataTypes){
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
                                    let start_wat_line = ModelHelper.get_wat_line(injection.importData, InjectType.Import, fsm);
                                    let import_injection = injection.importData as Types.ImportRecord;

                                    // create whamm live instance with empty code block
                                    let whamm_live_instance = ModelHelper.__new_whamm_live_injection_instance(
                                        import_injection,
                                        inject_type,
                                        // new line would be where it was initially supposed to be injected + the new offset because
                                        // of other injected lines prior
                                        start_wat_line + (number_of_lines_injected++),
                                        injection_id++,
                                        id_to_injection_mapping
                                    )

                                    // add the funcID value if the import is a function
                                    let id = (/^func/i.test(import_injection.typeRef)) ?
                                            `(;${fsm.number_of_func_imports + (number_of_func_imports_injected++)};)` : "";
                                    // add the new whamm live instance and add it's relevant code
                                    let wat_code = `\t(import "${import_injection.module}" "${import_injection.name}" (${import_injection.typeRef.toLowerCase()}${id}))`;

                                    whamm_live_instance.code.push(wat_code);
                                    whamm_live_injections_to_inject.push(whamm_live_instance);
                                }
                                break;

                            case Types.WhammDataType.exportType:
                            case Types.WhammDataType.typeType:
                            case Types.WhammDataType.memoryType:
                            case Types.WhammDataType.passiveDataType:
                            case Types.WhammDataType.activeDataType:
                            case Types.WhammDataType.globalType:
                            case Types.WhammDataType.tableType:
                            case Types.WhammDataType.elementType:
                                {
                                    let start_wat_line!: number;
                                    switch (injection.dataType){
                                        case Types.WhammDataType.exportType:
                                            start_wat_line = ModelHelper.get_wat_line(injection.exportData, InjectType.Export, fsm);
                                            break;
                                        case Types.WhammDataType.typeType:
                                            start_wat_line = ModelHelper.get_wat_line(injection.typeData, InjectType.Type, fsm);
                                            break;
                                        case Types.WhammDataType.memoryType:
                                            start_wat_line = ModelHelper.get_wat_line(injection.memoryData, InjectType.Memory, fsm);
                                            break;
                                        case Types.WhammDataType.activeDataType:
                                            start_wat_line = ModelHelper.get_wat_line(injection.activeData, InjectType.Data, fsm);
                                            break;
                                        case Types.WhammDataType.passiveDataType:
                                            start_wat_line = ModelHelper.get_wat_line(injection.passiveData, InjectType.Data, fsm);
                                            break;
                                        case Types.WhammDataType.globalType:
                                            start_wat_line = ModelHelper.get_wat_line(injection.globalData, InjectType.Global, fsm);
                                            break;
                                        case Types.WhammDataType.tableType:
                                            start_wat_line = ModelHelper.get_wat_line(injection.tableData, InjectType.Table, fsm);
                                            break;
                                        case Types.WhammDataType.elementType:
                                            start_wat_line = ModelHelper.get_wat_line(injection.elementData, InjectType.Element, fsm);
                                            break;
                                    }
                                    let [inj_record, wat_code] = WatGenerator.generateWat(injection);

                                    let whamm_live_instance = ModelHelper.__new_whamm_live_injection_instance(
                                        inj_record,
                                        inject_type,
                                        start_wat_line + (number_of_lines_injected++),
                                        injection_id++,
                                        id_to_injection_mapping
                                    )
                                    whamm_live_instance.code.push(wat_code);
                                    whamm_live_injections_to_inject.push(whamm_live_instance);
                                }
                                break;

                            case Types.WhammDataType.functionType:
                                {
                                    let start_wat_line = ModelHelper.get_wat_line(injection.functionData, InjectType.Func, fsm);
                                    let [inj_record, wat_code] = WatGenerator.generateWat(injection);
                                    let whamm_live_instance = ModelHelper.__new_whamm_live_injection_instance(
                                        inj_record,
                                        inject_type,
                                        start_wat_line + number_of_lines_injected,
                                        injection_id++,
                                        id_to_injection_mapping
                                    )
                                    let local_start_line = start_wat_line + number_of_lines_injected;


                                    whamm_live_instance.code = wat_code.split('\n');
                                    let local_regex = /^\s*\(local/;
                                    if (whamm_live_instance.code.length > 2 && local_regex.test(whamm_live_instance.code[1]))
                                        local_start_line++;

                                    number_of_lines_injected = number_of_lines_injected + whamm_live_instance.code.length;
                                    number_of_func_lines_and_data_sections_injected += whamm_live_instance.code.length;
                                    whamm_live_instance.wat_range.l2 = start_wat_line + number_of_lines_injected -1;

                                    whamm_live_injections_to_inject.push(whamm_live_instance);

                                    // Also insert values in the `injected_func_id_to_wat_mapping` map to keep track of the **exact** line func starts, body starts and ends, and locals start
                                    injected_func_id_to_wat_mapping.set(
                                        (inj_record as Types.FunctionRecord).id, {func: whamm_live_instance.wat_range.l1,
                                                            local: local_start_line,
                                                            probe: [local_start_line+1, whamm_live_instance.wat_range.l2]
                                    })

                                }
                                break;

                            case Types.WhammDataType.localType:
                            case Types.WhammDataType.opProbeType:
                            case Types.WhammDataType.funcProbeType:
                                {
                                    let inj: Types.LocalRecord | Types.OpProbeRecord | Types.FuncProbeRecord | undefined;
                                    let inject: InjectType.Local | InjectType.FuncBodyProbe | InjectType.FuncProbe;
                                    switch (inject_type) {
                                        case Types.WhammDataType.localType:
                                                inj=injection.localData;
                                                inject= InjectType.Local;
                                                break;
                                        case Types.WhammDataType.opProbeType:
                                                inj=injection.opProbeData;
                                                inject= InjectType.FuncBodyProbe;
                                                break;
                                        case Types.WhammDataType.funcProbeType:
                                                inj=injection.funcProbeData;
                                                inject= InjectType.FuncProbe;
                                                break;
                                    }
                                    let wat_line!: number;
                                    try{
                                        wat_line = ModelHelper.get_wat_line(inj, inject, fsm);
                                        wat_line = wat_line + number_of_lines_injected - number_of_func_lines_and_data_sections_injected;
                                    } catch (e){
                                        // error if fsm mapping not present
                                        if (e instanceof Error && e.message.includes('FSM error') && inj)
                                        {
                                            // If so, check if the mapping present in the `injected_func_id_wat_mapping`
                                            // because the funcID could have belonged to a injected function
                                            wat_line = ModelHelper.get_wat_line_without_fsm(inj, inject, injected_func_id_to_wat_mapping);
                                        } else
                                            throw e;
                                    }

                                    let injection_record = (inject === InjectType.Local) ? inj as Types.LocalRecord :
                                            ((inject === InjectType.FuncProbe) ? inj as Types.FuncProbeRecord: inj as Types.OpProbeRecord);

                                    let whamm_live_instance = ModelHelper.__new_whamm_live_injection_instance(
                                        injection_record,
                                        inject_type,
                                        // no change in # of lines injected
                                        wat_line,
                                        injection_id++,
                                        id_to_injection_mapping
                                    );
                                    switch (inject_type) {
                                        case Types.WhammDataType.localType:
                                                whamm_live_instance.code = [`(local ${(injection_record as Types.LocalRecord).ty})`];
                                                break;
                                        case Types.WhammDataType.opProbeType:
                                                {
                                                    let op_probe_record = (injection_record as Types.OpProbeRecord);
                                                    whamm_live_instance.code = op_probe_record.body;
                                                    whamm_live_instance.mode = Types.FuncBodyInstrumentationMode[op_probe_record.mode]
                                                }
                                                break;
                                        case Types.WhammDataType.funcProbeType:
                                                {
                                                    let func_probe_record = (injection_record as Types.FuncProbeRecord);
                                                    whamm_live_instance.code = func_probe_record.body;
                                                    whamm_live_instance.mode = Types.FuncInstrumentationMode[func_probe_record.mode]
                                                }
                                                break;
                                    }
                                    whamm_live_injections_to_not_inject.push(whamm_live_instance);
                                }
                                break;
                        }
                    }
                }
            }

        // We need to follow the section ordering because if we do
        // then the injected wat line range is fixed and won't need to be updated until the next API call
        return {
            lines_injected: { total_lines_injected: number_of_lines_injected, number_of_func_lines_and_data_sections_injected: number_of_func_lines_and_data_sections_injected},
            injecting_injections: whamm_live_injections_to_inject,
            other_injections: whamm_live_injections_to_not_inject,
            injected_funcid_wat_map: injected_func_id_to_wat_mapping,
            is_err: false,
            whamm_errors: [],
            id_to_injection: id_to_injection_mapping
        } as WhammLiveResponseWasm;
    }

    static compare_live_whamm_spans(a: span , b:span ) : boolean{
        return (a.lc0.c == b.lc0.c && a.lc0.l == b.lc0.l) &&
            (a.lc1.c == b.lc1.c && a.lc1.l == b.lc1.l)
    }

    // check whether the `child` can fit inside of the `parent` span
    // Note that if parent === child, then this will return true since it can fit!
    static can_fit_span(parent: span, child: span): boolean{
        // check left bounds first
        let left_bounds_valid = false;
        if (parent.lc0.l < child.lc0.l
            || (parent.lc0.l == child.lc0.l && parent.lc0.c <= child.lc0.c))
            left_bounds_valid = true

        let right_bounds_valid = false;
        if (parent.lc1.l > child.lc1.l
            || (parent.lc1.l == child.lc1.l && parent.lc1.c >= child.lc1.c))
            right_bounds_valid = true

        return left_bounds_valid && right_bounds_valid;
    }

    static get_line_col_values(whamm_span: span | null, jagged_array: jagged_array): [number, number][]{
        if (whamm_span == null) return [];
        let line_col_values : [number, number][]= [];

        var current_row_index = whamm_span.lc0.l -1;
        // inclusive end row
        const end_row_index = whamm_span.lc1.l -1;
        var current_col_index = whamm_span.lc0.c - 1;
        // exclusive col value
        const end_col_index = whamm_span.lc1.c - 1; 

        // The idea: increase the 
        // if start_col exceeeds length then the value will be 0(move to the next row)
        // and number of rows increases
        while (!((current_row_index > end_row_index) || ((current_row_index == end_row_index) && (current_col_index >= end_col_index)))){
            if (jagged_array[current_row_index].length == 0){
                current_col_index = 0;
                current_row_index++;
            } else {
                line_col_values.push([current_row_index+1, current_col_index+1]);
                current_col_index++;
                if (current_col_index >= jagged_array[current_row_index].length){
                    current_col_index = 0;
                    current_row_index++;
                }
            }
        }
        return line_col_values;
    }
    // Calculate the whamm span size in columns
    // returns -1 if no whamm span
    static calculate_span_size(whamm_span: span | null, jagged_array: jagged_array) : number{
        if (whamm_span === null) return -1;
        let line_col_values = ModelHelper.get_line_col_values(whamm_span, jagged_array)
        return line_col_values.length;
    }

    /*
    *
    *    private helper methods
    *   : to help with whamm live injection instance creation
    *
    */

    private static create_live_whamm_span(cause: Types.WhammCause): null | span{
        let tag_value = cause.tag;
        // _tag will be used during test API responses
        // @ts-ignore 
        if (tag_value === undefined) tag_value=cause["_tag"];
        switch(tag_value){
            case "whamm":
                return null;
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
    private static create_wat_range_and_whamm_span(injection_record: InjectionRecord, new_wat_line: number): [WatLineRange, span|null]{
        let wat_range = {l1: new_wat_line,l2: new_wat_line} as WatLineRange;
        let whamm_span = ModelHelper.create_live_whamm_span(injection_record.cause);
        return [wat_range, whamm_span];
    }

    // helps throw error otherwise just gives record data and fsm line for the given section
    private static get_wat_line(injection_data: undefined | InjectionRecord, injection_type: InjectType, fsm: FSM): number{
        if (injection_data === undefined) throw new Error(`API response error: ${InjectType[injection_type]} injection expected to be defined`);
        // use FSM to find where this injection should be injected
        let start_wat_line;
        let offset: number = 0;
        switch (injection_type){
            case InjectType.Local:
                {
                    let local_record = injection_data as Types.LocalRecord;
                    start_wat_line = fsm.local_mapping.get(local_record.targetFid);
                }
                break;
            case InjectType.FuncProbe:
                {
                    let func_probe_record = injection_data as Types.FuncProbeRecord;
                    start_wat_line = fsm.func_mapping.get(func_probe_record.targetFid);
                }
                break;
            case InjectType.FuncBodyProbe:
                {
                    let func_body_probe_record = injection_data as Types.OpProbeRecord;
                    start_wat_line = fsm.probe_mapping.get(func_body_probe_record.targetFid)
                    if (start_wat_line !== undefined){
                        let op_insert_line = start_wat_line[0] + func_body_probe_record.targetOpcodeIdx;
                        start_wat_line = (op_insert_line <= start_wat_line[1]) ? op_insert_line: undefined;
                    }
                }
                break;
            default:
                {
                    start_wat_line = fsm.section_to_line_mapping.get(injection_type);
                    offset = 1
                }
                break;
        }
        if (start_wat_line === undefined) {
            throw new Error("FSM error: fsm mapping not present");
        }
        return start_wat_line + offset;
    }

    private static get_wat_line_without_fsm(
            injection_data: InjectionRecordDanglingType,
            injection_type: InjectTypeDanglingType,
            injected_func_id_to_wat_mapping: Map<number, InjectionFuncValue>)
                : number{

        let wat_line: number | undefined;
        let mapping = injected_func_id_to_wat_mapping.get(injection_data.targetFid)
        if (mapping) {
            switch (injection_type){
                case InjectType.Local:
                    wat_line=mapping.local;
                    break;
                case InjectType.FuncProbe:
                    wat_line=mapping.func;
                    break;
                case InjectType.FuncBodyProbe:
                    {
                        let probe_data = injection_data as Types.OpProbeRecord;
                        wat_line =mapping.probe[0] + probe_data.targetOpcodeIdx;
                    }
                    break;
            }
        }
        if (wat_line === undefined) {
            throw new Error("FSM error: fsm mapping not present");
        }
        return wat_line;
    }

    // not made private for test reasons
    // but think of it as `protected`
    static __new_whamm_live_injection_instance(record: InjectionRecord, inject_type: Types.WhammDataType, new_wat_line: number, injection_id: number, id_to_injection_mapping: Map<number,WhammLiveInjection>){
        // create the whamm live instance for one line injections
        let [wat_range, whamm_span] = ModelHelper.create_wat_range_and_whamm_span(record, new_wat_line);
        let injection = {
            type: inject_type,
            mode: null,
            code: [],
            wat_range: wat_range,
            whamm_span: whamm_span,
            id: injection_id
        } as WhammLiveInjection;
        id_to_injection_mapping.set(injection.id, injection);
        return injection;
    }

    // error handlers
    static handle_error_response_wizard(instance: APIWizardModel, errors: Types.WhammApiError[]){
        instance.whamm_live_response = {
            injected_wat: "",
            id_to_injection: new Map(),
            injections: [],
            wat_to_injection: new Map(),
            is_err: true,
            whamm_errors: errors};
        instance.jagged_array = [];
    }

    static handle_error_response(instance: APIWasmModel, errors: Types.WhammApiError[]){
        let lines_injected: injected_lines_info = {total_lines_injected:0, number_of_func_lines_and_data_sections_injected: 0};
        instance.whamm_live_response = {
            lines_injected: lines_injected,
            injecting_injections:[],
            other_injections: [],
            injected_funcid_wat_map: new Map(),
            id_to_injection: new Map(),
            is_err: true,
            whamm_errors: errors} as WhammLiveResponseWasm;

        instance.wat_to_whamm_mapping.clear();
        instance.injected_wat_content = instance.valid_wat_content;
        instance.jagged_array = [];
    }

    // Replaces the old funcID values with the new ones in the injected wat
    static update_original_func_id_values(injected_wat: string[], fsm: FSM, injected_lines_info: injected_lines_info){
        let func_regex = /^\s*\(\s*func.*(\(;(\d+);\))?/;
        let id_regex = /\(;(\d+);\)/;

        for (const [funcID, wat_line] of fsm.func_mapping.entries()){
            let actual_wat_line_index = wat_line+injected_lines_info.total_lines_injected-injected_lines_info.number_of_func_lines_and_data_sections_injected -1;
            if (func_regex.test(injected_wat[actual_wat_line_index])){

                let matches = injected_wat[actual_wat_line_index].match(func_regex);
                if (matches == null) throw new Error("Inject Wat error: A func body should have been present here");
                let id = parseInt(matches[2]);
                injected_wat[actual_wat_line_index] = injected_wat[actual_wat_line_index].replace(id_regex, `(;${funcID};)`);
            }
        }
    }

}