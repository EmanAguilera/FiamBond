<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Family extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'owner_id',
    ];

    /**
     * The user who owns the family.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * The members of the family.
     * --- FIX: Explicitly define the pivot table name 'family_user'. ---
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'family_user');
    }

    /**
     * The transactions associated with the family.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }
}