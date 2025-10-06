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
     * - If 'family_id' is provided, it shows all goals for that family.
     * - If not, it shows all goals (personal and family) created by the logged-in user.
     */
    public function index(Request $request)
    {
        $status = $request->query('status');
        $familyId = $request->query('family_id');

        // Eager load relationships to prevent N+1 query problems on the frontend
        $query = Goal::with(['family', 'user', 'completedBy'])->latest();

        // LOGIC FOR FAMILY-SPECIFIC GOAL LIST (from FamilyRealm)
        if ($familyId) {
            $family = Family::find($familyId);
            if (!$family) {
                return response(['message' => 'Family not found.'], 404);
            }
            // Authorize: Ensure the user is a member of the requested family.
            if (!$family->members()->where('user_id', $request->user()->id)->exists()) {
                return response(['message' => 'Unauthorized to view goals for this family.'], 403);
            }
            // Filter to show all goals belonging to this family.
            $query->where('family_id', $familyId);
        }
        // LOGIC FOR THE MAIN DASHBOARD'S GOAL LIST (shows all goals created by the user)
        else {
            $query->where('user_id', $request->user()->id);
        }

        // Filter by status if provided (e.g., 'active', 'completed')
        if ($status === 'active' || $status === 'completed') {
            $query->where('status', $status);
        }

        return $query->paginate(5);
    }

    /**
     * Get the total count of all active goals (personal and family) created by the user.
     * Used for the main dashboard summary card.
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
     * Used for the FamilyRealm dashboard summary card.
     */
    public function getActiveFamilyCount(Request $request, Family $family)
    {
        // Authorize: Ensure the user is a member of the family.
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
                // This rule prevents a user from creating duplicate-named goals
                // within the same context (either personal or for the same family).
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
                // Ensure the user is a member of the family they're creating a goal for.
                Rule::exists('family_user', 'family_id')->where('user_id', $user->id),
            ]
        ]);

        // Associate the goal with the authenticated user and create it.
        $goal = $user->goals()->create($fields);
        return response($goal->load('family'), 201);
    }

    /**
     * Mark the specified goal as completed.
     */
    public function markAsCompleted(Request $request, Goal $goal)
    {
        $user = $request->user();

        // Authorization: A user can complete a goal if they created it,
        // OR if it's a family goal and they are a member of that family.
        $isCreator = $user->id === $goal->user_id;
        $isFamilyMember = $goal->family_id && $goal->family->members()->where('user_id', $user->id)->exists();

        if (!$isCreator && !$isFamilyMember) {
            return response(['message' => 'You are not authorized to complete this goal.'], 403);
        }

        // Update the goal's status and record who completed it and when.
        $goal->status = 'completed';
        $goal->completed_by_id = $user->id;
        $goal->completed_at = now();
        $goal->save();

        // Create an expense transaction for the goal's creator upon completion.
        Transaction::create([
            'user_id' => $goal->user_id,
            'family_id' => $goal->family_id,
            'description' => 'Completed Goal: ' . $goal->name,
            'amount' => $goal->target_amount,
            'type' => 'expense',
        ]);

        return response($goal->load(['user', 'completedBy']));
    }

    /**
     * Remove the specified goal from storage.
     */
    public function destroy(Request $request, Goal $goal)
    {
        // Authorization: Only the original creator of the goal can delete it.
        if ($request->user()->id !== $goal->user_id) {
            return response(['message' => 'You are not authorized to abandon this goal.'], 403);
        }
        $goal->delete();
        return response(['message' => 'The goal has been abandoned.']);
    }
}