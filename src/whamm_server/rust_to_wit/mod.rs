use crate::vscode::example::types::*;
use whamm::api::instrument::{Injection, Cause};
use wirm::ir::types::{FuncInstrMode, InstrumentationMode};

impl WhammInjection{
    fn new(data_type: WhammDataType)-> Self{
        // op probe by default
        WhammInjection { data_type: data_type, type_data: None, import_data: None, export_data: None, memory_data: None, active_data: None, passive_data: None, global_data: None, function_data: None, local_data: None, table_data: None, element_data: None, op_probe_data: None, func_probe_data: None }
    }
}

impl From<&Injection> for WhammInjection{
    fn from(injection: &Injection) -> Self {

        match injection {
            Injection::Import{ module, name, type_ref, cause} =>{
                let import_record = ImportRecord {
                    module: module.to_string(),
                    name: name.to_string(),
                    type_ref: type_ref.to_string(),
                    cause:  WhammCause::from(cause) };
                let mut import_value = WhammInjection::new(WhammDataType::ImportType);
                import_value.import_data = Some(import_record);
                import_value
            },

            Injection::Export { name, kind, index, cause } =>{
                let export_record = ExportRecord{
                    name: name.to_string(),
                    kind: kind.to_string(),
                    index: *index,
                    cause: WhammCause::from(cause) };
                let mut export_value = WhammInjection::new(WhammDataType::ExportType);
                export_value.export_data = Some(export_record);
                export_value
            },

            Injection::Type { ty, cause } =>{
                let type_record = TypeRecord{
                    ty: ty.to_string(),
                    cause: WhammCause::from(cause) };
                let mut type_value = WhammInjection::new(WhammDataType::TypeType);
                type_value.type_data = Some(type_record);
                type_value
            },

            Injection::Memory { id, initial, maximum, cause } =>{
                let memory_record = MemoryRecord{
                    id: *id, initial: *initial, maximum: *maximum,
                    cause: WhammCause::from(cause) };
                let mut memory_value = WhammInjection::new(WhammDataType::MemoryType);
                memory_value.memory_data = Some(memory_record);
                memory_value
            },

            Injection::ActiveData { memory_index, offset_expr, data, cause } =>{
                let active_data = ActiveDataRecord{
                    memory_index: *memory_index,
                    offset_expr: offset_expr.clone(),
                    data: data.clone(),
                    cause: WhammCause::from(cause) };
                let mut active_data_value = WhammInjection::new(WhammDataType::ActiveDataType);
                active_data_value.active_data = Some(active_data);
                active_data_value
            },

            Injection::PassiveData { data, cause } =>{
                let passive_data = PassiveDataRecord{
                    data: data.clone(),
                    cause: WhammCause::from(cause)};
                let mut passive_data_value = WhammInjection::new(WhammDataType::PassiveDataType);
                passive_data_value.passive_data = Some(passive_data);
                passive_data_value
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
                let mut global_value = WhammInjection::new(WhammDataType::GlobalType);
                global_value.global_data = Some(global_record);
                global_value
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
                let mut function_value = WhammInjection::new(WhammDataType::FunctionType);
                function_value.function_data = Some(function_record);
                function_value
            },

            Injection::Local { target_fid, ty, cause } =>{
                let local_record = LocalRecord{
                    target_fid: *target_fid,
                    ty: ty.to_string(),
                    cause: WhammCause::from(cause),
                };
                let mut local_value = WhammInjection::new(WhammDataType::LocalType);
                local_value.local_data = Some(local_record);
                local_value
            }

            Injection::Table {cause } =>{
                let mut table_value = WhammInjection::new(WhammDataType::TableType);
                table_value.table_data = Some(TableRecord { cause: WhammCause::from(cause) });
                table_value
            },

            Injection::Element { cause } =>{
                let mut element_value = WhammInjection::new(WhammDataType::ElementType);
                element_value.element_data = Some(ElementRecord { cause: WhammCause::from(cause) });
                element_value
            }

            Injection::OpProbe { target_fid, target_opcode_idx, mode, body, cause } =>{
                let op_probe_record = OpProbeRecord{
                    target_fid: *target_fid,
                    target_opcode_idx: *target_opcode_idx,
                    mode: FuncBodyInstrumentationMode::from(mode),
                    body: body.clone(),
                    cause: WhammCause::from(cause),
                };
                let mut op_probe_value = WhammInjection::new(WhammDataType::OpProbeType);
                op_probe_value.op_probe_data = Some(op_probe_record);
                op_probe_value
            }

            Injection::FuncProbe { target_fid, mode, body, cause }=>{
                let func_probe_record = FuncProbeRecord{
                    target_fid: *target_fid,
                    mode: FuncInstrumentationMode::from(mode),
                    body: body.clone(),
                    cause: WhammCause::from(cause),
                };
                let mut func_probe_value = WhammInjection::new(WhammDataType::FuncProbeType);
                func_probe_value.func_probe_data = Some(func_probe_record);
                func_probe_value
            }
        }
    }
}

impl From<&Cause> for WhammCause{
    fn from(value: &Cause) -> Self {
       match value{
        Cause::UserPos { lc }=>{
            WhammCause::UserPos(LineColData { l: lc.l, c: lc.c })
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