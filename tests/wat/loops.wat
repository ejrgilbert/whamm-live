(module
  (type (;0;) (func (param i32)))
  (type (;1;) (func (result i32)))
  (type (;2;) (func (param i32 i32) (result i32)))
  (import "env" "buffer" (memory (;0;) 80))
  (import "env" "log_i32" (func $log_i32 (;0;) (type 0)))
  (import "env" "rand_i32" (func $rand_i32 (;1;) (type 1)))
  (export "add_all" (func $main))
  (export "rand_multiple_of_10" (func 3))
  (export "first_power_over_limit" (func 4))
  (export "main" (func $main))
  (func $main (;2;) (type 2) (param $start i32) (param $count i32) (result i32)
    (local $i i32) (local $read_offset i32) (local $result i32)
    i32.const 0
    local.set $i
    loop $addloop
      block $breakaddloop
        local.get $i
        local.get $count
        i32.ge_s
        br_if $breakaddloop
        local.get $start
        local.get $i
        i32.const 4
        i32.mul
        i32.add
        local.set $read_offset
        local.get $result
        local.get $read_offset
        i32.load
        i32.add
        local.set $result
        local.get $i
        i32.const 1
        i32.add
        local.set $i
        br $addloop
      end
    end
    local.get $result
  )
  (func (;3;) (type 1) (result i32)
    (local $n i32)
    loop $randloop
      call $rand_i32
      local.set $n
      local.get $n
      i32.const 10
      i32.rem_u
      i32.const 0
      i32.ne
      br_if $randloop
    end
    local.get $n
  )
  (func (;4;) (type 2) (param $base i32) (param $limit i32) (result i32)
    (local $n i32)
    i32.const 1
    local.set $n
    loop $powerloop
      block $breakpowerloop
        local.get $n
        local.get $limit
        i32.gt_s
        br_if $breakpowerloop
        local.get $n
        local.get $base
        i32.mul
        local.set $n
        br $powerloop
      end
    end
    local.get $n
  )
)
