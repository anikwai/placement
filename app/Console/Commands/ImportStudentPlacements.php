<?php

namespace App\Console\Commands;

use App\Services\StudentPlacementImporter;
use Illuminate\Console\Command;

class ImportStudentPlacements extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'placements:import {file? : Path to the CSV file}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import student placements from a CSV file';

    /**
     * Execute the console command.
     */
    public function handle(StudentPlacementImporter $importer): int
    {
        $filePath = $this->argument('file') ?? public_path('data.csv');

        if (! file_exists($filePath)) {
            $this->error("File not found: {$filePath}");

            return self::FAILURE;
        }

        $this->info("Importing student placements from: {$filePath}");

        $totalRows = $importer->countRows($filePath);
        $progressBar = $this->output->createProgressBar($totalRows);
        $progressBar->start();

        try {
            $result = $importer
                ->onProgress(fn (int $processed) => $progressBar->setProgress($processed))
                ->import($filePath);

            $progressBar->finish();
            $this->newLine(2);

            $this->info('Import completed successfully!');
            $this->table(
                ['Metric', 'Count'],
                [
                    ['Imported', $result['imported']],
                    ['Skipped', $result['skipped']],
                ]
            );

            return self::SUCCESS;
        } catch (\Exception $e) {
            $progressBar->finish();
            $this->newLine();
            $this->error("Import failed: {$e->getMessage()}");

            return self::FAILURE;
        }
    }
}
