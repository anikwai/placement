<?php

test('the global placement search uses the shadcn command palette instead of a dialog', function () {
    $contents = file_get_contents(base_path('resources/js/components/placement-search-dialog.tsx'));

    expect($contents)->toContain('@/components/ui/command');
    expect($contents)->toContain('@/components/ui/popover');
    expect($contents)->not->toContain('@/components/ui/dialog');

    expect($contents)->toContain("event.key === 'Escape'");
    expect($contents)->toContain('results[0].student_name');
});
