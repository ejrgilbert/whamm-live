import {FSM } from '../src/model/fsm';

describe('testing index file', () => {
  test('empty string should result in zero', () => {
    expect(new FSM(`(module
        (type $hshs)
        )`)).not.toBe(0);
  });
});