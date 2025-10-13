<?php

namespace App\Http\Controllers;

use App\Models\User; // <-- Make sure User is imported
use Illuminate\Http\Request; // <-- We will use the generic Request
use Illuminate\Http\RedirectResponse;

class VerificationController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function verify(Request $request): RedirectResponse
    {
        // Find the user by the 'id' from the URL
        $user = User::findOrFail($request->route('id'));

        // Check if the user is already verified
        if ($user->hasVerifiedEmail()) {
            return redirect(env('FRONTEND_URL') . '/login?verified=1&already_verified=1');
        }

        // Mark the user's email as verified
        if ($user->markEmailAsVerified()) {
            event(new \Illuminate\Auth\Events\Verified($user));
        }

        // Redirect to the frontend login page with a success message
        return redirect(env('FRONTEND_URL') . '/login?verified=1');
    }

    /**
     * Resend the email verification notification.
     */
    public function resend(Request $request)
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email is already verified.'], 400);
        }

        $request->user()->sendEmailVerificationNotification();

        return response()->json(['message' => 'A fresh verification link has been sent to your email address.']);
    }
}