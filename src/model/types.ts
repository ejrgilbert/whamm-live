import { Types, whammServer } from "../whammServer";
// Different types and enums for API responses

// Enums
// Enum values of these types MATTER!
// values based on the order of sections in a .wat file
export enum InjectType{
    // Lined up in order in terms of sections as well 
    // until the last 2(Local and Probe)
    //  which would depend on their function IDs
    Type = 1,
    Import = 2,
    Table = 3,
    Memory = 4,
    Tag = 5,
    Global = 6,
    Export = 7,
    // We don't support start as an inject type but the wat content can have this so necessary to handle it
    // Start = 7.5
    Element = 8,
    Func = 9,
    Data = 10,
    // Module will never be used
    Module = 11,
    Local,
    FuncProbe,
    FuncBodyProbe,
}

export const stringToInjectType: Record<string, InjectType> = {
    // Lined up in order in terms of sections as well 
    // until the last 2(Local and Probe)
    //  which would depend on their function IDs
    'type': InjectType.Type,
    'import': InjectType.Import,
    'table': InjectType.Table,
    'memory': InjectType.Memory,
    'tag': InjectType.Tag,
    'global': InjectType.Global,
    'export': InjectType.Export,
    'elem': InjectType.Element,
    'func': InjectType.Func,
    'data': InjectType.Data,
    'module': InjectType.Module,
}

// Types
export type ScriptLoc = {
    l: number,
    c: number,
}

// inclusive range
export type WatLineRange = {
    l1: number,
    l2: number,
}

export type line_col = {
    l: number,
    c: number
}

// span starting line and column
// and ending line(inclusive) and column(exclusive)
export type span = {
    lc0: line_col,
    lc1: line_col
}

export type WhammLiveInjection = {
    type: Types.WhammDataType;
    code: string[],
    wat_range: WatLineRange;
    whamm_span: span | undefined,
}

export type Metadata = {
    script_start: ScriptLoc;
    script_end: ScriptLoc | undefined;
}

export type WhammError = {
    msg: string,
    err_loc: Metadata | undefined;
}

export type InjectionRecord = Types.TypeRecord | Types.ImportRecord | Types.TableRecord | Types.MemoryRecord | Types.GlobalRecord | Types.ExportRecord |
            Types.ElementRecord | Types.OpProbeRecord | Types.LocalRecord | Types.FuncProbeRecord | Types.FunctionRecord | Types.ActiveDataRecord | Types.PassiveDataRecord;