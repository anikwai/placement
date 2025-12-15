<?php

use App\Models\StudentPlacement;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $this->get(route('placements.index'))->assertRedirect(route('login'));
});

test('authenticated users can visit placements index', function () {
    $this->actingAs(User::factory()->create());

    $this->get(route('placements.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('placements/index')
            ->has('placements')
            ->has('filters')
            ->has('stats')
        );
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

    $this->get(route('placements.index', ['search' => 'John']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('placements/index')
            ->has('placements.data', 1)
            ->where('placements.data.0.student_name', 'John Doe')
        );
});
