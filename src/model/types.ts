import { Types} from "../whammServer";
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

export enum sectionNamesInOrder {type = "type", import = "import", table = "table", memory = "memory", tag = "tag", global  = "global",
                                    export = "export", start = "start", elem = "elem", func = "func", data = "data", custom = "custom"}

// Types
export type ScriptLoc = {
    l: number;
    c: number;
}

// inclusive range
// starts from 1
export type WatLineRange = {
    l1: number;
    l2: number
}

// line starts from 1
export type line_col = {
    l: number;
    c: number
}

// l,c starts from 1
// span starting line and column
// and ending line(inclusive) and column(exclusive)
export type span = {
    lc0: line_col;
    lc1: line_col
}

export type WhammLiveInjection = {
    type: Types.WhammDataType;
    mode: string | null;
    code: string[];
    wat_range: WatLineRange;
    whamm_span: span | null;
    id: number;
}

export type Metadata = {
    script_start: ScriptLoc;
    script_end: ScriptLoc | undefined;
}

export type WhammError = {
    msg: string;
    err_loc: Metadata | undefined;
}

export type InjectionRecord = Types.TypeRecord | Types.ImportRecord | Types.TableRecord | Types.MemoryRecord | Types.GlobalRecord | Types.ExportRecord |
            Types.ElementRecord | Types.OpProbeRecord | Types.LocalRecord | Types.FuncProbeRecord | Types.FunctionRecord | Types.ActiveDataRecord | Types.PassiveDataRecord;

export type InjectionRecordDanglingType = Types.OpProbeRecord | Types.LocalRecord | Types.FuncProbeRecord;
export type InjectTypeDanglingType = InjectType.FuncBodyProbe | InjectType.Local | InjectType.FuncProbe;
export type InjectionFuncValue = {
    local: number
    probe:[number, number]
    func: number
}
export type injected_lines_info={
    total_lines_injected: number,
    number_of_func_lines_and_data_sections_injected: number
}

export type WhammLiveResponse = {
    lines_injected: injected_lines_info;
    injecting_injections: WhammLiveInjection[];
    other_injections: WhammLiveInjection[];
    injected_funcid_wat_map: Map<number, InjectionFuncValue>;
    id_to_injection: Map<number, WhammLiveInjection>;
    whamm_errors: Types.WhammApiError[],
    is_err: boolean,
}

export const WhammDataTypes = [Types.WhammDataType.typeType, Types.WhammDataType.importType, Types.WhammDataType.tableType, Types.WhammDataType.memoryType, Types.WhammDataType.globalType, Types.WhammDataType.exportType,
    Types.WhammDataType.elementType, Types.WhammDataType.functionType, Types.WhammDataType.activeDataType, Types.WhammDataType.passiveDataType, Types.WhammDataType.opProbeType, Types.WhammDataType.localType, Types.WhammDataType.funcProbeType]

// Types to be used in the svelte side
export type injection_circle = {
    color: string;
    body: string;
    injection_id: number;
    highlighted: boolean;
    highlight_color: undefined | string;
};

// map from wat line to highlight color[ used for **actually** injected injections]
export type highlights_info = Record<number, string>;
// map from injection id to highlight color
// [ used for opBodyProbes, locals and funcProbes that are represented via dangling circles ]
export type inj_circle_highlights_info = Record<number, string>;

export type valid_model = {
	injected_wat: string,
	lines_injected: number[],
    wat_to_injection_circle: Record<number, injection_circle[]>
}