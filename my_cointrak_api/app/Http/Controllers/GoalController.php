<?php

namespace App\Http\Controllers;

use App\Models\Goal;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule; // <-- FIX #1: This line was missing, causing the 500 error.

class GoalController extends Controller
{
    public function index(Request $request)
    {
        // Eager load the family relationship to avoid extra queries on the frontend
        return $request->user()->goals()->with('family')->latest()->get();
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $fields = $request->validate([
            'name' => 'required|string|max:255',
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