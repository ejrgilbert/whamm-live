(module
  (type (;0;) (func (result i32)))
  (export "escaped\"string" (func $main))
  (func $main (;0;) (type 0) (result i32)
    i32.const 10
    i32.const 5
    i32.add)
  (data (;1;) (i32.const 230) "\"Hello\"Wha\"\"mm")
)
