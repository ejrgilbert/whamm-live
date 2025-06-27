(module
  (type (;0;) (func (param i32 i32)))
  (import "wasi_snapshot_preview1" "fd_write" (func (;0;) (type 29)))
  (import "wasi_snapshot_preview1" "random_get" (func (;1;) (type 30)))
  (table (;0;) 5 5 funcref)
  (memory (;0;) 2)
  (tag $ocaml_exit_6 (;0;) (type 0) (param i32 i32))
  (global (;0;) (mut i32) i32.const 85552)
  (export "mem" (memory 0))
  (export "main" (func $main))
  (start $main)
  (elem (;0;) (i32.const 1) func 39 38 37 36)
  (func $main (;2;) (type 1)
    (local i32 i32)
    i32.const 52445
    i32.const 14
    i32.add
  )
  (data (;0;) (i32.const 52445) "Hello Wizeng!\0aEXTRA_JUNK")
  (data (;1;) (i32.const 230) "Hello Whamm")
  (@producers
    (language "C11" "")
    (processed-by "clang" "19.1.5-wasi-sdk (https://github.com/llvm/llvm-project ab4b5a2db582958af1ee308a790cfdb42bd24720)")
  )
)
