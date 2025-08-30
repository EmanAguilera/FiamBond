<?php

namespace App\Http\Controllers;

use App\Models\Goal;
use Illuminate\Http\Request;

class GoalController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->goals()->latest()->get();
    }

    public function store(Request $request)
    {
        $fields = $request->validate([
            'name' => 'required|string|max:255',
            'target_amount' => 'required|numeric|min:1',
        ]);

        $goal = $request->user()->goals()->create($fields);

        return response($goal, 201);
    }

    public function destroy(Request $request, Goal $goal)
    {
        // Authorize that the user owns this goal
        if ($request->user()->id !== $goal->user_id) {
            return response(['message' => 'Unauthorized'], 403);
        }

        $goal->delete();

        return ['message' => 'The goal has been abandoned.'];
    }
}