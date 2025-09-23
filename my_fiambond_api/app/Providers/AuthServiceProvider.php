<?php

namespace App\Providers;

// ADD THESE 'use' STATEMENTS
use App\Models\Family;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        //
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        // ADD YOUR GATE DEFINITION HERE
        Gate::define('update-family', function (User $user, Family $family) {
            return $user->id === $family->owner_id;
        });
    }
}