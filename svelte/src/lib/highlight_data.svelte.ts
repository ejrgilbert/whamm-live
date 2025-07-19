export type line_highlights_info = Record<number, string>;

type highlightData = {
    lines: line_highlights_info
}

export var highlight_data: highlightData = $state({
    lines: {}
});
