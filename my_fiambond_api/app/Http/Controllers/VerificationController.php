<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;

class VerificationController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     *
     * This method handles the link the user clicks in their email.
     */
    public function verify(EmailVerificationRequest $request): RedirectResponse
    {
        // The EmailVerificationRequest handles finding the user and validating the hash.
        // If the user is already verified, this will just proceed.
        if (!$request->user()->hasVerifiedEmail()) {
            $request->user()->markEmailAsVerified();
        }

        // --- IMPORTANT ---
        // Redirect the user to a frontend page that shows a "Verification Successful" message.
        // You can add query parameters if your frontend needs them.
        return redirect(env('FRONTEND_URL', 'http://localhost:3000') . '/login?verified=true');
    }

    /**
     * Resend the email verification notification.
     *
     * This can be called by a logged-in but unverified user.
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