(module
  (type (;0;) (func (param i32 i32)))
  (type (;1;) (func))
  (type (;2;) (func (param i32) (result i32)))
  (import "wizeng" "puts" (func $puts (;0;) (type 0)))
  (memory (;0;) 1)
  (export "main" (func $main))
  (export "memory" (memory 0))
  (func $main (;1;) (type 1)
    (local i32)
    i32.const 0
    call $call_target
    local.set 0
    block ;; label = @1
      local.get 0
      br_if 1
    end
  )
  (func $call_target (;2;) (type 2) (param i32) (result i32)
    block ;; label = @1
      local.get 0
      br_if 0 (;@1;)
      call $foo
    end
    call $bar
    local.get 0
  )
  (func $foo (;3;) (type 1)
    i32.const 0
    i32.const 4
    call $puts
    br 0
  )
  (func $bar (;4;) (type 1)
    i32.const 4
    i32.const 4
    call $puts
    br 0
  )
  (data (;0;) (i32.const 0) "foo\0a")
  (data (;1;) (i32.const 4) "bar\0a")
)
