<?php

test('calendar component includes range selection class names for highlighting', function () {
    $contents = file_get_contents(base_path('resources/js/components/ui/calendar.tsx'));

    expect($contents)->toContain('range_start');
    expect($contents)->toContain('range_end');
    expect($contents)->toContain('range_middle');
    expect($contents)->toContain('day-range-start');
    expect($contents)->toContain('day-range-end');
});
