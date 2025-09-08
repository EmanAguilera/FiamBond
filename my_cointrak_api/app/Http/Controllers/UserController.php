<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    /**
     * Update the authenticated user's profile information.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        // Dynamically build validation rules based on what's being updated.
        $rules = [
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'email' => [
                'sometimes',
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            // The new password must be present and confirmed, but it's nullable
            // so this rule only triggers when a password update is attempted.
            'new_password' => ['nullable', 'confirmed', Password::defaults()],
        ];
        
        // Removed 'current_password' validation completely.
        $validatedData = $request->validate($rules);

        // Update profile information if provided
        if (isset($validatedData['first_name'])) {
            $user->first_name = $validatedData['first_name'];
        }

        if (isset($validatedData['last_name'])) {
            $user->last_name = $validatedData['last_name'];
        }

        if (isset($validatedData['email'])) {
            $user->email = $validatedData['email'];
        }

        // Update password if a new one is provided.
        // The check for the current password has been removed.
        if (isset($validatedData['new_password'])) {
            $user->password = Hash::make($validatedData['new_password']);
        }

        $user->save();

        // Determine the success message based on the fields updated.
        $message = 'Your profile has been updated successfully!';
        if (isset($validatedData['new_password'])) {
            $message = 'Your password has been updated successfully!';
        }

        return response()->json([
            'message' => $message,
            'user' => $user,
        ]);
    }
}