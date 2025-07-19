// Wat line to color to highlight with
export type line_highlights_info = Record<number, string>;
// Injection ID to color to highlight with
export type inj_circle_highlights_info = Record<number, string>;

type highlightData = {
    lines: line_highlights_info,
    circles: inj_circle_highlights_info 
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
    circles: {}
});
