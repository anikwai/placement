<?php

test('key metrics does not show last year comparison when unavailable', function () {
    $dashboard = file_get_contents(base_path('resources/js/pages/dashboard.tsx'));

    expect($dashboard)->not->toContain('vs last year');
    expect($dashboard)->not->toContain('↑ 3.6%');
    expect($dashboard)->not->toContain('↑ 2.5%');
    expect($dashboard)->not->toContain('↓ 5.0%');
});
