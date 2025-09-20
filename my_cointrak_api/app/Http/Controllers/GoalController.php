<?php

namespace App\Http\Controllers;

use App\Models\Goal;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule; // Make sure this line is present and not commented out.

class GoalController extends Controller
{
    public function index(Request $request)
    {
         // --- START OF PAGINATION FIX ---
        // We will now accept a 'status' query parameter to filter goals.
        $status = $request->query('status');
        $limit = $request->query('limit'); // Get the limit parameter

          $query = $request->user()->goals()->with('family')->latest();

        if ($status === 'active' || $status === 'completed') {
            $query->where('status', $status);
        }

        // If a limit is provided, use it. Otherwise, paginate.
        if ($limit) {
            return $query->take($limit)->get(); // Use take() and get() for a simple limit
        }

        // Start building the query for the user's goals.
        $query = $request->user()->goals()->with('family')->latest();

        // If a valid status is provided, add a 'where' clause to the query.
        if ($status === 'active' || $status === 'completed') {
            $query->where('status', $status);
        }

        // Return the paginated result. Let's show 5 goals per page.
        return $query->paginate(5);
        // --- END OF PAGINATION FIX ---
    }

    /**
     * --- START OF FIX ---
     * Get the count of active, personal goals for the dashboard.
     */
    public function getActivePersonalCount(Request $request)
    {
        $count = $request->user()->goals()
            ->where('status', 'active')
            ->whereNull('family_id') // This ensures we only count personal goals.
            ->count();

        return response()->json(['count' => $count]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $familyId = $request->input('family_id');

        $fields = $request->validate([
            // --- START OF VALIDATION FIX ---
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('goals')->where(function ($query) use ($user, $familyId) {
                    return $query->where('user_id', $user->id)
                                 ->where('family_id', $familyId);
                }),
            ],
            // --- END OF VALIDATION FIX ---
            'target_amount' => 'required|numeric|min:1',
            'target_date' => 'nullable|date|after:today',
            'family_id' => [
                'nullable',
                'integer',
                Rule::exists('families', 'id'),
                Rule::exists('family_user', 'family_id')->where('user_id', $user->id),
            ]
        ]);

        $goal = $request->user()->goals()->create($fields);

        // Return the goal with the family info loaded
        return response($goal->load('family'), 201);
    }

    public function markAsCompleted(Request $request, Goal $goal)
    {
        if ($request->user()->id !== $goal->user_id) {
            return response(['message' => 'Unauthorized'], 403);
        }

        $goal->status = 'completed';
        $goal->save();

        Transaction::create([
            'user_id' => $goal->user_id,
            'family_id' => $goal->family_id,
            'description' => 'Completed Goal: ' . $goal->name,
            'amount' => $goal->target_amount,
            'type' => 'expense',
        ]);

        return response($goal);
    }

    public function destroy(Request $request, Goal $goal)
    {
        if ($request->user()->id !== $goal->user_id) {
            return response(['message' => 'Unauthorized'], 403);
        }

        $goal->delete();

        return ['message' => 'The goal has been abandoned.'];
    }
}