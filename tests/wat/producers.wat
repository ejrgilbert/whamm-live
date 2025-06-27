(module
  (type (;0;) (func (result i32)))
  (export "main" (func $main))
  (func $main (;0;) (type 0) (result i32)
    i32.const 10
    i32.const -1
    i32.add
  )
  (@producers
    (language "live-whamm" "")
    (processed-by "whamm" "")
  )
)
