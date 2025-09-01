<?php

namespace App\Http\Controllers;

use App\Models\Family;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Carbon;

class FamilyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Return all families the current user is a member of
        return $request->user()->families()->with('owner')->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $fields = $request->validate([
            'first_name' => 'required|string|max:255'
        ]);

        // Create the family and set the current user as the owner
        $family = Family::create([
            'first_name' => $fields['first_name'],
            'owner_id' => $request->user()->id,
        ]);

        // IMPORTANT: Attach the owner as the first member of the family
        $family->members()->attach($request->user()->id);

        // Return the newly created family as a JSON response
        return response($family, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Family $family)
    {
        // Eager load the members of the family
        return $family->load('members');
    }

    public function update(Request $request, Family $family) {}
    public function destroy(Family $family) {}

    /**
     * Add a member to a family.
     */
    public function addMember(Request $request, Family $family)
    {
        // Authorization: Only the owner can add members
        if ($request->user()->id !== $family->owner_id) {
            return response(['message' => 'Only the family owner can add members.'], 403);
        }

        $fields = $request->validate([
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                // Rule to check if the user exists
                Rule::exists('users', 'email'),
            ],
        ]);

        $user = User::where('email', $fields['email'])->first();

        // Check if the user is already a member
        if ($family->members()->where('user_id', $user->id)->exists()) {
            return response(['message' => 'This user is already a member of the family.'], 422);
        }

        // Attach the new member to the family
        $family->members()->attach($user->id);

        // Return the updated family with all members
        return $family->load('members');
    }

    public function monthlyReport(Request $request, Family $family)
    {
        // Authorization: Ensure the current user is a member of this family
        if (!$family->members()->where('user_id', $request->user()->id)->exists()) {
            return response(['message' => 'Unauthorized'], 403);
        }

        $targetMonth = Carbon::parse($request->query('month', 'now'))->startOfMonth();
        $startDate = $targetMonth->copy()->startOfMonth();
        $endDate = $targetMonth->copy()->endOfMonth();

        // Fetch transactions belonging ONLY to this family for the target month
        $transactions = $family->transactions()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        $inflow = $transactions->where('type', 'income')->sum('amount');
        $outflow = $transactions->where('type', 'expense')->sum('amount');

        return response([
            'monthName' => $targetMonth->format('F Y'),
            'familyName' => $family->first_name,
            'totalInflow' => $inflow,
            'totalOutflow' => $outflow,
            'netPosition' => $inflow - $outflow,
            'transactionCount' => $transactions->count(),
            'transactions' => $transactions, // Send the transactions to display them
        ]);
    }
}