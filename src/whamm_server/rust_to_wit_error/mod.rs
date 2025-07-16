// From trait implementation for whamm API responses
use crate::vscode::example::types::{ErrorCodeLocation, LineColData, SpanData, WhammApiError};
use whamm::api::instrument::WhammError;
use whamm::common::error::CodeLocation;

impl From<WhammError> for WhammApiError{
    fn from(value: WhammError) -> Self {
        WhammApiError {
            err_loc:
                match value.err_loc {
                    None => None,
                    Some(value) => Some(ErrorCodeLocation::from(value))
                },
            info_loc:
                match value.info_loc {
                    None => None,
                    Some(value) => Some(ErrorCodeLocation::from(value))
                },
            message: value.msg
        }
    } 
}

impl From<CodeLocation> for ErrorCodeLocation{
    fn from(value: CodeLocation) -> Self {
        ErrorCodeLocation {
            is_err: value.is_err,
            message: value.message,
            line_col: SpanData::from(value.line_col),
            line_str: value.line_str,
            line2_str: value.line2_str}
    }
}

use pest::error::LineColLocation;
impl From<LineColLocation> for SpanData{
    fn from(value: LineColLocation) -> Self {
        match value{
            LineColLocation::Pos(value) => {
                let value = from_usize_to_u32(value);
                SpanData{
                    lc0: LineColData{l: value.0, c: value.1},
                    lc1: LineColData{l: value.0, c: value.1 + 1},
                }
            }
            LineColLocation::Span(value1, value2) =>{
                let value1 = from_usize_to_u32(value1);
                let value2 = from_usize_to_u32(value2);
                SpanData{
                    lc0: LineColData{l: value1.0, c: value1.1},
                    lc1: LineColData{l: value2.0, c: value2.1},
                }
            }
        }
    }
}

fn from_usize_to_u32(value: (usize, usize)) -> (u32, u32){
    (value.0 as u32, value.1 as u32)
}