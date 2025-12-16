<?php

test('dashboard page does not force dark mode on its root container', function () {
    $contents = file_get_contents(base_path('resources/js/pages/dashboard.tsx'));

    expect($contents)->not->toContain('className="dark');
});
