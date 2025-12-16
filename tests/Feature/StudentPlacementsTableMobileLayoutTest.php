<?php

test('student placements table stacks filters and hides extra columns on mobile', function () {
    $table = file_get_contents(base_path('resources/js/components/student-placements-table.tsx'));

    expect($table)->toContain('has-data-[slot=card-action]:grid-cols-1');
    expect($table)->toContain('col-start-1 row-start-3');
    expect($table)->toContain('overflow-x-auto');
    expect($table)->toContain('sm:table-cell');
    expect($table)->toContain('sm:hidden');
    expect($table)->toContain('useIsMobile');
    expect($table)->toContain('paginationLinks');
    expect($table)->toContain("only={['placements']}");
    expect($table)->toContain('prefetch={paginationPrefetch}');
    expect($table)->toContain('replace');
    expect($table)->toContain('Previous page');
    expect($table)->toContain('Next page');
});
