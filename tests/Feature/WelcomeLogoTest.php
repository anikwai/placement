<?php

test('welcome page uses the shared app logo icon for branding', function () {
    $welcome = file_get_contents(base_path('resources/js/pages/welcome.tsx'));

    expect($welcome)->toContain("import AppLogoIcon from '@/components/app-logo-icon'");
    expect(substr_count($welcome, '<AppLogoIcon'))->toBeGreaterThanOrEqual(2);
    expect($welcome)->toContain('href={home()}');
});
