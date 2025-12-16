<?php

test('dashboard layout avoids mobile grid overflow and adapts charts', function () {
    $dashboard = file_get_contents(base_path('resources/js/pages/dashboard.tsx'));

    expect($dashboard)->toContain('lg:col-span-2');
    expect($dashboard)->toContain('useIsMobile');
    expect($dashboard)->toContain('numberOfMonths={isMobile ? 1 : 2}');
    expect($dashboard)->toContain('tick={');
    expect($dashboard)->toContain("value: 'Schools'");
    expect($dashboard)->toContain('aria-label="Choose date range"');
    expect($dashboard)->toContain('size="icon"');
    expect($dashboard)->toContain('sm:h-8 sm:w-auto sm:px-3');
    expect($dashboard)->toContain('collisionPadding={16}');
});
