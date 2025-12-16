<?php

namespace App\Http\Controllers;

use App\Models\StudentPlacement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class StudentPlacementController extends Controller
{
    public function index(Request $request): RedirectResponse
    {
        return redirect()->route('dashboard', $request->query());
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
