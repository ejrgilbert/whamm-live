// Different types and enums for API responses

// Enums
export enum InjectType{
    probe,
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
