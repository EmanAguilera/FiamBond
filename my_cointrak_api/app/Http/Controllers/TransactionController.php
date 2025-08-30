<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Return only the transactions belonging to the authenticated user
        return $request->user()->transactions()->latest()->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // The 'force_creation' flag will be sent by the frontend after the user makes a choice.
        $forceCreation = $request->input('force_creation', false);

        $fields = $request->validate([
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01',
            'type' => 'required|in:income,expense'
        ]);
        
        $user = $request->user();
        $activeGoal = $user->goals()->first(); // Check for any active goal

        // The "Coin Toss" logic
        if ($fields['type'] === 'expense' && $activeGoal && !$forceCreation) {
            return response([
                'message' => 'This action conflicts with your goal.',
                'goal' => $activeGoal,
            ], 409); // 409 Conflict
        }

        // If the choice was made to proceed, add the consequence note to the goal.
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

    // You can leave the other methods empty for now
    public function show(Transaction $transaction) {}
    public function update(Request $request, Transaction $transaction) {}
    public function destroy(Transaction $transaction) {}
}