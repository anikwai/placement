<?php

use App\Models\StudentPlacement;
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

test('import command prevents duplicates on re-run', function () {
    // 1. Create Data
    $csvContent = "Teacher Name,Student Name,Gender,Placement School\n";
    $csvContent .= "Test Primary,John Doe,Male,Test High\n";

    $filePath = public_path('test_import_dedupe.csv');
    File::put($filePath, $csvContent);

    // 2. Run First Import
    $this->artisan('placements:import', ['file' => $filePath, '--year' => '2026'])
        ->assertSuccessful();

    $this->assertDatabaseCount('student_placements', 1);
    $firstRecord = StudentPlacement::first();
    $firstId = $firstRecord->national_student_id;

    // 3. Modify CSV (Simulate update or just re-run)
    // Same student, but maybe different casing or same data
    // The key is Feeder School|Student Name

    // 4. Run Second Import
    $this->artisan('placements:import', ['file' => $filePath, '--year' => '2026'])
        ->assertSuccessful();

    // 5. Assertions
    $this->assertDatabaseCount('student_placements', 1); // Count should still be 1

    $secondRecord = StudentPlacement::first();
    expect($secondRecord->national_student_id)->toBe($firstId); // ID should be preserved
    expect($secondRecord->id)->toBe($firstRecord->id);
});

test('import command handles updates correctly', function () {
    // 1. Create Data
    $csvContent = "Teacher Name,Student Name,Gender,Placement School\n";
    $csvContent .= "Test Primary,Jane Doe,Female,School A\n";

    $filePath = public_path('test_import_update.csv');
    File::put($filePath, $csvContent);

    // 2. First Import
    $this->artisan('placements:import', ['file' => $filePath, '--year' => '2026']);

    $this->assertDatabaseHas('student_placements', ['year_7_placement_school_name' => 'School A']);

    // 3. Update Data (Change placement school)
    $csvContentUpdated = "Teacher Name,Student Name,Gender,Placement School\n";
    $csvContentUpdated .= "Test Primary,Jane Doe,Female,School B\n";
    File::put($filePath, $csvContentUpdated);

    // 4. Second Import
    $this->artisan('placements:import', ['file' => $filePath, '--year' => '2026']);

    // 5. Assertions
    $this->assertDatabaseCount('student_placements', 1);
    $this->assertDatabaseHas('student_placements', ['year_7_placement_school_name' => 'School B']);
});
