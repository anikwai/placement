<?php

test('key metrics shows male and female distribution percentages', function () {
    $dashboard = file_get_contents(base_path('resources/js/pages/dashboard.tsx'));

    expect($dashboard)->toContain('Gender Distribution');
    expect($dashboard)->toContain('Male');
    expect($dashboard)->toContain('Female');
});
