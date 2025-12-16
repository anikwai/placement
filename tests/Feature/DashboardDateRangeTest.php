<?php

use App\Models\StudentPlacement;
use App\Models\User;
use Carbon\CarbonImmutable;
use Inertia\Testing\AssertableInertia as Assert;

test('dashboard can be filtered by created_at date range', function () {
    $this->actingAs(User::factory()->create());

    StudentPlacement::factory()->create([
        'student_name' => 'In range',
        'national_student_id' => 'S000000001',
        'created_at' => CarbonImmutable::parse('2025-12-10 10:00:00'),
        'academic_year' => 2025,
    ]);

    StudentPlacement::factory()->create([
        'student_name' => 'Out of range',
        'national_student_id' => 'S000000002',
        'created_at' => CarbonImmutable::parse('2025-11-01 10:00:00'),
        'academic_year' => 2025,
    ]);

    $this->get(route('dashboard', [
        'from' => '2025-12-01',
        'to' => '2025-12-31',
        'academic_year' => 2025,
    ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('stats.totalStudents', 1)
            ->where('placementFilters.from', '2025-12-01')
            ->where('placementFilters.to', '2025-12-31')
            ->has('placements.data', 1)
            ->where('placements.data.0.student_name', 'In range')
        );
});
