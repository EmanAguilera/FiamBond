<?php

namespace App\Http\Controllers;

// Import necessary classes
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use App\Mail\TwoFactorCodeMail; // The mailable for sending the OTP
use Carbon\Carbon; // Used for setting the OTP expiry time

class AuthController extends Controller
{
    /**
     * Handle a registration request.
     * Creates a new user and returns a success message.
     */
    public function register(Request $request)
    {
        // Validate the incoming request data
        $fields = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        // Create the new user in the database
        User::create([
            'first_name' => $fields['first_name'],
            'last_name' => $fields['last_name'],
            'email' => $fields['email'],
            'password' => Hash::make($fields['password']),
        ]);

        // --- CHANGE START ---
        // OLD: The controller created a token and returned it, logging the user in.
        // NEW: Return a success message instead, prompting the user to proceed to login.

        return response([
            'message' => 'Registration successful. Please log in.'
        ], 201); // 201 Created status
        // --- CHANGE END ---
    }

    /**
     * Handle the first step of a login request.
     * Verifies credentials, generates a 2FA code, and sends it via email.
     */
    public function login(Request $request)
    {
        // Validate the email and password
        $fields = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string'
        ]);

        // Find the user by their email address
        $user = User::where('email', $fields['email'])->first();

        // Check if a user was found and if the provided password is correct
        if (!$user || !Hash::check($fields['password'], $user->password)) {
            // If not, throw a validation exception with an error message
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        // Generate a random 6-digit One-Time Password (OTP)
        $otp = random_int(100000, 999999);

        // Store the OTP and set an expiry time (e.g., 10 minutes from now)
        $user->otp_code = $otp;
        $user->otp_expires_at = Carbon::now()->addMinutes(10);
        $user->save();

        // Send the OTP to the user's email address
        Mail::to($user->email)->send(new TwoFactorCodeMail((string)$otp));

        // Return a response indicating that 2FA is required
        return response([
            'message' => 'A 2FA code has been sent to your email.',
            'user_id' => $user->id // Send user_id for the frontend to use in the next step
        ]);
    }

    /**
     * Handle the second step of a login request (verifying the 2FA code).
     */
    public function verifyTwoFactor(Request $request)
    {
        // Validate the user_id and the submitted OTP code
        $fields = $request->validate([
            'user_id' => 'required|exists:users,id',
            'otp_code' => 'required|string',
        ]);

        // Find the user
        $user = User::find($fields['user_id']);

        // Check if the submitted code is incorrect or if the code has expired
        if ($user->otp_code !== $fields['otp_code'] || Carbon::now()->gt($user->otp_expires_at)) {
            // If the code is invalid, return an error response
            return response([
                'message' => 'The provided code is invalid or has expired.'
            ], 422); // 422 Unprocessable Entity status
        }

        // The code is valid, so clear the OTP fields in the database
        $user->otp_code = null;
        $user->otp_expires_at = null;
        $user->save();

        // Create the final authentication token
        $token = $user->createToken('auth-token')->plainTextToken;

        // Return the authenticated user data and the token
        return response([
            'user' => $user,
            'token' => $token
        ]);
    }

    /**
     * Handle a logout request.
     * Deletes the user's current access token.
     */
    public function logout(Request $request)
    {
        // Revoke the token that was used to authenticate the current request
        $request->user()->currentAccessToken()->delete();

        // Return a success message
        return response([
            'message' => 'You have been successfully logged out.'
        ]);
    }
}