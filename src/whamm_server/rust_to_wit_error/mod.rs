// From trait implementation for whamm API responses
use crate::vscode::example::types::{ErrorCodeLocation, LineColumnLocation, WhammApiError};
use whamm::common::error::{self};

impl From<&error::WhammError> for WhammApiError{
    fn from(value: &error::WhammError) -> Self {
        WhammApiError {
            match_rule: value.match_rule.clone(),
            fatal: value.fatal,
            err_loc: match &value.err_loc{
                    Some(value) => Some(ErrorCodeLocation::from(value)),
                    None => None,
                },
            info_loc: match &value.info_loc{
                    Some(value) => Some(ErrorCodeLocation::from(value)),
                    None => None,
                },
            ty: {
                let name = value.ty.name();
                let message = value.ty.message();
                format!("{name}: {message}")
            }
        }
    } 
}

impl From<&error::CodeLocation> for ErrorCodeLocation{
    fn from(value: &error::CodeLocation) -> Self {
        ErrorCodeLocation {
            is_err: value.is_err,
            message: value.message.clone(),
            line_col: LineColumnLocation::from(value.line_col.clone()),
            line_str: value.line_str.clone(),
            line2_str: value.line2_str.clone()}
    }
}

use pest::error::LineColLocation;
impl From<LineColLocation> for LineColumnLocation{
    fn from(value: LineColLocation) -> Self {
        match value{
            LineColLocation::Pos(value) => {
                LineColumnLocation::Pos(from_usize_to_u64(value))
            }
            LineColLocation::Span(value1, value2) =>{
                LineColumnLocation::Span(((from_usize_to_u64(value1)), from_usize_to_u64(value2)))
            }
        }
    }
}

fn from_usize_to_u64(value: (usize, usize)) -> (u64, u64){
    (value.0 as u64, value.1 as u64)
}