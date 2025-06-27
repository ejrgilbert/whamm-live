(module
  (type (;0;) (func (param i32 i32)))
  (type (;1;) (func))
  (import "wizeng" "puts" (func $puts (;0;) (type 0)))
  (memory (;0;) 1 1)
  (export "mem" (memory 0))
  (export "main" (func $main))
  (func $main (;1;) (type 1)
    i32.const 52445
    i32.const 14
    call $puts
  )
  (data (;0;) (i32.const 52445) "Hello Wizeng!\0aEXTRA_JUNK")
)
