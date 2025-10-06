<?php

namespace App\Http\Controllers;

use App\Models\Goal;
use App\Models\Transaction;
use App\Models\Family;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class GoalController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status');
        $familyId = $request->query('family_id');

        // --- MODIFICATION: Add 'user' and 'completedBy' to the eager loading ---
        $query = Goal::with(['family', 'user', 'completedBy'])->latest();

        // If a family_id is provided, check authorization and filter
        if ($familyId) {
            $family = Family::find($familyId);
            if (!$family) {
                return response(['message' => 'Family not found.'], 404);
            }
            if (!$family->members()->where('user_id', $request->user()->id)->exists()) {
                return response(['message' => 'Unauthorized to view goals for this family.'], 403);
            }
            // All family members can see the family goals
            $query->where('family_id', $familyId);
        } else {
            // Only fetch personal goals for the logged-in user
            $query->where('user_id', $request->user()->id)->whereNull('family_id');
        }

        if ($status === 'active' || $status === 'completed') {
            $query->where('status', $status);
        }

        return $query->paginate(5);
    }

    // ... (getActivePersonalCount and getActiveFamilyCount methods are fine) ...

    public function store(Request $request)
    {
        // This method is already correct and doesn't need changes.
        // The user_id is automatically set when creating the goal.
        // ...
    }

    public function markAsCompleted(Request $request, Goal $goal)
    {
        // --- START OF MODIFICATIONS FOR THIS METHOD ---
        $user = $request->user();

        // Authorization: Check if the user is the owner (for personal goals)
        // OR a member of the family (for family goals).
        $isOwner = $user->id === $goal->user_id;
        $isFamilyMember = $goal->family_id && $goal->family->members()->where('user_id', $user->id)->exists();

        if (!$isOwner && !$isFamilyMember) {
            return response(['message' => 'Unauthorized'], 403);
        }

        // Update the goal with the completer's ID and the completion timestamp
        $goal->status = 'completed';
        $goal->completed_by_id = $user->id; // Record who completed it
        $goal->completed_at = now();       // Record when it was completed
        $goal->save();

        // Create the completion transaction (this logic is good)
        Transaction::create([
            'user_id' => $goal->user_id, // Transaction is still logged against the goal creator
            'family_id' => $goal->family_id,
            'description' => 'Completed Goal: ' . $goal->name,
            'amount' => $goal->target_amount,
            'type' => 'expense',
        ]);

        return response($goal->load(['user', 'completedBy'])); // Return the updated goal with user info
        // --- END OF MODIFICATIONS FOR THIS METHOD ---
    }

    public function destroy(Request $request, Goal $goal)
    {
        // This authorization is also good. Usually, only the creator should be able to delete.
        if ($request->user()->id !== $goal->user_id) {
            return response(['message' => 'Unauthorized'], 403);
        }
        $goal->delete();
        return ['message' => 'The goal has been abandoned.'];
    }
}