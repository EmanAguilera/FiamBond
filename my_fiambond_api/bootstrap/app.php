<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Auth\AuthenticationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // --- THIS IS THE FIX ---
        // This tells Laravel to apply the CORS rules from your config/cors.php
        // file to all requests that start with /api/.
        $middleware->group('api', [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
        // --- END OF FIX ---
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Your existing exception handling is good. Leave it as is.
        $exceptions->renderable(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Unauthenticated.'
                ], 401);
            }
        });
    })->create();