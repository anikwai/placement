<?php

namespace App\Http\Controllers;

use App\Models\StudentPlacement;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StudentPlacementDownloadController extends Controller
{
    public function __invoke(Request $request): StreamedResponse
    {
        $search = trim((string) $request->input('search', ''));
        $academicYear = (string) $request->input('academic_year', '');
        $from = $this->parseDate((string) $request->input('from', ''));
        $to = $this->parseDate((string) $request->input('to', ''));

        $query = StudentPlacement::query();

        if ($academicYear !== '') {
            $query->where('academic_year', (int) $academicYear);
        }

        if (! is_null($from)) {
            $query->where('created_at', '>=', $from->startOfDay());
        }

        if (! is_null($to)) {
            $query->where('created_at', '<=', $to->endOfDay());
        }

        if ($search !== '') {
            $escapedSearch = str_replace(['\\', '%', '_'], ['\\\\', '\%', '\_'], $search);
            $like = '%'.$escapedSearch.'%';
            $likeOperator = $query->getConnection()->getDriverName() === 'pgsql' ? 'ILIKE' : 'LIKE';

            $query->where(function ($subQuery) use ($like, $likeOperator) {
                $subQuery
                    ->where('student_name', $likeOperator, $like)
                    ->orWhere('national_student_id', $likeOperator, $like)
                    ->orWhere('feeder_school_name', $likeOperator, $like)
                    ->orWhere('year_7_placement_school_name', $likeOperator, $like);
            });
        }

        $fileNameParts = ['placements'];

        if (! is_null($from) && ! is_null($to)) {
            $fileNameParts[] = $from->format('Y-m-d');
            $fileNameParts[] = $to->format('Y-m-d');
        }

        $fileName = implode('_', $fileNameParts).'.csv';

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'wb');

            if ($handle === false) {
                return;
            }

            fputcsv($handle, [
                'national_student_id',
                'student_name',
                'gender',
                'feeder_school_name',
                'year_7_placement_school_name',
                'academic_year',
                'created_at',
            ]);

            $query
                ->orderBy('id')
                ->cursor()
                ->each(function (StudentPlacement $placement) use ($handle) {
                    fputcsv($handle, [
                        $placement->national_student_id,
                        $placement->student_name,
                        $placement->gender,
                        $placement->feeder_school_name,
                        $placement->year_7_placement_school_name,
                        $placement->academic_year,
                        $placement->created_at?->toIso8601String(),
                    ]);
                });

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function parseDate(string $value): ?CarbonImmutable
    {
        $value = trim($value);

        if ($value === '') {
            return null;
        }

        $date = CarbonImmutable::createFromFormat('Y-m-d', $value);

        if ($date === false) {
            return null;
        }

        return $date;
    }
}
