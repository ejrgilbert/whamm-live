(module
  (type (;0;) (func))
  (export "_start" (func $start))
  (export "main" (func $main))
  (func $start (;0;) (type 0)
    call $main
  )
  (func $main (;1;) (type 0)
    (local $y i32)
    i32.const 10
    local.set $y
    loop $l
      call $foo
      call $bar
      call $foo
      call $baz
      call $foo
      call $foo
      call $foo
      call $bar
      call $bar
      call $foo
      local.get $y
      i32.const 1
      i32.sub
      local.tee $y
      br_if $l
    end
  )
  (func $foo (;2;) (type 0))
  (func $bar (;3;) (type 0)
    call $baz
  )
  (func $baz (;4;) (type 0))
)
