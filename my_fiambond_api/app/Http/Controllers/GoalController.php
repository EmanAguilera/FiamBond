<?php

namespace App\Http\Controllers;

use App\Models\Goal;
use App\Models\Transaction;
use App\Models\Family;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class GoalController extends Controller
{
    /**
     * Display a paginated list of goals.
     */
    public function index(Request $request)
    {
        $status = $request->query('status');
        $familyId = $request->query('family_id');

        $query = Goal::with(['family', 'user', 'completedBy'])->latest();

        if ($familyId) {
            $family = Family::find($familyId);
            if (!$family) {
                return response(['message' => 'Family not found.'], 404);
            }
            if (!$family->members()->where('user_id', $request->user()->id)->exists()) {
                return response(['message' => 'Unauthorized to view goals for this family.'], 403);
            }
            $query->where('family_id', $familyId);
        } else {
            $query->where('user_id', $request->user()->id);
        }

        if ($status === 'active' || $status === 'completed') {
            $query->where('status', $status);
        }

        return $query->paginate(5);
    }

    /**
     * Get the total count of all active goals created by the user.
     */
    public function getActiveTotalCount(Request $request)
    {
        $count = $request->user()->goals()
            ->where('status', 'active')
            ->count();
        return response()->json(['count' => $count]);
    }

    /**
     * Get the count of active goals for a specific family.
     */
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

    /**
     * Store a newly created goal in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $familyId = $request->input('family_id');

        $fields = $request->validate([
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('goals')->where(function ($query) use ($user, $familyId) {
                    return $query->where('user_id', $user->id)
                                 ->where('family_id', $familyId);
                }),
            ],
            'target_amount' => 'required|numeric|min:1',
            'target_date' => 'nullable|date|after_or_equal:today',
            'family_id' => [
                'nullable', 'integer',
                Rule::exists('families', 'id'),
                Rule::exists('family_user', 'family_id')->where('user_id', $user->id),
            ]
        ]);

        $goal = $user->goals()->create($fields);
        return response($goal->load('family'), 201);
    }


    // --- START OF THE FIX ---

    /**
     * Mark the specified goal as completed.
     * This is the corrected version.
     */
    public function markAsCompleted(Request $request, Goal $goal)
    {
        $user = $request->user();

        // FIX #1: Correct Authorization Logic
        // A user can complete a goal if:
        // 1. They are the original creator.
        // 2. It's a family goal and they are a member of that family.
        $isCreator = $user->id === $goal->user_id;
        $isFamilyMember = $goal->family_id && $goal->family->members()->where('user_id', $user->id)->exists();

        if (!$isCreator && !$isFamilyMember) {
            return response(['message' => 'You are not authorized to complete this goal.'], 403);
        }

        // FIX #2: Add the Missing Logic to Record Completer and Timestamp
        $goal->status = 'completed';
        $goal->completed_by_id = $user->id; // Record who clicked the button
        $goal->completed_at = now();       // Record when it was completed
        $goal->save();

        // Create an expense transaction for the goal's original creator.
        Transaction::create([
            'user_id'       => $goal->user_id, // The expense is tied to the goal's creator
            'family_id'     => $goal->family_id,
            'description'   => 'Completed Goal: ' . $goal->name,
            'amount'        => $goal->target_amount,
            'type'          => 'expense',
            'transaction_date' => now(), // It's good practice to add the date
        ]);

        // Return the updated goal with all the new info
        return response($goal->load(['user', 'completedBy']));
    }

    // --- END OF THE FIX ---


    /**
     * Remove the specified goal from storage.
     */
    public function destroy(Request $request, Goal $goal)
    {
        // Only the original creator can abandon a goal.
        if ($request->user()->id !== $goal->user_id) {
            return response(['message' => 'You are not authorized to abandon this goal.'], 403);
        }
        $goal->delete();
        return response(['message' => 'The goal has been abandoned.']);
    }
}