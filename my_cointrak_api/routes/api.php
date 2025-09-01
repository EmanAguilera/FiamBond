<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\FamilyController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\GoalController;
use App\Http\Controllers\ReportController;
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

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::apiResource('posts', PostController::class);
Route::group(['middleware' => ['auth:sanctum']], function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::apiResource('families', FamilyController::class);
    Route::post('/families/{family}/members', [FamilyController::class, 'addMember']);

    Route::apiResource('transactions', TransactionController::class);
     Route::apiResource('goals', GoalController::class)->except(['show', 'update']);
     Route::get('/reports/monthly', [ReportController::class, 'monthly']);
     Route::get('/families/{family}/report', [FamilyController::class, 'monthlyReport']);
});