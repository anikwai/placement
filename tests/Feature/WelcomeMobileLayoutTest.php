<?php

test('welcome page header stays readable on small screens', function () {
    $welcome = file_get_contents(base_path('resources/js/pages/welcome.tsx'));

    expect($welcome)->toContain('px-4 sm:px-6');
    expect($welcome)->toContain('whitespace-nowrap');
    expect($welcome)->toContain('hidden h-4 w-px bg-border sm:block');
});
