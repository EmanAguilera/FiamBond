<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Mail; // <-- IMPORT FACADES
use App\Mail\TwoFactorCodeMail;
use Carbon\Carbon;

class AuthController extends Controller
{
    // ... register() and logout() methods remain the same

    public function login(Request $request)
    {
        $fields = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string'
        ]);

        // Find the user by email
        $user = User::where('email', $fields['email'])->first();

        // Check if user exists and password is correct
        if (!$user || !Hash::check($fields['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        // --- 2FA Logic ---
        // Generate a random 6-digit code
        $otp = random_int(100000, 999999);

        // Set the code and expiry time on the user model
        $user->otp_code = $otp;
        $user->otp_expires_at = Carbon::now()->addMinutes(10);
        $user->save();

        // Send the email with the code
        Mail::to($user->email)->send(new TwoFactorCodeMail($otp));

        // Return a response indicating 2FA is required
        // The frontend will use this response to show the OTP input form
        return response([
            'message' => 'A 2FA code has been sent to your email.',
            'user_id' => $user->id // Send user_id to frontend for the next step
        ]);
    }

    public function verifyTwoFactor(Request $request)
    {
        $fields = $request->validate([
            'user_id' => 'required|exists:users,id',
            'otp_code' => 'required|string',
        ]);

        $user = User::find($fields['user_id']);

        // Check if the code is correct and not expired
        if ($user->otp_code !== $fields['otp_code'] || Carbon::now()->gt($user->otp_expires_at)) {
            return response([
                'message' => 'The provided code is invalid or has expired.'
            ], 422); // Unprocessable Entity
        }

        // Clear the OTP fields
        $user->otp_code = null;
        $user->otp_expires_at = null;
        $user->save();

        // The code is correct, create the auth token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response([
            'user' => $user,
            'token' => $token
        ]);
    }
}