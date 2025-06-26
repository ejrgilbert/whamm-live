// Different types and enums for API responses

// Enums
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

export enum ModeKind{
    before,
    after,
    alt
}

// Types
export type ScriptLoc = {
    l: number,
    c: number,
}

export type Metadata = {
    script_start: ScriptLoc;
    script_end: ScriptLoc | undefined;
}
export type Probe = {
    target_fid: number,
    target_opcode_idx: number,
    mode: ModeKind,
    body: string[],
    metadata: Metadata | undefined
}

export type WhammError = {
    msg: string,
    err_loc: Metadata | undefined;
}

export type WhammResponse = {
    response: undefined | Map<InjectType, Probe[]>;
    error: WhammError[] | undefined;
}
