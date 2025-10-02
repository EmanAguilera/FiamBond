<?php

namespace App\Http\Controllers;

use App\Models\Family;
use App\Models\Loan;
// Make sure User model is imported
use App\Models\User; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class LoanController extends Controller
{
    /**
     * Display a listing of the loans for a specific family.
     */
    public function index(Request $request, Family $family)
    {
        // Authorization: Ensure the current user is a member of the family.
        if (!$family->members()->where('user_id', $request->user()->id)->exists()) {
            return response(['message' => 'You are not a member of this family.'], 403);
        }

        // --- START OF THE FIX ---
        // We remove the specific column selections from the `with` clause.
        // This makes the query more robust by loading the entire related objects,
        // which allows accessor attributes like `full_name` to work correctly.
        $loans = Loan::where('family_id', $family->id)
            ->with(['creditor', 'debtor']) // Simplified and more reliable
            ->latest()
            ->paginate(10);
        // --- END OF THE FIX ---

        return response($loans);
    }
    
    // ... all other methods (store, repay) remain the same ...

    /**
     * Store a new loan and create the corresponding double-entry transactions.
     * This entire operation is wrapped in a database transaction to ensure data integrity.
     */
    public function store(Request $request, Family $family)
    {
        $lender = $request->user();

        // Authorization: Ensure the lender is a member of the family.
        if (!$family->members()->where('user_id', $lender->id)->exists()) {
            return response(['message' => 'You must be a member of this family to lend money.'], 403);
        }

        $fields = $request->validate([
            'debtor_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id'),
                Rule::notIn([$lender->id]), // Cannot lend to yourself
                // Ensure the debtor is also a member of the family
                Rule::exists('family_user', 'user_id')->where('family_id', $family->id),
            ],
            'amount' => 'required|numeric|min:0.01',
            'description' => 'required|string|max:255',
        ]);

        $debtor = User::find($fields['debtor_id']);

        try {
            // Use a DB transaction to ensure all records are created or none are.
            $loan = DB::transaction(function () use ($family, $lender, $debtor, $fields) {
                // 1. Create the Loan record
                $loan = Loan::create([
                    'family_id'   => $family->id,
                    'creditor_id' => $lender->id,
                    'debtor_id'   => $debtor->id,
                    'amount'      => $fields['amount'],
                    'description' => $fields['description'],
                ]);

                // 2. Create the lender's expense transaction
                $lender->transactions()->create([
                    'description' => "Loan to {$debtor->full_name}: " . $fields['description'],
                    'amount'      => $fields['amount'],
                    'type'        => 'expense',
                    'family_id'   => $family->id,
                    'loan_id'     => $loan->id, // Link transaction to the loan
                ]);

                // 3. Create the borrower's income transaction
                $debtor->transactions()->create([
                    'description' => "Loan from {$lender->full_name}: " . $fields['description'],
                    'amount'      => $fields['amount'],
                    'type'        => 'income',
                    'family_id'   => $family->id,
                    'loan_id'     => $loan->id, // Link transaction to the loan
                ]);

                return $loan;
            });

            return response($loan->load(['creditor', 'debtor']), 201);

        } catch (\Exception $e) {
            // If anything goes wrong, the transaction will be rolled back.
            return response(['message' => 'Failed to record the loan due to a server error.'], 500);
        }
    }

    /**
     * Record a repayment for a loan.
     * This also creates corresponding transactions for the borrower and lender.
     */
    public function repay(Request $request, Loan $loan)
    {
        $borrower = $request->user();

        // Authorization: Only the original debtor can make a repayment.
        if ($borrower->id !== $loan->debtor_id) {
            return response(['message' => 'You are not authorized to repay this loan.'], 403);
        }

        $outstandingBalance = $loan->amount - $loan->repaid_amount;
        if ($outstandingBalance <= 0) {
            return response(['message' => 'This loan has already been fully repaid.'], 422);
        }

        $fields = $request->validate([
            'amount' => 'required|numeric|min:0.01|max:' . $outstandingBalance,
        ]);

        $lender = $loan->creditor;

        try {
            // Use a DB transaction for atomicity.
            DB::transaction(function () use ($loan, $borrower, $lender, $fields) {
                // 1. Update the loan's repaid amount
                $loan->increment('repaid_amount', $fields['amount']);

                // 2. Create the borrower's expense transaction for the repayment
                $borrower->transactions()->create([
                    'description' => "Repayment to {$lender->full_name} for: " . $loan->description,
                    'amount'      => $fields['amount'],
                    'type'        => 'expense',
                    'family_id'   => $loan->family_id,
                    'loan_id'     => $loan->id,
                ]);

                // 3. Create the lender's income transaction for the repayment
                $lender->transactions()->create([
                    'description' => "Repayment from {$borrower->full_name} for: " . $loan->description,
                    'amount'      => $fields['amount'],
                    'type'        => 'income',
                    'family_id'   => $loan->family_id,
                    'loan_id'     => $loan->id,
                ]);
            });

            return response(['message' => 'Repayment successful.', 'loan' => $loan->fresh()]);

        } catch (\Exception $e) {
            return response(['message' => 'Failed to process repayment due to a server error.'], 500);
        }
    }
}