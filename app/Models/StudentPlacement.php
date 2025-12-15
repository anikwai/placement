<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class StudentPlacement extends Model
{
    /** @use HasFactory<\Database\Factories\StudentPlacementFactory> */
    use HasFactory, Searchable;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'national_student_id',
        'feeder_school_name',
        'student_name',
        'gender',
        'year_7_placement_school_name',
        'academic_year',
    ];

    /**
     * Get the indexable data array for the model.
     *
     * @return array<string, mixed>
     */
    public function toSearchableArray(): array
    {
        return [
            'id' => (string) $this->id,
            'national_student_id' => $this->national_student_id,
            'student_name' => $this->student_name,
            'feeder_school_name' => $this->feeder_school_name,
            'gender' => $this->gender,
            'year_7_placement_school_name' => $this->year_7_placement_school_name,
            'academic_year' => $this->academic_year,
            'created_at' => $this->created_at->timestamp,
        ];
    }
}
