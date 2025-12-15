<?php

use App\Http\Controllers\StudentPlacementController;
use App\Models\StudentPlacement;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    $stats = StudentPlacement::query()
        ->selectRaw('
            COUNT(*) as total_students,
            COUNT(DISTINCT feeder_school_name) as feeder_schools,
            COUNT(DISTINCT year_7_placement_school_name) as placement_schools
        ')
        ->first();

    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
        'stats' => [
            'totalStudents' => $stats->total_students,
            'feederSchools' => $stats->feeder_schools,
            'placementSchools' => $stats->placement_schools,
        ],
    ]);
})->name('home');

Route::get('/api/placements/search', [StudentPlacementController::class, 'search'])->name('placements.search');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $stats = StudentPlacement::query()
            ->selectRaw('
                COUNT(*) as total_students,
                COUNT(DISTINCT feeder_school_name) as feeder_schools,
                COUNT(DISTINCT year_7_placement_school_name) as placement_schools,
                SUM(CASE WHEN gender = \'M\' THEN 1 ELSE 0 END) as male_count,
                SUM(CASE WHEN gender = \'F\' THEN 1 ELSE 0 END) as female_count
            ')
            ->first();

        $topFeederSchools = StudentPlacement::query()
            ->selectRaw('feeder_school_name, COUNT(*) as student_count')
            ->groupBy('feeder_school_name')
            ->orderByDesc('student_count')
            ->limit(5)
            ->get();

        $topPlacementSchools = StudentPlacement::query()
            ->selectRaw('year_7_placement_school_name, COUNT(*) as student_count')
            ->groupBy('year_7_placement_school_name')
            ->orderByDesc('student_count')
            ->limit(5)
            ->get();

        $samplePlacements = StudentPlacement::query()
            ->inRandomOrder()
            ->limit(10)
            ->get();

        return Inertia::render('dashboard', [
            'stats' => [
                'totalStudents' => (int) $stats->total_students,
                'feederSchools' => (int) $stats->feeder_schools,
                'placementSchools' => (int) $stats->placement_schools,
                'maleCount' => (int) $stats->male_count,
                'femaleCount' => (int) $stats->female_count,
            ],
            'topFeederSchools' => $topFeederSchools,
            'topPlacementSchools' => $topPlacementSchools,
            'samplePlacements' => $samplePlacements,
        ]);
    })->name('dashboard');

    Route::get('placements', [StudentPlacementController::class, 'index'])->name('placements.index');
});

require __DIR__.'/settings.php';
