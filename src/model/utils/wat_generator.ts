import { Types } from "../../whammServer";
import { InjectionRecord } from "../types";

export class WatGenerator{

    static generateWat(injection: Types.WhammInjection): [InjectionRecord, string]{
        var inj_record!: InjectionRecord;
        var wat_code!: string;
        switch(injection.dataType){
            case Types.WhammDataType.typeType:
                {
                    let type_injection = injection.typeData as Types.TypeRecord;
                    wat_code = `\t(type ${type_injection.ty})`;
                    inj_record = type_injection;
                }
                break;
            case Types.WhammDataType.importType:
                {
                    let import_record = injection.importData as Types.ImportRecord;
                    wat_code = `\t(import "${import_record.module}" "${import_record.name}" (${import_record.typeRef.toLowerCase()}))`;
                    inj_record = import_record;
                }
                break;
            case Types.WhammDataType.tableType:
                {
                    inj_record = injection.tableData as Types.TableRecord;
                    wat_code = "\t(table )";
                }
                break;
            case Types.WhammDataType.memoryType:
                {
                    let memory_injection = injection.memoryData as Types.MemoryRecord;
                    wat_code = `\t(memory $mem${memory_injection.id} ${memory_injection.initial} ${memory_injection.maximum ? memory_injection.maximum: ''})`;
                    inj_record = memory_injection;
                }
                break;
            case Types.WhammDataType.globalType:
                {
                    let global_injection = injection.globalData as Types.GlobalRecord;
                    let type_string = `(${global_injection.mutable ? "mut " : ""}${global_injection.ty})`
                    wat_code = `\t(global $global${global_injection.id} ${type_string} (${global_injection.initExpr.join(" ")})`;
                    inj_record = global_injection;
                }
                break;
            case Types.WhammDataType.exportType:
                {
                    let export_injection = injection.exportData as Types.ExportRecord;
                    wat_code = `\t(export "${export_injection.name}" (${export_injection.kind} ${export_injection.index}))`;
                    inj_record = export_injection;
                }
                break;
            case Types.WhammDataType.elementType:
                {
                    inj_record = injection.elementData as Types.ElementRecord;
                    var wat_code = "\t(elem )";
                }
                break;
            case Types.WhammDataType.activeDataType:
                {
                    let activedata_injection= injection.activeData as Types.ActiveDataRecord;
                    let offset = `(${activedata_injection.offsetExpr.join(" ")})`;
                    let byte_literal: string =[...activedata_injection.data].map(b => `\\${b.toString(16).padStart(2, "0")}`)
.join("");
                    wat_code = `\t(data (memory ${activedata_injection.memoryIndex}) (offset ${offset}) "${byte_literal}")`;
                    inj_record = activedata_injection;
                }
                break;
            case Types.WhammDataType.passiveDataType:
                {
                    let passivedata_injection = injection.passiveData as Types.PassiveDataRecord;
                    let byte_literal: string =[...passivedata_injection.data].map(b => `\\${b.toString(16).padStart(2, "0")}`)
.join("");
                    wat_code = `\t(data "${byte_literal}")`;
                    inj_record = passivedata_injection;
                }
                break;
            case Types.WhammDataType.functionType:
                {
                    let wat_code_array = [];
                    let func_injection = injection.functionData as Types.FunctionRecord;
                    let  name = func_injection.fname ? `$${func_injection.fname}`: `$func${func_injection.id}`;
                    let  id = ` (;${func_injection.id};)`;
                    let param = func_injection.sig[0].length ? ` (param ${func_injection.sig[0].join(" ")})` : "";
                    let result = func_injection.sig[1].length ? ` (result ${func_injection.sig[1].join(" ")})` : "";
                    
                    wat_code_array.push(`\t(func ${name}${id}${param}${result}`);
                    if (func_injection.locals.length >0){ 
                        wat_code_array.push(`\t\t(local ${func_injection.locals.join(" ")})`);
                    }
                    for (let each_line of func_injection.body){
                        wat_code_array.push(`\t\t${each_line}`);
                    }
                    wat_code_array.push(')');

                    inj_record = func_injection;
                    wat_code = wat_code_array.join("\n");
                }
            case Types.WhammDataType.localType:
            case Types.WhammDataType.opProbeType:
            case Types.WhammDataType.funcProbeType:
                throw new Error(`Generate wat isn't implemented for ${injection.dataType}!`);
        }
        return [inj_record, wat_code];
    }
}