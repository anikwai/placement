<?php

namespace App\Http\Controllers;

use App\Models\StudentPlacement;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $search = (string) $request->input('search', '');
        $perPage = (int) $request->input('per_page', 25);
        $academicYear = (string) $request->input('academic_year', '');
        $from = $this->parseDate((string) $request->input('from', ''));
        $to = $this->parseDate((string) $request->input('to', ''));
        $academicYearValue = $academicYear !== '' ? (int) $academicYear : null;

        $statsCache = null;
        $resolveStats = function () use (&$statsCache, $academicYearValue, $from, $to) {
            if (! is_null($statsCache)) {
                return $statsCache;
            }

            $filteredBaseQuery = StudentPlacement::query();

            if (! is_null($academicYearValue)) {
                $filteredBaseQuery->where('academic_year', $academicYearValue);
            }

            $this->applyDateRangeFilter($filteredBaseQuery, $from, $to);

            $statsCache = (clone $filteredBaseQuery)
                ->selectRaw('
                    COUNT(*) as total_students,
                    COUNT(DISTINCT feeder_school_name) as feeder_schools,
                    COUNT(DISTINCT year_7_placement_school_name) as placement_schools,
                    SUM(CASE WHEN gender = \'M\' THEN 1 ELSE 0 END) as male_count,
                    SUM(CASE WHEN gender = \'F\' THEN 1 ELSE 0 END) as female_count
                ')
                ->first();

            return $statsCache;
        };

        $boundsQuery = StudentPlacement::query();

        if (! is_null($academicYearValue)) {
            $boundsQuery->where('academic_year', $academicYearValue);
        }

        $dateBounds = $boundsQuery
            ->selectRaw('MIN(created_at) as min_created_at, MAX(created_at) as max_created_at')
            ->first();

        $minCreatedAt = $dateBounds?->min_created_at ? CarbonImmutable::parse($dateBounds->min_created_at)->startOfDay() : null;
        $maxCreatedAt = $dateBounds?->max_created_at ? CarbonImmutable::parse($dateBounds->max_created_at)->endOfDay() : null;

        if ($search !== '') {
            $placementsQuery = function () use ($search, $perPage, $academicYearValue, $from, $to) {
                $query = StudentPlacement::search($search);

                if (! is_null($academicYearValue)) {
                    $query->where('academic_year', $academicYearValue);
                }

                if ($this->hasDateRange($from, $to)) {
                    $query->where('created_at', $this->typesenseCreatedAtFilter($from, $to));
                }

                return $query->paginate($perPage)->withQueryString();
            };
        } else {
            $placementsQuery = function () use ($perPage, $academicYearValue, $from, $to) {
                $query = StudentPlacement::query();

                if (! is_null($academicYearValue)) {
                    $query->where('academic_year', $academicYearValue);
                }

                $this->applyDateRangeFilter($query, $from, $to);

                return $query->paginate($perPage)->withQueryString();
            };
        }

        $topFeederSchoolsQuery = function () use ($academicYearValue, $from, $to) {
            $filteredBaseQuery = StudentPlacement::query();

            if (! is_null($academicYearValue)) {
                $filteredBaseQuery->where('academic_year', $academicYearValue);
            }

            $this->applyDateRangeFilter($filteredBaseQuery, $from, $to);

            return (clone $filteredBaseQuery)
                ->selectRaw('feeder_school_name, COUNT(*) as student_count')
                ->groupBy('feeder_school_name')
                ->orderByDesc('student_count')
                ->limit(5)
                ->get();
        };

        $topPlacementSchoolsQuery = function () use ($academicYearValue, $from, $to) {
            $filteredBaseQuery = StudentPlacement::query();

            if (! is_null($academicYearValue)) {
                $filteredBaseQuery->where('academic_year', $academicYearValue);
            }

            $this->applyDateRangeFilter($filteredBaseQuery, $from, $to);

            return (clone $filteredBaseQuery)
                ->selectRaw('year_7_placement_school_name, COUNT(*) as student_count')
                ->groupBy('year_7_placement_school_name')
                ->orderByDesc('student_count')
                ->limit(5)
                ->get();
        };

        $academicYears = StudentPlacement::query()
            ->distinct()
            ->orderByDesc('academic_year')
            ->pluck('academic_year')
            ->filter()
            ->values();

        return Inertia::render('dashboard', [
            'stats' => Inertia::defer(function () use ($resolveStats) {
                $stats = $resolveStats();

                return [
                    'totalStudents' => (int) $stats->total_students,
                    'feederSchools' => (int) $stats->feeder_schools,
                    'placementSchools' => (int) $stats->placement_schools,
                    'maleCount' => (int) $stats->male_count,
                    'femaleCount' => (int) $stats->female_count,
                ];
            }, 'dashboard'),
            'topFeederSchools' => Inertia::defer($topFeederSchoolsQuery, 'dashboard'),
            'topPlacementSchools' => Inertia::defer($topPlacementSchoolsQuery, 'dashboard'),
            'placements' => Inertia::defer($placementsQuery, 'dashboard'),
            'placementFilters' => [
                'search' => $search,
                'per_page' => $perPage,
                'academic_year' => $academicYear,
                'from' => $from?->format('Y-m-d') ?? '',
                'to' => $to?->format('Y-m-d') ?? '',
            ],
            'placementStats' => Inertia::defer(function () use ($resolveStats) {
                $stats = $resolveStats();

                return [
                    'total_students' => (int) $stats->total_students,
                    'feeder_schools' => (int) $stats->feeder_schools,
                    'placement_schools' => (int) $stats->placement_schools,
                ];
            }, 'dashboard'),
            'academicYears' => $academicYears,
            'dateRangeBounds' => [
                'from' => $minCreatedAt?->format('Y-m-d') ?? null,
                'to' => $maxCreatedAt?->format('Y-m-d') ?? null,
            ],
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

    private function hasDateRange(?CarbonImmutable $from, ?CarbonImmutable $to): bool
    {
        return ! is_null($from) || ! is_null($to);
    }

    /**
     * @return array<int, int|string>
     */
    private function typesenseCreatedAtFilter(?CarbonImmutable $from, ?CarbonImmutable $to): array
    {
        $clauses = [];

        if (! is_null($from)) {
            $clauses[] = '>=';
            $clauses[] = $from->startOfDay()->timestamp;
        }

        if (! is_null($to)) {
            if (! empty($clauses)) {
                $clauses[] = ' && created_at:<=';
            } else {
                $clauses[] = '<=';
            }

            $clauses[] = $to->endOfDay()->timestamp;
        }

        return $clauses;
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<\App\Models\StudentPlacement>  $query
     */
    private function applyDateRangeFilter($query, ?CarbonImmutable $from, ?CarbonImmutable $to): void
    {
        if (! is_null($from)) {
            $query->where('created_at', '>=', $from->startOfDay());
        }

        if (! is_null($to)) {
            $query->where('created_at', '<=', $to->endOfDay());
        }
    }
}
