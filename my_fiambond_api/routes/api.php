<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\FamilyController;
use App\Http\Controllers\GoalController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TransactionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Publicly accessible routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::post('/verify-2fa', [AuthController::class, 'verifyTwoFactor']);

// Routes that require user authentication
Route::group(['middleware' => ['auth:sanctum']], function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::put('/user', [UserController::class, 'update']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Family Routes
    Route::get('/families/summaries', [FamilyController::class, 'summaries']);
    Route::post('/families/{family}/members', [FamilyController::class, 'addMember']);
    Route::get('/families/{family}/report', [FamilyController::class, 'monthlyReport']);
    Route::apiResource('families', FamilyController::class);

    // Goal Routes
    Route::get('/goals/active-personal-count', [GoalController::class, 'getActivePersonalCount']);
    Route::put('/goals/{goal}/complete', [GoalController::class, 'markAsCompleted']);
    Route::apiResource('goals', GoalController::class)->except(['show', 'update']);
    
    // Transaction Routes
    Route::apiResource('transactions', TransactionController::class);

    // --- START OF FIX ---
    // The route is corrected to /reports to match the frontend API call.
    // The auth middleware is added to protect the route.
    Route::get('/reports', [ReportController::class, 'generateMonthlyReport'])->middleware('auth:sanctum');
    // --- END OF FIX ---
    
    Route::get('/user/balance', [ReportController::class, 'getUserBalance']);

    Route::get('/user/balance', [App\Http\Controllers\UserController::class, 'getBalance']);
    Route::put('/families/{family}', [FamilyController::class, 'update']); // Add this for updating
    Route::delete('/families/{family}', [FamilyController::class, 'destroy']); // Add this for deleting
    Route::delete('/goals/{goal}', [GoalController::class, 'destroy']);
});