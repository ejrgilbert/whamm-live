import {FSMSectionReorder } from '../src/model/fsm_section_order';
import fs from 'fs';
import path from 'path';
import toml from 'toml';

const toml_file_path = path.resolve(__dirname, 'fsm_section_order.test.toml'); 
describe('testing FSM section ordering', () => {

    const config = toml.parse(fs.readFileSync(toml_file_path, 'utf-8'));
    let ordered_wat_dir = config.config.ordered_wat_dir;
    let unordered_wat_dir = config.config.unordered_wat_dir;
  
    for (let filename of config["compare_files"]?.files) {
        test('compare the expected wat output with unordered wat input the mappings', () => {
            // test each file
                let unordered_wat = fs.readFileSync(path.join(__dirname, unordered_wat_dir, filename), 'utf-8');
                let ordered_wat = fs.readFileSync(path.join(__dirname, ordered_wat_dir, filename), 'utf-8');

                let fsm_reorder = new FSMSectionReorder(unordered_wat);
                fsm_reorder.run();
                expect(fsm_reorder.new_wat?.trim()).toBe(ordered_wat.trim());

        });
    }
});