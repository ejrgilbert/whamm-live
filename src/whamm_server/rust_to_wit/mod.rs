use crate::vscode::example::types::{ActiveDataRecord, ElementRecord, ExportRecord, FuncBodyInstrumentationMode, FuncInstrumentationMode, FuncProbeRecord, FunctionRecord, GlobalRecord, ImportRecord, LocalRecord, MemoryRecord, OpProbeRecord, PassiveDataRecord, TableRecord, TypeRecord, WhammCause, WhammInjectType, WhammInjection};
use whamm::api::instrument::{Injection, Cause};
use wirm::ir::types::{FuncInstrMode, InstrumentationMode};

impl From<&Injection> for WhammInjection{
    fn from(injection: &Injection) -> Self {

        match injection {
            Injection::Import{ module, name, type_ref, cause} =>{
                let import_record = ImportRecord {
                    module: module.to_string(),
                    name: name.to_string(),
                    type_ref: type_ref.to_string(),
                    cause:  WhammCause::from(cause) };
                WhammInjection::ImportType(import_record)
            },

            Injection::Export { name, kind, index, cause } =>{
                let export_record = ExportRecord{
                    name: name.to_string(),
                    kind: kind.to_string(),
                    index: *index,
                    cause: WhammCause::from(cause) };
                WhammInjection::ExportType(export_record)
            },

            Injection::Type { ty, cause } =>{
                WhammInjection::TypeType(TypeRecord{
                    ty: ty.to_string(),
                    cause: WhammCause::from(cause) })
            },

            Injection::Memory { id, initial, maximum, cause } =>{
                let memory_record = MemoryRecord{
                    id: *id, initial: *initial, maximum: *maximum,
                    cause: WhammCause::from(cause) };
                WhammInjection::MemoryType(memory_record)
            },

            Injection::ActiveData { memory_index, offset_expr, data, cause } =>{
                let active_data = ActiveDataRecord{
                    memory_index: *memory_index,
                    offset_expr: offset_expr.clone(),
                    data: data.clone(),
                    cause: WhammCause::from(cause) };
                WhammInjection::ActiveDataType(active_data)
            },

            Injection::PassiveData { data, cause } =>{
                let passive_data = PassiveDataRecord{
                    data: data.clone(),
                    cause: WhammCause::from(cause)};
                WhammInjection::PassiveDataType(passive_data)
            },

            Injection::Global { id, ty, shared, mutable, init_expr, cause } =>{
                let global_record = GlobalRecord{
                    id: *id, 
                    ty: ty.to_string(),
                    shared: *shared,
                    mutable: *mutable,
                    init_expr: init_expr.clone(),
                    cause: WhammCause::from(cause),
                };
                WhammInjection::GlobalType(global_record)
            },

            Injection::Func { id, fname, sig, locals, body, cause } =>{
                let function_record = FunctionRecord{
                    id: *id,
                    fname: fname.clone(),
                    sig: sig.clone(),
                    locals: locals.clone(),
                    body: body.clone(),
                    cause: WhammCause::from(cause),
                };
                WhammInjection::FunctionType(function_record)
            },

            Injection::Local { target_fid, ty, cause } =>{
                let local_record = LocalRecord{
                    target_fid: *target_fid,
                    ty: ty.to_string(),
                    cause: WhammCause::from(cause),
                };
                WhammInjection::LocalType(local_record)
            }

            Injection::Table {cause } =>{
                WhammInjection::TableType(TableRecord { cause: WhammCause::from(cause) })
            },

            Injection::Element { cause } =>{
                WhammInjection::ElementType(ElementRecord { cause: WhammCause::from(cause) })
            }

            Injection::OpProbe { target_fid, target_opcode_idx, mode, body, cause } =>{
                let op_probe_record = OpProbeRecord{
                    target_fid: *target_fid,
                    target_opcode_idx: *target_opcode_idx,
                    mode: FuncBodyInstrumentationMode::from(mode),
                    body: body.clone(),
                    cause: WhammCause::from(cause),
                };
                WhammInjection::OpProbeType(op_probe_record)
            }

            Injection::FuncProbe { target_fid, mode, body, cause }=>{
                let func_probe_record = FuncProbeRecord{
                    target_fid: *target_fid,
                    mode: FuncInstrumentationMode::from(mode),
                    body: body.clone(),
                    cause: WhammCause::from(cause),
                };
                WhammInjection::FuncProbeType(func_probe_record)
            }
        }
    }
}

impl From<&Cause> for WhammCause{
    fn from(value: &Cause) -> Self {
       match value{
        Cause::UserPos { lc }=>{
            todo!()
        },
        Cause::UserProbe { lc0, lc1 }=>{
            todo!()
        },
        Cause::UserSpan { lc0, lc1 }=>{
            todo!()
        },
        Cause::Whamm => WhammCause::Whamm
       }
    }
}

impl From<&InstrumentationMode> for FuncBodyInstrumentationMode{
    fn from(value: &InstrumentationMode) -> Self {
       match value {
          InstrumentationMode::After => FuncBodyInstrumentationMode::After,
          InstrumentationMode::Before => FuncBodyInstrumentationMode::Before,
          InstrumentationMode::Alternate => FuncBodyInstrumentationMode::Alternate,
          InstrumentationMode::SemanticAfter => FuncBodyInstrumentationMode::SemanticAfter,
          InstrumentationMode::BlockEntry => FuncBodyInstrumentationMode::BlockEntry,
          InstrumentationMode::BlockExit=> FuncBodyInstrumentationMode::BlockExit,
          InstrumentationMode::BlockAlt => FuncBodyInstrumentationMode::BlockAlt,
       } 
    }
}

impl From<&FuncInstrMode> for FuncInstrumentationMode{
    fn from(value: &FuncInstrMode) -> Self {
       match value {
            FuncInstrMode::Entry=>FuncInstrumentationMode::Entry, 
            FuncInstrMode::Exit=>FuncInstrumentationMode::Exit, 
       } 
    }
}