<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Validation\Rule; // <-- Add this import

class TransactionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // --- MODIFICATION ---
        // This now only returns PERSONAL transactions (where family_id is null)
        return $request->user()->transactions()->whereNull('family_id')->latest()->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $forceCreation = $request->input('force_creation', false);

        $fields = $request->validate([
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01',
            'type' => 'required|in:income,expense',
            // --- START OF FIX ---
            // Add validation for family_id. It's optional ('nullable').
            // It must be a valid ID from the families table.
            // We also check that the user is actually a member of the selected family for security.
            'family_id' => [
                'nullable',
                'integer',
                Rule::exists('families', 'id'),
                Rule::exists('family_user', 'family_id')->where('user_id', $user->id),
            ]
            // --- END OF FIX ---
        ]);
        
        $activeGoal = $user->goals()->first();

        if ($fields['type'] === 'expense' && $activeGoal && !$forceCreation) {
            return response([
                'message' => 'This action conflicts with your goal.',
                'goal' => $activeGoal,
            ], 409);
        }

        if ($fields['type'] === 'expense' && $activeGoal && $forceCreation) {
            $date = Carbon::now()->toFormattedDateString();
            $newNote = "On {$date}, the integrity of this goal was compromised by an expense of {$fields['amount']}.";
            
            $activeGoal->update([
                'consequence_note' => $activeGoal->consequence_note ? $activeGoal->consequence_note . "\n" . $newNote : $newNote
            ]);
        }

        $transaction = $user->transactions()->create($fields);
        return response($transaction, 201);
    }

    // Other methods remain unchanged
    public function show(Transaction $transaction) {}
    public function update(Request $request, Transaction $transaction) {}
    public function destroy(Transaction $transaction) {}
}