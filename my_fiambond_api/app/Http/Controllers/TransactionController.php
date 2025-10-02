<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Family; // Make sure the Family model is imported
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;

class TransactionController extends Controller
{
    /**
     * Display a listing of the PERSONAL resource.
     */
    public function index(Request $request)
    {
        // This method is for PERSONAL transactions only.
        return $request->user()->transactions()->whereNull('family_id')->latest()->paginate(10);
    }

    /**
     * Display a paginated listing of transactions for a specific family.
     */
    public function indexForFamily(Request $request, Family $family)
    {
        // 1. Authorization: Ensure the user is a member of this family.
        if (!$family->members()->where('user_id', $request->user()->id)->exists()) {
            return response(['message' => 'Unauthorized'], 403);
        }

        // --- START OF THE FIX ---
        // We change `with('user:id,full_name')` to `with('user')`.
        // This loads the full user object, allowing the 'full_name' accessor
        // from the User model to be appended correctly in the JSON response.
        return $family->transactions()->with('user')->latest()->paginate(10);
        // --- END OF THE FIX ---
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
            'attachment' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ]);

        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('attachments', 's3');
            $fields['attachment_path'] = $path;
        }

        $activeGoal = null;
        if ($fields['type'] === 'expense' && !$forceCreation) {
            $goalQuery = $user->goals()->where('status', 'active');
            if (isset($fields['family_id'])) {
                $goalQuery->where('family_id', $fields['family_id']);
            } else {
                $goalQuery->whereNull('family_id');
            }
            $activeGoal = $goalQuery->first();
        }

        if ($activeGoal) {
            return response([
                'message' => 'This action conflicts with your goal.',
                'goal' => $activeGoal,
            ], 409);
        }

        if ($fields['type'] === 'expense' && $forceCreation) {
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

        $transaction = $user->transactions()->create($fields);

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
     * Remove the specified resource from storage.
     */
    public function destroy(Transaction $transaction)
    {
        $transaction->delete();
        return response(['message' => 'Transaction deleted successfully.']);
    }
}