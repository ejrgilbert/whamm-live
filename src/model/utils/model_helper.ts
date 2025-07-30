import { Types } from "../../whammServer";
import { FSM } from "../fsm";
import { APIModel } from "../model";
import { injected_lines_info, InjectionFuncValue, InjectionRecord, InjectionRecordDanglingType, InjectType, InjectTypeDanglingType, jagged_array, span, WatLineRange, WhammDataTypes, WhammLiveInjection, WhammLiveResponse } from "../types";

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

    // Use the injection mappings created from `ModelHelper.create_whamm_data_type_to_whamm_injection_mapping`
    // to create `WhammLiveInjection` instances. These instances will store their new wat locations
    // This method returns a tuple with the first element being instances that are to be injected in the new wat
    // and the other element being a list of instances that are to **not** be injected and instead be used as dangling references like `funcProbes`, `OpBodyProbes`, `Locals`
    static create_whamm_live_injection_instances(fsm: FSM, whamm_live_mappings: Map<string, Types.WhammInjection[]>): WhammLiveResponse{
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
                                    let [inj , start_wat_line] = ModelHelper.get_required_inject_data_and_wat_line(injection.importData, InjectType.Import, fsm);
                                    let import_injection = inj as Types.ImportRecord;

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
                                {
                                    let [inj , start_wat_line] = ModelHelper.get_required_inject_data_and_wat_line(injection.exportData, InjectType.Export, fsm);
                                    let export_injection = inj as Types.ExportRecord;
                                    let whamm_live_instance = ModelHelper.__new_whamm_live_injection_instance(
                                        export_injection,
                                        inject_type,
                                        start_wat_line + (number_of_lines_injected++),
                                        injection_id++,
                                        id_to_injection_mapping
                                    )
                                    whamm_live_instance.code.push(
                                        `\t(export "${export_injection.name}" (${export_injection.kind} ${export_injection.index}))`
                                    )
                                    whamm_live_injections_to_inject.push(whamm_live_instance);
                                }
                                break;

                            case Types.WhammDataType.typeType:
                                {
                                    let [inj , start_wat_line] = ModelHelper.get_required_inject_data_and_wat_line(injection.typeData, InjectType.Type, fsm);
                                    let type_injection = inj as Types.TypeRecord;
                                    let whamm_live_instance = ModelHelper.__new_whamm_live_injection_instance(
                                        type_injection,
                                        inject_type,
                                        start_wat_line + (number_of_lines_injected++),
                                        injection_id++,
                                        id_to_injection_mapping
                                    )
                                    whamm_live_instance.code.push(`\t(type ${type_injection.ty})`);
                                    whamm_live_injections_to_inject.push(whamm_live_instance);
                                }
                                break;
                            
                            case Types.WhammDataType.memoryType:
                                {
                                    let [inj , start_wat_line] = ModelHelper.get_required_inject_data_and_wat_line(injection.memoryData, InjectType.Memory, fsm);
                                    let memory_injection = inj as Types.MemoryRecord;
                                    let whamm_live_instance = ModelHelper.__new_whamm_live_injection_instance(
                                        memory_injection,
                                        inject_type,
                                        start_wat_line + (number_of_lines_injected++),
                                        injection_id++,
                                        id_to_injection_mapping
                                    )
                                    whamm_live_instance.code.push(`\t(memory $mem${memory_injection.id} ${memory_injection.initial} ${memory_injection.maximum ? memory_injection.maximum: ''})`);
                                    whamm_live_injections_to_inject.push(whamm_live_instance);
                                }
                                break;

                            case Types.WhammDataType.activeDataType:
                                {
                                    let [inj , start_wat_line] = ModelHelper.get_required_inject_data_and_wat_line(injection.activeData, InjectType.Data, fsm);
                                    let activedata_injection = inj as Types.ActiveDataRecord;
                                    let whamm_live_instance = ModelHelper.__new_whamm_live_injection_instance(
                                        activedata_injection,
                                        inject_type,
                                        start_wat_line + (number_of_lines_injected++),
                                        injection_id++,
                                        id_to_injection_mapping
                                    )
                                    const offset = `(${activedata_injection.offsetExpr.join(" ")})`;
                                    const byte_literal: string =[...activedata_injection.data].map(b => `\\${b.toString(16).padStart(2, "0")}`)
  .join("");
                                    whamm_live_instance.code.push(`\t(data (memory ${activedata_injection.memoryIndex}) (offset ${offset}) "${byte_literal}")`);
                                    whamm_live_injections_to_inject.push(whamm_live_instance);
                                    number_of_func_lines_and_data_sections_injected += 1;
                                }
                                break;

                            case Types.WhammDataType.passiveDataType:
                                {
                                    let [inj , start_wat_line] = ModelHelper.get_required_inject_data_and_wat_line(injection.passiveData, InjectType.Data, fsm);
                                    let passivedata_injection = inj as Types.PassiveDataRecord;
                                    let whamm_live_instance = ModelHelper.__new_whamm_live_injection_instance(
                                        passivedata_injection,
                                        inject_type,
                                        start_wat_line + (number_of_lines_injected++),
                                        injection_id++,
                                        id_to_injection_mapping
                                    )
                                    const byte_literal: string =[...passivedata_injection.data].map(b => `\\${b.toString(16).padStart(2, "0")}`)
  .join("");
                                    whamm_live_instance.code.push(`\t(data "${byte_literal}")`);
                                    whamm_live_injections_to_inject.push(whamm_live_instance);
                                    number_of_func_lines_and_data_sections_injected += 1;
                                }
                                break;

                            case Types.WhammDataType.globalType:
                                {
                                    let [inj , start_wat_line] = ModelHelper.get_required_inject_data_and_wat_line(injection.globalData, InjectType.Global, fsm);
                                    let global_injection = inj as Types.GlobalRecord;
                                    let whamm_live_instance = ModelHelper.__new_whamm_live_injection_instance(
                                        global_injection,
                                        inject_type,
                                        start_wat_line + (number_of_lines_injected++),
                                        injection_id++,
                                        id_to_injection_mapping
                                    )
                                    
                                    let type_string = `(${global_injection.mutable ? "mut " : ""}${global_injection.ty})`
                                    whamm_live_instance.code.push(
                                        `\t(global $global${global_injection.id}} ${type_string} (${global_injection.initExpr.join(" ")})`);
                                    whamm_live_injections_to_inject.push(whamm_live_instance);
                                }
                                break;

                            case Types.WhammDataType.functionType:
                                {
                                    let [inj , start_wat_line] = ModelHelper.get_required_inject_data_and_wat_line(injection.functionData, InjectType.Func, fsm);
                                    let func_injection = inj as Types.FunctionRecord;
                                    let whamm_live_instance = ModelHelper.__new_whamm_live_injection_instance(
                                        func_injection,
                                        inject_type,
                                        start_wat_line + number_of_lines_injected,
                                        injection_id++,
                                        id_to_injection_mapping
                                    )
                                    let local_start_line = start_wat_line + number_of_lines_injected;

                                    // construct the function body and update the # of lines injected and it's wat range accordingly
                                    const name = func_injection.fname ? `$${func_injection.fname}`: `$func${func_injection.id}`;
                                    const id = ` (;${func_injection.id};)`;
                                    const param = func_injection.sig[0].length ? ` (param ${func_injection.sig[0].join(" ")})` : "";
                                    const result = func_injection.sig[1].length ? ` (result ${func_injection.sig[1].join(" ")})` : "";

                                    whamm_live_instance.code.push(`\t(func ${name}${id}${param}${result}`);
                                    if (func_injection.locals.length >0){ 
                                        whamm_live_instance.code.push(`\t\t(local ${func_injection.locals.join(" ")})`);
                                        local_start_line++;
                                    }

                                    for (let each_line of func_injection.body)
                                        whamm_live_instance.code.push(`\t\t${each_line}`);
                                    whamm_live_instance.code.push(')');

                                    number_of_lines_injected = number_of_lines_injected + whamm_live_instance.code.length;
                                    number_of_func_lines_and_data_sections_injected += whamm_live_instance.code.length;
                                    whamm_live_instance.wat_range.l2 = start_wat_line + number_of_lines_injected -1;

                                    whamm_live_injections_to_inject.push(whamm_live_instance);

                                    // Also insert values in the `injected_func_id_to_wat_mapping` map to keep track of the **exact** line func starts, body starts and ends, and locals start
                                    injected_func_id_to_wat_mapping.set(
                                        func_injection.id, {func: whamm_live_instance.wat_range.l1,
                                                            local: local_start_line,
                                                            probe: [local_start_line+1, whamm_live_instance.wat_range.l2]
                                    })

                                }
                                break;

                            case Types.WhammDataType.tableType:
                                {
                                    let [inj , start_wat_line] = ModelHelper.get_required_inject_data_and_wat_line(injection.tableData, InjectType.Table, fsm);
                                    let table_injection = inj as Types.TableRecord;
                                    let whamm_live_instance = ModelHelper.__new_whamm_live_injection_instance(
                                        table_injection,
                                        inject_type,
                                        start_wat_line + (number_of_lines_injected++),
                                        injection_id++,
                                        id_to_injection_mapping
                                    )
                                    
                                    whamm_live_instance.code.push(
                                        `\t(table )`);
                                    whamm_live_injections_to_inject.push(whamm_live_instance);
                                }
                                break;

                            case Types.WhammDataType.elementType:
                                {
                                    let [inj , start_wat_line] = ModelHelper.get_required_inject_data_and_wat_line(injection.elementData, InjectType.Element, fsm);
                                    let elem_injection = inj as Types.ElementRecord;
                                    let whamm_live_instance = ModelHelper.__new_whamm_live_injection_instance(
                                        elem_injection,
                                        inject_type,
                                        start_wat_line + (number_of_lines_injected++),
                                        injection_id++,
                                        id_to_injection_mapping
                                    )
                                    
                                    whamm_live_instance.code.push(
                                        `\t(elem )`);
                                    whamm_live_injections_to_inject.push(whamm_live_instance);
                                }
                                break;

                            case Types.WhammDataType.localType:
                            case Types.WhammDataType.opProbeType:
                            case Types.WhammDataType.funcProbeType:
                                {
                                    let record: Types.LocalRecord | Types.OpProbeRecord | Types.FuncProbeRecord | undefined;
                                    let inject: InjectType.Local | InjectType.FuncBodyProbe | InjectType.FuncProbe;
                                    switch (inject_type) {
                                        case Types.WhammDataType.localType:
                                                record=injection.localData;
                                                inject= InjectType.Local;
                                                break;
                                        case Types.WhammDataType.opProbeType:
                                                record=injection.opProbeData;
                                                inject= InjectType.FuncBodyProbe;
                                                break;
                                        case Types.WhammDataType.funcProbeType:
                                                record=injection.funcProbeData;
                                                inject= InjectType.FuncProbe;
                                                break;
                                    }
                                    
                                    let inj!: InjectionRecord;
                                    let wat_line!: number;
                                    try{
                                        [inj , wat_line] = ModelHelper.get_required_inject_data_and_wat_line(record, inject, fsm);
                                        wat_line = wat_line + number_of_lines_injected - number_of_func_lines_and_data_sections_injected;
                                    } catch (e){
                                        // error if fsm mapping not present
                                        if (e instanceof Error && e.message.includes('FSM error') && record)
                                        {
                                            // If so, check if the mapping present in the `injected_func_id_wat_mapping`
                                            // because the funcID could have belonged to a injected function
                                            wat_line = ModelHelper.get_wat_line_without_fsm(record, inject, injected_func_id_to_wat_mapping),
                                            inj = record;
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
        } as WhammLiveResponse;
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
    private static get_required_inject_data_and_wat_line(injection_data: undefined | InjectionRecord, injection_type: InjectType, fsm: FSM): [InjectionRecord, number]{
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
        return [injection_data, start_wat_line + offset];
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
    static handle_error_response(instance: APIModel, errors: Types.WhammApiError[]){
        let lines_injected: injected_lines_info = {total_lines_injected:0, number_of_func_lines_and_data_sections_injected: 0};
        instance.whamm_live_response = {
            lines_injected: lines_injected,
            injecting_injections:[],
            other_injections: [],
            injected_funcid_wat_map: new Map(),
            id_to_injection: new Map(),
            is_err: true,
            whamm_errors: errors} as WhammLiveResponse;

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