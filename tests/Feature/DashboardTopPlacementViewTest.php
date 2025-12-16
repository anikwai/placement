<?php

test('dashboard top placement schools table tab toggles a real table view', function () {
    $contents = file_get_contents(base_path('resources/js/pages/dashboard.tsx'));

    expect($contents)->toContain("setTopPlacementView('table')");
    expect($contents)->toContain("topPlacementView === 'table'");
    expect($contents)->toContain('<Table>');
});
