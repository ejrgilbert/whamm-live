(module
  (type (;0;) (func (result i32)))(@producers
    (language "live-whamm" "")
    (processed-by "whamm" "")
  )(func $main (;0;) (type 0) (result i32)
    i32.const 10
    i32.const -1
    i32.add
  )(export "main" (func $main))
)
