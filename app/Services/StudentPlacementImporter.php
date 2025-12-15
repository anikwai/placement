<?php

namespace App\Services;

use App\Models\StudentPlacement;
use Closure;
use Illuminate\Support\LazyCollection;

class StudentPlacementImporter
{
    private const CHUNK_SIZE = 500;

    private int $importedCount = 0;

    private int $skippedCount = 0;

    private int $nextIdNumber = 1;

    private ?Closure $progressCallback = null;

    /**
     * Set a callback to report progress.
     */
    public function onProgress(Closure $callback): self
    {
        $this->progressCallback = $callback;

        return $this;
    }

    /**
     * Count total rows in the CSV file (excluding header).
     */
    public function countRows(string $filePath): int
    {
        $handle = fopen($filePath, 'r');
        if ($handle === false) {
            return 0;
        }

        $count = 0;
        fgetcsv($handle); // Skip header

        while (fgetcsv($handle) !== false) {
            $count++;
        }

        fclose($handle);

        return $count;
    }

    /**
     * Import student placements from a CSV file using chunked bulk insert.
     *
     * @return array{imported: int, skipped: int}
     */
    public function import(string $filePath, int $year): array
    {
        if (! file_exists($filePath)) {
            throw new \InvalidArgumentException("File not found: {$filePath}");
        }

        $this->initializeNextIdNumber();

        $this->readCsv($filePath)
            ->chunk(self::CHUNK_SIZE)

            ->each(function (LazyCollection $chunk) use ($year) {
                $rows = $chunk->all();

                // Build mapping of existing records to check for duplicates
                // Key: feeder_school_name|student_name
                $names = collect($rows)->map(fn ($row) => $row[1] ?? null)->filter()->map(fn ($n) => trim($n));
                
                $existingRecords = StudentPlacement::query()
                    ->where('academic_year', $year)
                    ->whereIn('student_name', $names)
                    ->get()
                    ->keyBy(fn ($item) => $item->feeder_school_name . '|' . $item->student_name);

                $records = [];

                foreach ($rows as $row) {
                    if (count($row) < 2) continue;
                    
                    $key = trim($row[0]) . '|' . trim($row[1]);
                    $existingId = $existingRecords[$key]->national_student_id ?? null;

                    $record = $this->prepareRecord($row, $year, $existingId);

                    if ($record === null) {
                        $this->skippedCount++;

                        continue;
                    }

                    $records[] = $record;
                    $this->importedCount++;
                }

                if (! empty($records)) {
                    StudentPlacement::upsert(
                        $records,
                        ['national_student_id'],
                        ['feeder_school_name', 'student_name', 'gender', 'year_7_placement_school_name', 'academic_year']
                    );
                }

                if ($this->progressCallback) {
                    ($this->progressCallback)($this->importedCount + $this->skippedCount);
                }
            });

        return [
            'imported' => $this->importedCount,
            'skipped' => $this->skippedCount,
        ];
    }

    /**
     * Read CSV file as a lazy collection.
     *
     * @return LazyCollection<int, array<int, string>>
     */
    private function readCsv(string $filePath): LazyCollection
    {
        return LazyCollection::make(function () use ($filePath) {
            $handle = fopen($filePath, 'r');
            if ($handle === false) {
                return;
            }

            try {
                fgetcsv($handle); // Skip header

                while (($row = fgetcsv($handle)) !== false) {
                    yield $row;
                }
            } finally {
                fclose($handle);
            }
        });
    }

    /**
     * Prepare a record for bulk insert.
     *
     * @param  array<int, string>  $row
     * @return array<string, string>|null
     */
    private function prepareRecord(array $row, int $year, ?string $existingId = null): ?array
    {
        if (count($row) < 4) {
            return null;
        }

        [$feederSchool, $studentName, $gender, $placementSchool] = $row;

        if (empty(trim($studentName))) {
            return null;
        }

        $now = now();

        return [
            'national_student_id' => $existingId ?? $this->generateNationalStudentId(),
            'feeder_school_name' => trim($feederSchool),
            'student_name' => trim($studentName),
            'gender' => trim($gender),
            'year_7_placement_school_name' => trim($placementSchool),
            'academic_year' => $year,
            'created_at' => $now,
            'updated_at' => $now,
        ];
    }

    /**
     * Generate the next national student ID in format S000000001.
     */
    private function generateNationalStudentId(): string
    {
        $id = 'S'.str_pad((string) $this->nextIdNumber, 9, '0', STR_PAD_LEFT);
        $this->nextIdNumber++;

        return $id;
    }

    /**
     * Initialize the next ID number based on existing records.
     */
    private function initializeNextIdNumber(): void
    {
        $lastPlacement = StudentPlacement::query()
            ->orderByDesc('national_student_id')
            ->first();

        if ($lastPlacement) {
            $lastNumber = (int) substr($lastPlacement->national_student_id, 1);
            $this->nextIdNumber = $lastNumber + 1;
        }
    }
}
