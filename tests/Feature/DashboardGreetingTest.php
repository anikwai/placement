<?php

test('dashboard greets the authenticated user', function () {
    $contents = file_get_contents(base_path('resources/js/pages/dashboard.tsx'));

    expect($contents)->toContain('usePage<SharedData>()');
    expect($contents)->toContain('auth.user.name');
    expect($contents)->toContain('Good morning');
});
