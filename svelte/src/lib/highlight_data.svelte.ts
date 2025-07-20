// Wat line to color to highlight with
export type line_highlights_info = Record<number, string>;
// Injection ID to color to highlight with
export type inj_circle_highlights_info = Record<number, string>;

// The lines, circles to highlight based on user's cursor changes
type highlightData = {
    lines: line_highlights_info,
    circles: inj_circle_highlights_info 
    all_wat_lines: number[];
}

export type injection_circle = {
    color: string;
    body: string;
    injection_id: number;
    highlighted: boolean;
    highlight_color: undefined | string;
};

export var highlight_data: highlightData = $state({
    lines: {},
    circles: {},
    all_wat_lines: []
});

export function reset_highlight_data(){
    highlight_data.lines = {};
    highlight_data.circles = {};
    highlight_data.all_wat_lines = [];
}

export function update_highlight_data(line_data: line_highlights_info, circle_data: inj_circle_highlights_info, all_wat_lines: number[]){
    highlight_data.lines = line_data;
    highlight_data.circles = circle_data;
    highlight_data.all_wat_lines = all_wat_lines;
}