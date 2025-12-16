<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\StudentPlacementController;
use App\Http\Controllers\StudentPlacementDownloadController;
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
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::get('placements', function () {
        return redirect()->route('dashboard', request()->query());
    })->name('placements.index');

    Route::get('placements/download', StudentPlacementDownloadController::class)->name('placements.download');
});

require __DIR__.'/settings.php';
