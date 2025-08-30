<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password; // Import the Password rule

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $fields = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Password::defaults()], // Use a stronger password rule
        ]);

        // Automatically hash the password upon creation
        $user = User::create($fields);

        // --- FIX WAS HERE ---
        // Create a token named 'auth-token'. We no longer use 'name'.
        $token = $user->createToken('auth-token');

        return response([
            'user' => $user,
            'token' => $token->plainTextToken
        ], 201); // Return a proper 201 Created status
    }

    public function login(Request $request)
    {
        $fields = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string'
        ]);

        // Check email
        $user = User::where('email', $fields['email'])->first();

        // Check password
        if (!$user || !Hash::check($fields['password'], $user->password)) {
            return response([
                'message' => 'The provided credentials are incorrect.'
            ], 401); // Return a proper 401 Unauthorized status
        }

        // --- FIX WAS HERE ---
        // Create a token named 'auth-token'. We no longer use 'name'.
        $token = $user->createToken('auth-token');

        return response([
            'user' => $user,
            'token' => $token->plainTextToken
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response([
            'message' => 'You have been successfully logged out.'
        ]);
    }
}