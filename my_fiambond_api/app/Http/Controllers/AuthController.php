<?php

namespace App\Http\Controllers;

// Import necessary classes
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use App\Mail\TwoFactorCodeMail;
use Carbon\Carbon;
// --- ADDED: Import the Registered event ---
use Illuminate\Auth\Events\Registered;

class AuthController extends Controller
{
    /**
     * Handle a registration request.
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
        $user = User::create([
            'first_name' => $fields['first_name'],
            'last_name' => $fields['last_name'],
            'email' => $fields['email'],
            'password' => Hash::make($fields['password']),
        ]);

        // --- CHANGED ---
        // Fire the Registered event. Laravel's event listener will automatically
        // send the verification email because your User model implements MustVerifyEmail.
        event(new Registered($user));
        // --- END OF CHANGE ---

        // Return a response prompting the user to check their email
        return response([
            'message' => 'Registration successful. Please check your email for a verification link.'
        ], 201);
    }

    /**
     * Handle the first step of a login request.
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
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        // --- ADDED: Check if the user's email is verified ---
        if (!$user->hasVerifiedEmail()) {
            return response([
                'message' => 'Your email address is not verified. Please check your inbox.'
            ], 403); // 403 Forbidden status is appropriate here
        }
        // --- END OF ADDED CHECK ---

        // Generate and send the 2FA code (this part remains the same)
        $otp = random_int(100000, 999999);
        $user->otp_code = $otp;
        $user->otp_expires_at = Carbon::now()->addMinutes(10);
        $user->save();

        Mail::to($user->email)->send(new TwoFactorCodeMail((string)$otp));

        return response([
            'message' => 'A 2FA code has been sent to your email.',
            'user_id' => $user->id
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

        $user = User::find($fields['user_id']);

        // This check implicitly relies on the login step having already found the user
        if (!$user) {
             return response(['message' => 'User not found.'], 404);
        }

        if ($user->otp_code !== $fields['otp_code'] || Carbon::now()->gt($user->otp_expires_at)) {
            return response(['message' => 'The provided code is invalid or has expired.'], 422);
        }

        // Clear the OTP fields
        $user->forceFill([
            'otp_code' => null,
            'otp_expires_at' => null,
        ])->save();

        // Create the authentication token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response([
            'user' => $user,
            'token' => $token
        ]);
    }

    /**
     * Handle a logout request.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response([
            'message' => 'You have been successfully logged out.'
        ]);
    }
}