(module
  (start $main)
  (tag $ocaml_exit_6 (;0;) (type 0) (param i32 i32))
  (global (;0;) (mut i32) i32.const 85552)
  (elem (;0;) (i32.const 1) func 39 38 37 36)
  (data (;0;) (i32.const 52445) "Hello Wizeng!\0aEXTRA_JUNK")
  (func $main (;0;) (type 1)
    (local i32 i32)
    (local i32 i32)
    i32.const 52445
    i32.const 14
    i32.add
  )
  (table (;0;) 5 5 funcref)
  (type (;0;) (func (param i32 i32)))
)
