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

    $this->get(route('dashboard', ['academic_year' => 2026]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('placementFilters.academic_year', '2026')
            ->missing('placements')
            ->loadDeferredProps('dashboard', fn (Assert $reload) => $reload
                ->has('placements.data', 1)
                ->where('placements.data.0.student_name', 'Student 2026')
            )
        );
});

test('placements index includes available academic years', function () {
    $this->actingAs(User::factory()->create());

    StudentPlacement::factory()->create(['academic_year' => 2024]);
    StudentPlacement::factory()->create(['academic_year' => 2025]);
    StudentPlacement::factory()->create(['academic_year' => 2026]);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('academicYears', 3)
            ->where('academicYears.0', 2026) // Ordered desc
            ->where('academicYears.1', 2025)
            ->where('academicYears.2', 2024)
        );
});
