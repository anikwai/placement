<?php

test('gender split card clarifies totals are placed students', function () {
    $dashboard = file_get_contents(base_path('resources/js/pages/dashboard.tsx'));

    expect($dashboard)->toContain('Gender Split');
    expect($dashboard)->toContain('Year 7 exam passers who received a placement');
    expect($dashboard)->toContain('PLACED');
});
