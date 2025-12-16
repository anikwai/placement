<?php

use App\Models\StudentPlacement;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $this->get(route('placements.index'))->assertRedirect(route('login'));
});

test('authenticated users visiting placements are redirected to the dashboard', function () {
    $this->actingAs(User::factory()->create());

    $this->get(route('placements.index'))->assertRedirect(route('dashboard'));
});

test('placements can be searched', function () {
    $this->actingAs(User::factory()->create());

    StudentPlacement::factory()->create([
        'student_name' => 'John Doe',
        'national_student_id' => 'S123456789',
        'feeder_school_name' => 'Alpha Primary',
        'year_7_placement_school_name' => 'Beta Secondary',
    ]);

    StudentPlacement::factory()->create([
        'student_name' => 'Jane Smith',
        'national_student_id' => 'S987654321',
        'feeder_school_name' => 'Gamma Primary',
        'year_7_placement_school_name' => 'Delta Secondary',
    ]);

    $this->get(route('dashboard', ['search' => 'John']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('placements.data', 1)
            ->where('placements.data.0.student_name', 'John Doe')
            ->where('placementFilters.search', 'John')
        );
});

test('placements search api returns matching results', function () {
    StudentPlacement::factory()->create([
        'student_name' => 'John Doe',
        'national_student_id' => 'S123456789',
        'feeder_school_name' => 'Alpha Primary',
        'year_7_placement_school_name' => 'Beta Secondary',
    ]);

    StudentPlacement::factory()->create([
        'student_name' => 'Jane Smith',
        'national_student_id' => 'S987654321',
        'feeder_school_name' => 'Gamma Primary',
        'year_7_placement_school_name' => 'Delta Secondary',
    ]);

    $this->getJson(route('placements.search', ['q' => 'John']))
        ->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.student_name', 'John Doe')
        ->assertJsonPath('data.0.national_student_id', 'S123456789');
});
