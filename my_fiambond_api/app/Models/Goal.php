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
        'family_id',
        'target_date',
        'status',
        // --- ADD THESE LINES ---
        'completed_by_id', // Tracks who marked the goal as complete
        'completed_at',    // Tracks when the goal was completed
        // --- END OF ADDITION ---
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'completed_at' => 'datetime', // Automatically converts this to a Carbon instance
    ];

    /**
     * Get the user who created the goal.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the family that this goal belongs to (if any).
     */
    public function family(): BelongsTo
    {
        return $this->belongsTo(Family::class);
    }

    // --- ADD THIS ENTIRE METHOD ---
    /**
     * Get the user who completed the goal.
     */
    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by_id');
    }
    // --- END OF NEW METHOD ---
}