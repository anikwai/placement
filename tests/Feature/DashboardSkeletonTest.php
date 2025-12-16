<?php

test('dashboard uses skeletons during data refresh', function () {
    $dashboard = file_get_contents(base_path('resources/js/pages/dashboard.tsx'));
    $table = file_get_contents(base_path('resources/js/components/student-placements-table.tsx'));

    expect($dashboard)->toContain('isRefreshing');
    expect($dashboard)->toContain('isDeferredLoading');
    expect($dashboard)->toContain('const isLoading = isRefreshing || isDeferredLoading');
    expect($dashboard)->toContain("router.on('start'");
    expect($dashboard)->toContain('<Skeleton');
    expect($dashboard)->toContain('isLoading={isLoading}');

    expect($table)->toContain('isLoading');
    expect($table)->toContain('<Skeleton');
});
