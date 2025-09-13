<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Validation\Rule;

class TransactionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // E.g., paginate by 10 transactions per page.
    return $request->user()->transactions()->whereNull('family_id')->latest()->paginate(5);
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
            'family_id' => [
                'nullable',
                'integer',
                Rule::exists('families', 'id'),
                Rule::exists('family_user', 'family_id')->where('user_id', $user->id),
            ],
            'deduct_immediately' => 'nullable|boolean',
        ]);
        
        // --- START OF FIX: SMARTER GOAL CONFLICT LOGIC ---
        $activeGoal = null;
        // Only check for a conflict if the transaction is an expense and it's the first attempt.
        if ($fields['type'] === 'expense' && !$forceCreation) {
            $goalQuery = $user->goals()->where('status', 'active');

            if (isset($fields['family_id'])) {
                // This is a family expense. Look for a goal for this specific family.
                $goalQuery->where('family_id', $fields['family_id']);
            } else {
                // This is a personal expense. Look for a personal goal (where family_id is null).
                $goalQuery->whereNull('family_id');
            }
            
            $activeGoal = $goalQuery->first();
        }

        // Now, if our more specific query found a relevant goal, return the conflict.
        if ($activeGoal) {
            return response([
                'message' => 'This action conflicts with your goal.',
                'goal' => $activeGoal,
            ], 409);
        }
        // --- END OF FIX ---

        // This logic now only runs on the second attempt (after user acknowledges the conflict)
        if ($fields['type'] === 'expense' && $forceCreation) {
            // We need to re-find the goal here to update its consequence note
            $conflictingGoalQuery = $user->goals()->where('status', 'active');
             if (isset($fields['family_id'])) {
                $conflictingGoalQuery->where('family_id', $fields['family_id']);
            } else {
                $conflictingGoalQuery->whereNull('family_id');
            }
            $conflictingGoal = $conflictingGoalQuery->first();

            if ($conflictingGoal) {
                $date = Carbon::now()->toFormattedDateString();
                $newNote = "On {$date}, the integrity of this goal was compromised by an expense of {$fields['amount']}.";
                
                $conflictingGoal->update([
                    'consequence_note' => $conflictingGoal->consequence_note ? $conflictingGoal->consequence_note . "\n" . $newNote : $newNote
                ]);
            }
        }

        // Create the primary transaction
        $transaction = $user->transactions()->create($fields);

        // Logic for creating the balancing personal expense when contributing to a family
        if (
            $fields['type'] === 'income' &&
            isset($fields['family_id']) &&
            $request->input('deduct_immediately') === true
        ) {
            $user->transactions()->create([
                'description' => 'Contribution to family for: ' . $fields['description'],
                'amount'      => $fields['amount'],
                'type'        => 'expense',
                'family_id'   => null,
                'user_id'     => $user->id,
            ]);
        }

        return response($transaction, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Transaction $transaction)
    {
        return $transaction;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Transaction $transaction)
    {
        // Logic for updating can be added here
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Transaction $transaction)
    {
        $transaction->delete();
        return response(['message' => 'Transaction deleted successfully.']);
    }
}