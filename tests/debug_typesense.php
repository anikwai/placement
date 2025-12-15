<?php

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    $results = \App\Models\StudentPlacement::search('')->where('academic_year', 2026)->raw();
    echo "Success! Results:\n";
    print_r($results);
} catch (\Exception $e) {
    echo 'Error: '.$e->getMessage()."\n";
    echo $e->getTraceAsString();
}
