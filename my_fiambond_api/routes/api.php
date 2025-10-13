<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\FamilyController;
use App\Http\Controllers\GoalController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\LoanController;
// --- ADDED: Import the new VerificationController ---
use App\Http\Controllers\VerificationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// --- Publicly accessible routes ---
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/verify-2fa', [AuthController::class, 'verifyTwoFactor']);


// --- ADDED: Email Verification Routes ---
// The route the user is redirected to from the verification email.
// The 'signed' middleware protects the URL from being tampered with.
Route::get('/email/verify/{id}/{hash}', [VerificationController::class, 'verify'])
    ->middleware(['auth:sanctum', 'signed'])
    ->name('verification.verify');

// The route for a user to request a new verification email.
// The 'throttle' middleware prevents users from spamming this endpoint.
Route::post('/email/resend', [VerificationController::class, 'resend'])
    ->middleware(['auth:sanctum', 'throttle:6,1'])
    ->name('verification.send');
// --- END OF ADDED ROUTES ---


// --- Routes that require user authentication ---
Route::group(['middleware' => ['auth:sanctum']], function () {
    Route::get('/user', function (Request $request) {
        // --- MODIFIED: Ensure only verified users can access their data ---
        if (!$request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'Please verify your email address.'], 403);
        }
        return $request->user();
    });

    Route::put('/user', [UserController::class, 'update']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // --- Family Routes ---
    Route::get('/families/summaries', [FamilyController::class, 'summaries']);
    Route::post('/families/{family}/members', [FamilyController::class, 'addMember']);
    Route::get('/families/{family}/report', [FamilyController::class, 'monthlyReport']);

    // --- START: NEW FAMILY DASHBOARD ROUTES ---
    Route::get('/families/{family}/balance', [FamilyController::class, 'getBalance']);
    Route::get('/families/{family}/active-goals-count', [GoalController::class, 'getActiveFamilyCount']);
    // --- END: NEW FAMILY DASHBOARD ROUTES ---

    Route::apiResource('families', FamilyController::class);
    Route::put('/families/{family}', [FamilyController::class, 'update']);
    Route::delete('/families/{family}', [FamilyController::class, 'destroy']);

    Route::get('/families/{family}/active-loans-count', [LoanController::class, 'getActiveLoanCount']);

    // --- NEW: Family Lending (Loan) Routes ---
    Route::get('/families/{family}/loans', [LoanController::class, 'index']);
    Route::post('/families/{family}/loans', [LoanController::class, 'store']);
    Route::post('/loans/{loan}/repayments', [LoanController::class, 'repay']);

    // --- Goal Routes ---
    Route::get('/goals/active-total-count', [GoalController::class, 'getActiveTotalCount']);
    Route::put('/goals/{goal}/complete', [GoalController::class, 'markAsCompleted']);
    Route::apiResource('goals', GoalController::class)->except(['show', 'update']);
    Route::delete('/goals/{goal}', [GoalController::class, 'destroy']);
    
    // --- Transaction Routes ---
    Route::apiResource('transactions', TransactionController::class);
    Route::get('/families/{family}/transactions', [TransactionController::class, 'indexForFamily']);

    // --- Report and Balance Routes ---
    Route::get('/reports', [ReportController::class, 'generatePersonalReport']);
    Route::get('/user/balance', [App\Http\Controllers\UserController::class, 'getBalance']);
});