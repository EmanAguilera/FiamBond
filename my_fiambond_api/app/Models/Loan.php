<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Loan extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'family_id',
        'creditor_id',
        'debtor_id',
        'amount',
        'repaid_amount',
        'description',
    ];

    /**
     * Get the user who lent the money (the creditor).
     */
    public function creditor()
    {
        return $this->belongsTo(User::class, 'creditor_id');
    }

    /**
     * Get the user who borrowed the money (the debtor).
     */
    public function debtor()
    {
        return $this->belongsTo(User::class, 'debtor_id');
    }

    /**
     * Get the family this loan belongs to.
     */
    public function family()
    {
        return $this->belongsTo(Family::class);
    }
}