(module $moduleName
  (type (;0;) (func))
  (import "wasi_snapshot_preview1" "fd_write" (func (;0;) (type 29)))
  (import "wasi_snapshot_preview1" "random_get" (func (;1;) (type 30)))
  (import "memory_import" "memory" (memory (;0;) 1))
  (import "wasi_snapshot_preview3" "random_set" (func (;2;) (type 25)))
  (import "wasi_snapshot_preview4" "random_met" (func (;3;) (type 22)))
  (func $funcName (;4;) (type 0)
    (local i32 i32)
    i32.const 10
    drop
  )
  (@producers
    (language "C11" "")
    (processed-by "clang" "19.1.5-wasi-sdk (https://github.com/llvm/llvm-project ab4b5a2db582958af1ee308a790cfdb42bd24720)")
  )
)
