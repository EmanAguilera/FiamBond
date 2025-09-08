<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\FamilyController;
use App\Http\Controllers\GoalController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TransactionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Publicly accessible routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Example resource route (assuming it's for a different feature)

// Routes that require user authentication
Route::group(['middleware' => ['auth:sanctum']], function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

     Route::put('/user', [UserController::class, 'update']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Family Routes
    // Specific routes are listed BEFORE the general apiResource to avoid conflicts.
    Route::get('/families/summaries', [FamilyController::class, 'summaries']);
    Route::post('/families/{family}/members', [FamilyController::class, 'addMember']);
    Route::get('/families/{family}/report', [FamilyController::class, 'monthlyReport']);
    Route::apiResource('families', FamilyController::class);

    // Goal Routes
    // Custom action route for completing a goal
    Route::put('/goals/{goal}/complete', [GoalController::class, 'markAsCompleted']);
    Route::apiResource('goals', GoalController::class)->except(['show', 'update']);
    
    // Transaction Routes
    Route::apiResource('transactions', TransactionController::class);

    // Reporting Routes
    // --- START OF FIX ---
    // The method name is corrected from 'monthly' to 'generateMonthlyReport'
    // to match the actual method defined in the ReportController.
    Route::get('/reports/monthly', [ReportController::class, 'generateMonthlyReport']);
    // --- END OF FIX ---
    Route::get('/user/balance', [ReportController::class, 'getUserBalance']);

});