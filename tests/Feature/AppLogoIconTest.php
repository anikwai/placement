<?php

test('app logo icon is the placement brand mark', function () {
    $icon = file_get_contents(base_path('resources/js/components/app-logo-icon.tsx'));

    expect($icon)->toContain('data-logo="placement"');
    expect($icon)->toContain('viewBox="0 0 24 24"');
});
