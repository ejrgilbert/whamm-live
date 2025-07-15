use crate::vscode::example::types::*;
use whamm::api::instrument::{Injection, Cause};
use wirm::ir::types::{FuncInstrMode, InstrumentationMode};

impl Default for WhammInjection {
    fn default() -> Self {
        Self { data_type: WhammDataType::OpProbeType, import_data: None, export_data: None, type_data: None, memory_data: None, active_data: None, passive_data: None, global_data: None, function_data: None, local_data: None, table_data: None, element_data: None, op_probe_data: None, func_probe_data: None }
    }
}

impl From<Injection> for WhammInjection{
    fn from(injection: Injection) -> Self {
        match injection {
            Injection::Import{ module, name, type_ref, cause} =>{
                let import_record = ImportRecord {
                    module,
                    name,
                    type_ref: format!("{:?}", type_ref),
                    cause:  WhammCause::from(cause) };
                
                WhammInjection {
                    data_type: WhammDataType::ImportType,
                    import_data: Some(import_record),
                    ..Default::default() 
                }
            },

            Injection::Export { name, kind, index, cause } =>{
                let export_record = ExportRecord{
                    name,
                    kind: format!("{:?}", kind),
                    index,
                    cause: WhammCause::from(cause) };
                WhammInjection {
                    data_type: WhammDataType::ExportType,
                    export_data: Some(export_record),
                    ..Default::default() 
                }
            },

            Injection::Type { ty, cause } =>{
                let type_record = TypeRecord{
                    ty: format!("{:?}", ty),
                    cause: WhammCause::from(cause) };
                WhammInjection {
                    data_type: WhammDataType::TypeType,
                    type_data: Some(type_record),
                    ..Default::default() 
                }
            },

            Injection::Memory { id, initial, maximum, cause } =>{
                let memory_record = MemoryRecord{
                    id, initial, maximum,
                    cause: WhammCause::from(cause) };
                WhammInjection {
                    data_type: WhammDataType::MemoryType,
                    memory_data: Some(memory_record),
                    ..Default::default() 
                }
            },

            Injection::ActiveData { memory_index, offset_expr, data, cause } =>{
                let active_data = ActiveDataRecord{
                    memory_index,
                    offset_expr,
                    data,
                    cause: WhammCause::from(cause) };
                WhammInjection {
                    active_data: Some(active_data),
                    data_type: WhammDataType::ActiveDataType,
                    ..Default::default() 
                }
            },

            Injection::PassiveData { data, cause } =>{
                let passive_data = PassiveDataRecord{
                    data,
                    cause: WhammCause::from(cause)};
                WhammInjection {
                    passive_data: Some(passive_data),
                    data_type: WhammDataType::PassiveDataType,
                    ..Default::default()}
            },

            Injection::Global { id, ty, shared, mutable, init_expr, cause } =>{
                let global_record = GlobalRecord{
                    id,
                    ty: format!("{:?}", ty),
                    shared,
                    mutable,
                    init_expr,
                    cause: WhammCause::from(cause),
                };
                WhammInjection {
                    global_data: Some(global_record),
                    data_type: WhammDataType::GlobalType,
                    ..Default::default()}
            },

            Injection::Func { id, fname, sig, locals, body, cause } =>{
                let params = get_string_contents(&sig.0);
                let results = get_string_contents(&sig.1);
                let function_record = FunctionRecord{
                    id,
                    fname,
                    sig: (params, results),
                    locals: get_string_contents(&locals),
                    body,
                    cause: WhammCause::from(cause),
                };
                WhammInjection {
                    function_data: Some(function_record),
                    data_type: WhammDataType::FunctionType,
                    ..Default::default()}
            },

            Injection::Local { target_fid, ty, cause } =>{
                let local_record = LocalRecord{
                    target_fid: target_fid,
                    ty: format!("{:?}", ty),
                    cause: WhammCause::from(cause),
                };
                WhammInjection {
                    local_data: Some(local_record),
                    data_type: WhammDataType::LocalType,
                    ..Default::default()}
            }

            Injection::Table {cause } =>{
                WhammInjection {
                    table_data: Some(TableRecord { cause: WhammCause::from(cause) }),
                    data_type: WhammDataType::TableType,
                    ..Default::default()}
            },

            Injection::Element { cause } =>{
                WhammInjection {
                    element_data: Some(ElementRecord { cause: WhammCause::from(cause) }),
                    data_type: WhammDataType::ElementType,
                    ..Default::default()}
            }

            Injection::OpProbe { target_fid, target_opcode_idx, mode, body, cause } =>{
                let op_probe_record = OpProbeRecord{
                    target_fid,
                    target_opcode_idx,
                    body,
                    mode: FuncBodyInstrumentationMode::from(mode),
                    cause: WhammCause::from(cause),
                };
                WhammInjection {
                    op_probe_data: Some(op_probe_record),
                    data_type: WhammDataType::OpProbeType,
                    ..Default::default()}
            }

            Injection::FuncProbe { target_fid, mode, body, cause }=>{
                let func_probe_record = FuncProbeRecord{
                    target_fid,
                    body,
                    mode: FuncInstrumentationMode::from(mode),
                    cause: WhammCause::from(cause),
                };
                WhammInjection {
                    func_probe_data: Some(func_probe_record),
                    data_type: WhammDataType::FuncProbeType,
                    ..Default::default()}
            }
        }
    }
}

impl From<Cause> for WhammCause{
    fn from(value: Cause) -> Self {
       match value{
        Cause::UserPos { lc }=>{
            WhammCause::UserPos( SpanData{
                lc0: LineColData { l: lc.l, c: lc.c },
                lc1: LineColData { l: lc.l, c: lc.c + 1}})
        },
        Cause::UserProbe { lc0, lc1 }=>{
            WhammCause::UserProbe(
                SpanData { lc0: LineColData { l: lc0.l, c: lc0.c },
                        lc1: LineColData { l: lc1.l, c: lc1.c } }
                    )
        },
        Cause::UserSpan { lc0, lc1 }=>{
            WhammCause::UserSpan(
                SpanData { lc0: LineColData { l: lc0.l, c: lc0.c },
                        lc1: LineColData { l: lc1.l, c: lc1.c } }
                    )
        },
        Cause::Whamm => WhammCause::Whamm
       }
    }
}

impl From<InstrumentationMode> for FuncBodyInstrumentationMode{
    fn from(value: InstrumentationMode) -> Self {
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

impl From<FuncInstrMode> for FuncInstrumentationMode{
    fn from(value: FuncInstrMode) -> Self {
       match value {
            FuncInstrMode::Entry=>FuncInstrumentationMode::Entry, 
            FuncInstrMode::Exit=>FuncInstrumentationMode::Exit, 
       } 
    }
}

pub fn get_string_contents<T: std::fmt::Display>(array: &Vec<T>) -> Vec<String> {
    array. iter().map(|p| p.to_string()).collect()
}