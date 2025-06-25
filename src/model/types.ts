// Different types and enums for API responses

// Enums
export enum InjectType{
    // Lined up in order in terms of sections as well 
    // until the last 2(Local and Probe)
    //  which would depend on their function IDs
    Type,
    Import,
    Table,
    Memory,
    Tag,
    Global,
    Export,
    Element,
    Func,
    Data,
    Local,
    FuncProbe,
    FuncBodyProbe,
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
