<?php

use Illuminate\Support\Facades\File;

afterEach(function () {
    // Clean up
    $files = glob(public_path('test_import_*.csv'));
    foreach ($files as $file) {
        if (File::exists($file)) {
            File::delete($file);
        }
    }
});

test('import command requires year option', function () {
    $this->artisan('placements:import')
        ->expectsOutput('The --year option is required.')
        ->assertFailed();
});

test('import command imports placements with correct academic year', function () {
    // Create a dummy CSV file
    $csvContent = "Teacher Name,Student Name,Gender,Placement School\n";
    $csvContent .= "Test Primary,John Doe,Male,Test High\n";
    $csvContent .= "Test Primary,Jane Smith,Female,Test High\n";

    $filePath = public_path('test_import_valid.csv');
    File::put($filePath, $csvContent);

    $this->artisan('placements:import', ['file' => $filePath, '--year' => '2026'])
        ->expectsOutput("Importing student placements for academic year 2026 from: {$filePath}")
        ->assertSuccessful();

    $this->assertDatabaseHas('student_placements', [
        'student_name' => 'John Doe',
        'academic_year' => 2026,
    ]);

    $this->assertDatabaseHas('student_placements', [
        'student_name' => 'Jane Smith',
        'academic_year' => 2026,
    ]);
});
