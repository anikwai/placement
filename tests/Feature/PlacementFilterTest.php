<?php

use App\Models\StudentPlacement;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('placements can be filtered by academic year', function () {
    $this->actingAs(User::factory()->create());

    StudentPlacement::factory()->create([
        'student_name' => 'Student 2025',
        'academic_year' => 2025,
    ]);

    StudentPlacement::factory()->create([
        'student_name' => 'Student 2026',
        'academic_year' => 2026,
    ]);

    $this->get(route('placements.index', ['academic_year' => 2026]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('placements/index')
            ->has('placements.data', 1)
            ->where('placements.data.0.student_name', 'Student 2026')
            ->where('filters.academic_year', '2026')
        );
});

test('placements index includes available academic years', function () {
    $this->actingAs(User::factory()->create());

    StudentPlacement::factory()->create(['academic_year' => 2024]);
    StudentPlacement::factory()->create(['academic_year' => 2025]);
    StudentPlacement::factory()->create(['academic_year' => 2026]);

    $this->get(route('placements.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('placements/index')
            ->has('academic_years', 3)
            ->where('academic_years.0', 2026) // Ordered desc
            ->where('academic_years.1', 2025)
            ->where('academic_years.2', 2024)
        );
});
