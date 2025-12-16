<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $this->actingAs($user = User::factory()->create());

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('ui.logoText', 'Placement')
            ->has('stats')
            ->has('topFeederSchools')
            ->has('topPlacementSchools')
            ->has('placements')
            ->has('placementFilters')
            ->where('placementFilters.from', '')
            ->where('placementFilters.to', '')
            ->has('placementStats')
            ->has('academicYears')
            ->has('dateRangeBounds')
        );
});
