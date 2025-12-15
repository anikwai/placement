<?php

namespace App\Http\Controllers;

use App\Models\StudentPlacement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentPlacementController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search', '');
        $perPage = $request->input('per_page', 25);

        $query = StudentPlacement::query();

        if ($search) {
            $query = StudentPlacement::search($search);
        }

        $placements = $query->paginate($perPage)->withQueryString();

        $filters = StudentPlacement::query()
            ->selectRaw('
                COUNT(DISTINCT feeder_school_name) as feeder_schools_count,
                COUNT(DISTINCT year_7_placement_school_name) as placement_schools_count
            ')
            ->first();

        return Inertia::render('placements/index', [
            'placements' => $placements,
            'filters' => [
                'search' => $search,
                'per_page' => (int) $perPage,
            ],
            'stats' => [
                'total_students' => StudentPlacement::count(),
                'feeder_schools' => $filters->feeder_schools_count,
                'placement_schools' => $filters->placement_schools_count,
            ],
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $search = $request->input('q', '');

        if (strlen($search) < 2) {
            return response()->json(['data' => []]);
        }

        $results = StudentPlacement::search($search)
            ->take(50)
            ->get()
            ->map(fn (StudentPlacement $placement) => [
                'id' => $placement->id,
                'national_student_id' => $placement->national_student_id,
                'student_name' => $placement->student_name,
                'gender' => $placement->gender,
                'feeder_school_name' => $placement->feeder_school_name,
                'year_7_placement_school_name' => $placement->year_7_placement_school_name,
            ]);

        return response()->json(['data' => $results]);
    }
}
