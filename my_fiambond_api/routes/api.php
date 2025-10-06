<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\FamilyController;
use App\Http\Controllers\GoalController;
use App\Http\Controllers\LoanController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Enjoy building your API!
|
*/

// --- Publicly accessible routes ---
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/verify-2fa', [AuthController::class, 'verifyTwoFactor']);

// --- Routes that require user authentication ---
Route::group(['middleware' => ['auth:sanctum']], function () {
    // --- User & Auth Routes ---
    Route::get('/user', function (Request $request) {
        return $request->user()->load('families'); // Eager load families for convenience
    });
    Route::put('/user', [UserController::class, 'update']);
    Route::get('/user/balance', [UserController::class, 'getBalance']);
    Route::post('/logout', [AuthController::class, 'logout']);


    // --- Family Routes ---
    // Custom summary and report routes
    Route::get('/families/summaries', [FamilyController::class, 'summaries']);
    Route::get('/families/{family}/report', [FamilyController::class, 'monthlyReport']);
    Route::post('/families/{family}/members', [FamilyController::class, 'addMember']);
    // Dashboard-specific data routes
    Route::get('/families/{family}/balance', [FamilyController::class, 'getBalance']);
    Route::get('/families/{family}/active-goals-count', [GoalController::class, 'getActiveFamilyCount']);
    Route::get('/families/{family}/active-loans-count', [LoanController::class, 'getActiveLoanCount']);
    // Standard CRUD routes for families
    Route::apiResource('families', FamilyController::class);


    // --- Goal Routes ---
    // FIX: Renamed route and pointed to the correct 'getActiveTotalCount' method from your controller.
    Route::get('/goals/active-total-count', [GoalController::class, 'getActiveTotalCount']);
    // Custom action to mark a goal as completed
    Route::put('/goals/{goal}/complete', [GoalController::class, 'markAsCompleted']);
    // Standard CRUD routes for goals (excluding show/update as they are not used)
    Route::apiResource('goals', GoalController::class)->except(['show', 'update']);


    // --- Transaction Routes ---
    Route::get('/families/{family}/transactions', [TransactionController::class, 'indexForFamily']);
    Route::apiResource('transactions', TransactionController::class);

    
    // --- Family Lending (Loan) Routes ---
    Route::get('/families/{family}/loans', [LoanController::class, 'index']);
    Route::post('/families/{family}/loans', [LoanController::class, 'store']);
    Route::post('/loans/{loan}/repayments', [LoanController::class, 'repay']);


    // --- Reporting Routes ---
    Route::get('/reports/personal', [ReportController::class, 'generatePersonalReport']);
});