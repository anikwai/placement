<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('student_placements', function (Blueprint $table) {
            $table->string('national_student_id', 10)->change();
        });

        $driver = DB::connection()->getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE student_placements ADD CONSTRAINT national_student_id_format CHECK (national_student_id ~ '^S[0-9]{9}$')");
        } elseif ($driver === 'sqlite') {
            // SQLite doesn't support ALTER TABLE ADD CONSTRAINT, so we skip this for testing
            // The format validation is handled at the application level
        } elseif ($driver === 'mysql') {
            DB::statement("ALTER TABLE student_placements ADD CONSTRAINT national_student_id_format CHECK (national_student_id REGEXP '^S[0-9]{9}$')");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver !== 'sqlite') {
            DB::statement('ALTER TABLE student_placements DROP CONSTRAINT national_student_id_format');
        }

        Schema::table('student_placements', function (Blueprint $table) {
            $table->string('national_student_id')->change();
        });
    }
};
