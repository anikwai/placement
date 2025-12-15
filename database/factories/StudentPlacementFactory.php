<?php

namespace Database\Factories;

use App\Models\StudentPlacement;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\StudentPlacement>
 */
class StudentPlacementFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\App\Models\StudentPlacement>
     */
    protected $model = StudentPlacement::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'national_student_id' => fake()->unique()->numerify('S#########'),
            'feeder_school_name' => fake()->company().' Primary',
            'student_name' => fake()->name(),
            'gender' => fake()->randomElement(['M', 'F']),
            'year_7_placement_school_name' => fake()->company().' Secondary',
        ];
    }
}
