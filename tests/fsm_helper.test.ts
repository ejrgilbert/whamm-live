import {FSM } from '../src/model/fsm';
import {FSMHelper} from '../src/model/utils/fsm_helper';

// DO NOT CHANGE THE CONTENTS OF THE STRING UNLESS YOU KNOW WHAT YOU ARE DOING
function create_fsm_instance(){
  return new FSM('\t\r \n(module\n\t(memory 1)\n\t(func $f1 (param $p1 i32))\n\t(data (i32.const 0) "hello" )\n)')
}

describe('test FSMHelper char consumption methods', () => {
  let instance: FSM;

  test('end_of_file test', () => {
    instance = create_fsm_instance();
    expect(FSMHelper.end_of_file(instance)).toBeFalsy();
    instance.current_index = instance.wat_string.length;
    expect(FSMHelper.end_of_file(instance)).toBeTruthy();
  });

  test('consume_empty_spaces test', () => {
    instance = create_fsm_instance();
    FSMHelper.consume_empty_spaces(instance);
    expect(instance).toMatchObject({current_index : 4, current_line_number: 2});
  });

  test('get_char test', () => {
    instance = create_fsm_instance();
    expect(FSMHelper.get_char(instance)).toEqual('\t');
    instance.current_index++;
    expect(FSMHelper.get_char(instance)).toEqual('\r');
  });

  test('consume_char test', () => {
    instance = create_fsm_instance();
    let char = FSMHelper.consume_char(instance);
    expect(char).toEqual('\t');
    expect(instance).toMatchObject({current_index : 1});
  });

  test('get_word test', () => {
    instance = create_fsm_instance();
    let word = FSMHelper.get_word(instance);
    expect(word).toEqual('module');
  });

  test('consume_until_string_ends test', () => {
    instance = create_fsm_instance();
    instance.current_index = 74;
    FSMHelper.consume_until_string_ends('"', instance);
    expect(instance.current_index).toBe(79);
  });

  test('consume_until_closing_parenthesis test', () => {
    instance = create_fsm_instance();
    instance.current_index = 54;
    FSMHelper.consume_until_closing_parenthesis(instance);
    expect(instance.current_index).toBe(81);
  });

  test('consume_until_whitespace test', () => {
    instance = create_fsm_instance();
    instance.current_index = 4;
    FSMHelper.consume_until_whitespace(instance);
    expect(instance).toMatchObject({current_line_number: 1, current_index: 11})
  });

});