<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Goal extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'name',
        'target_amount',
        'consequence_note',
        // --- START OF FIX ---
        'family_id',      // Allows associating a goal with a family
        'target_date',    // Allows saving the optional target date
        'status',         // Allows updating the goal's status
        // --- END OF FIX ---
    ];

    /**
     * Get the user who owns the goal.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // --- START OF NEW METHOD ---
    /**
     * Get the family that this goal belongs to (if any).
     * This defines the relationship for family-specific goals.
     */
    public function family(): BelongsTo
    {
        return $this->belongsTo(Family::class);
    }
    // --- END OF NEW METHOD ---
}