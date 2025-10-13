<?php

namespace App\Models;

// --- CHANGE: Import the MustVerifyEmail contract ---
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

// --- CHANGE: Implement the MustVerifyEmail contract in the class definition ---
class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be appended to the model's array form.
     *
     * @var array
     */
    protected $appends = [
        'full_name',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the user's full name.
     */
    protected function fullName(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->first_name . ' ' . $this->last_name,
        );
    }

    /**
     * The families that the user belongs to.
     * --- FIX: Explicitly define the pivot table name 'family_user'. ---
     */
    public function families(): BelongsToMany
    {
        return $this->belongsToMany(Family::class, 'family_user');
    }

    /**
     * The families that the user owns.
     */
    public function ownedFamilies(): HasMany
    {
        return $this->hasMany(Family::class, 'owner_id');
    }

    /**
     * The transactions created by the user.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * The goals created by the user.
     */
    public function goals(): HasMany
    {
        return $this->hasMany(Goal::class);
    }
}