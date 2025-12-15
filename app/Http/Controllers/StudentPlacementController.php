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
        $academicYear = $request->input('academic_year');

        if ($search) {
            $query = StudentPlacement::search($search);

            if ($academicYear) {
                $query->where('academic_year', (int) $academicYear);
            }
        } else {
            $query = StudentPlacement::query();

            if ($academicYear) {
                $query->where('academic_year', $academicYear);
            }
        }

        $placements = $query->paginate($perPage)->withQueryString();

        $filters = StudentPlacement::query()
            ->selectRaw('
                COUNT(DISTINCT feeder_school_name) as feeder_schools_count,
                COUNT(DISTINCT year_7_placement_school_name) as placement_schools_count
            ')
            ->first();

        $academicYears = StudentPlacement::query()
            ->distinct()
            ->orderByDesc('academic_year')
            ->pluck('academic_year')
            ->filter()
            ->values();

        return Inertia::render('placements/index', [
            'placements' => $placements,
            'filters' => [
                'search' => $search,
                'per_page' => (int) $perPage,
                'academic_year' => $academicYear,
            ],
            'stats' => [
                'total_students' => StudentPlacement::count(),
                'feeder_schools' => $filters->feeder_schools_count,
                'placement_schools' => $filters->placement_schools_count,
            ],
            'academic_years' => $academicYears,
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $search = $request->input('q', '');

        if (strlen($search) < 2) {
            return response()->json(['data' => []]);
        }

        $results = StudentPlacement::search($search)
            ->paginate(9)
            ->through(fn (StudentPlacement $placement) => [
                'id' => $placement->id,
                'national_student_id' => $placement->national_student_id,
                'student_name' => $placement->student_name,
                'gender' => $placement->gender,
                'feeder_school_name' => $placement->feeder_school_name,
                'year_7_placement_school_name' => $placement->year_7_placement_school_name,
            ]);

        return response()->json($results);
    }
}
