<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // ... other commands

        // Add this line to run the command at midnight on the first day of every month.
        $schedule->command('app:generate-unseen-costs')->monthlyOn(1, '00:00');
    }

    // ... rest of the file
}