<?php

test('dashboard highlights the active top placement bar', function () {
    $dashboard = file_get_contents(base_path('resources/js/pages/dashboard.tsx'));

    expect($dashboard)->toContain('activeTopPlacementIndex');
    expect($dashboard)->toContain('setActiveTopPlacementIndex');
    expect($dashboard)->toContain('highlightedTopPlacementIndex');
    expect($dashboard)->toContain('colorStudentActive');
    expect($dashboard)->toContain('<Cell');
    expect($dashboard)->toContain('onMouseEnter');
    expect($dashboard)->toContain('PlacementSchoolTick');
    expect($dashboard)->toContain('<title>');
});
