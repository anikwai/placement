<?php

use App\Models\StudentPlacement;
use App\Models\User;
use Carbon\CarbonImmutable;

test('authenticated users can download placements as csv', function () {
    $this->actingAs(User::factory()->create());

    StudentPlacement::factory()->create([
        'student_name' => 'Jane Doe',
        'national_student_id' => 'S000000010',
        'created_at' => CarbonImmutable::parse('2025-12-05 12:00:00'),
        'academic_year' => 2025,
    ]);

    StudentPlacement::factory()->create([
        'student_name' => 'Other Student',
        'national_student_id' => 'S000000011',
        'created_at' => CarbonImmutable::parse('2025-10-05 12:00:00'),
        'academic_year' => 2025,
    ]);

    $response = $this->get(route('placements.download', [
        'search' => 'Jane',
        'from' => '2025-12-01',
        'to' => '2025-12-31',
        'academic_year' => 2025,
    ]));

    $response->assertOk();
    $response->assertHeader('content-type', 'text/csv; charset=UTF-8');

    $csv = $response->streamedContent();

    expect($csv)->toContain('national_student_id,student_name,gender,feeder_school_name,year_7_placement_school_name,academic_year,created_at');
    expect($csv)->toContain('S000000010');
    expect($csv)->not->toContain('S000000011');
});
