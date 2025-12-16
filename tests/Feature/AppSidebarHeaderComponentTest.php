<?php

test('the sidebar header does not show a settings cog icon button', function () {
    $contents = file_get_contents(base_path('resources/js/components/app-sidebar-header.tsx'));

    expect($contents)->not->toContain('Settings');
});
