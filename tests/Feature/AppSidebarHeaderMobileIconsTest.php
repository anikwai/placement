<?php

test('sidebar header uses icon search trigger on mobile', function () {
    $contents = file_get_contents(base_path('resources/js/components/app-sidebar-header.tsx'));

    expect($contents)->toContain('hidden flex-1 items-center justify-center px-4 md:flex');
    expect($contents)->toContain('md:hidden');
    expect($contents)->toContain('aria-label="Search placements"');
    expect($contents)->toContain('<Bell');
    expect($contents)->toContain('<Avatar');
});
