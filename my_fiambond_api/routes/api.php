<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\FamilyController;
use App\Http\Controllers\GoalController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\LoanController; // <-- ADDED: Import the new controller
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// --- Publicly accessible routes ---
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::post('/verify-2fa', [AuthController::class, 'verifyTwoFactor']);

// --- Routes that require user authentication ---
Route::group(['middleware' => ['auth:sanctum']], function () {
    Route::get('/user', function (Request $request) {
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

    // This provides the main CRUD endpoints for families.
    Route::apiResource('families', FamilyController::class);
    // Preserving your explicit update and delete routes as requested.
    Route::put('/families/{family}', [FamilyController::class, 'update']);
    Route::delete('/families/{family}', [FamilyController::class, 'destroy']);

    Route::get('/families/{family}/active-loans-count', [LoanController::class, 'getActiveLoanCount']);

    // --- NEW: Family Lending (Loan) Routes ---
    // These routes are required for the peer-to-peer lending feature.
    Route::get('/families/{family}/loans', [LoanController::class, 'index']);   // Gets all loans within a family.
    Route::post('/families/{family}/loans', [LoanController::class, 'store']);   // Creates a new loan between members.
    Route::post('/loans/{loan}/repayments', [LoanController::class, 'repay']); // Records a repayment against a loan.
    // --- END OF NEW ROUTES ---


    // --- Goal Routes ---
    Route::get('/goals/active-personal-count', [GoalController::class, 'getActivePersonalCount']);
    Route::put('/goals/{goal}/complete', [GoalController::class, 'markAsCompleted']);
    Route::apiResource('goals', GoalController::class)->except(['show', 'update']);
    // Preserving your explicit delete route as requested.
    Route::delete('/goals/{goal}', [GoalController::class, 'destroy']);
    
    // --- Transaction Routes ---
    Route::apiResource('transactions', TransactionController::class);
    Route::get('/families/{family}/transactions', [TransactionController::class, 'indexForFamily']);

    // --- Report and Balance Routes ---
    // The personal financial report for the logged-in user.
    Route::get('/reports', [ReportController::class, 'generatePersonalReport']);
    
    // The route for the user's current balance. The duplicate pointing to ReportController has been removed to fix the conflict.
    Route::get('/user/balance', [App\Http\Controllers\UserController::class, 'getBalance']);

});