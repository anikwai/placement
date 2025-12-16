<?php

test('dashboard layout groups key metrics and avoids unclear actions', function () {
    $dashboard = file_get_contents(base_path('resources/js/pages/dashboard.tsx'));

    expect($dashboard)->toContain('Key Metrics');
    expect($dashboard)->not->toContain('<span>→</span>');
    expect($dashboard)->not->toContain('sr-only">View All');
});
