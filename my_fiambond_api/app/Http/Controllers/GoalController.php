<?php

namespace App\Http\Controllers;

use App\Models\Goal;
use App\Models\Transaction;
use App\Models\Family; // Make sure the Family model is imported
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class GoalController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status');
        $familyId = $request->query('family_id'); // Get the optional family_id parameter

        // Start building the base query for the authenticated user's goals.
        $query = $request->user()->goals()->with('family')->latest();

        // Filter by status (e.g., 'active', 'completed')
        if ($status === 'active' || $status === 'completed') {
            $query->where('status', $status);
        }

        // --- START OF THE FIX ---
        // If a family_id is provided, add a filter to the query.
        if ($familyId) {
            // First, find the family to ensure it exists.
            $family = Family::find($familyId);
            if (!$family) {
                return response(['message' => 'Family not found.'], 404);
            }
            // Second, authorize to make sure the user is actually a member of this family.
            if (!$family->members()->where('user_id', $request->user()->id)->exists()) {
                return response(['message' => 'Unauthorized to view goals for this family.'], 403);
            }
            // Finally, add the where clause to filter the goals.
            $query->where('family_id', $familyId);
        }
        // If no family_id is provided, the query remains as is, fetching all of the user's goals
        // (both personal and for all their families), which is the correct behavior for the main dashboard.
        // --- END OF THE FIX ---

        return $query->paginate(5);
    }

    // ... The rest of your GoalController methods (getActivePersonalCount, store, etc.) remain the same.
    
    public function getActivePersonalCount(Request $request)
    {
        $count = $request->user()->goals()
            ->where('status', 'active')
            ->whereNull('family_id') // This ensures we only count personal goals.
            ->count();

        return response()->json(['count' => $count]);
    }

    public function getActiveFamilyCount(Request $request, Family $family)
    {
        if (!$family->members()->where('user_id', $request->user()->id)->exists()) {
            return response(['message' => 'Unauthorized'], 403);
        }
        $count = Goal::where('family_id', $family->id)
            ->where('status', 'active')
            ->count();
        return response()->json(['count' => $count]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $familyId = $request->input('family_id');

        $fields = $request->validate([
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('goals')->where(function ($query) use ($user, $familyId) {
                    return $query->where('user_id', $user->id)
                                 ->where('family_id', $familyId)
                                 ->where('status', 'active');
                }),
            ],
            'target_amount' => 'required|numeric|min:1',
            'target_date' => 'nullable|date|after:today',
            'family_id' => [
                'nullable', 'integer',
                Rule::exists('families', 'id'),
                Rule::exists('family_user', 'family_id')->where('user_id', $user->id),
            ]
        ]);
        $goal = $request->user()->goals()->create($fields);
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