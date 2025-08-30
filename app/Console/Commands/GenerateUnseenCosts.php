<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class GenerateUnseenCosts extends Command
{
    protected $signature = 'app:generate-unseen-costs';
    protected $description = 'Calculate and record unseen costs for all users for the previous month.';

    public function handle()
    {
        $this->info('Starting to generate unseen costs...');

        $users = User::all();
        $previousMonth = Carbon::now()->subMonth();
        $startDate = $previousMonth->startOfMonth();
        $endDate = $previousMonth->endOfMonth();

        foreach ($users as $user) {
            // Get all 'expense' transactions for the user from the previous month.
            $expenses = $user->transactions()
                ->where('type', 'expense')
                ->where('is_system_generated', false) // Exclude previous unseen costs
                ->whereBetween('created_at', [$startDate, $endDate])
                ->sum('amount');

            if ($expenses > 0) {
                // Calculate a simulated 7% tax as the "unseen cost".
                $unseenCost = $expenses * 0.07;

                // Create the system-generated transaction.
                $user->transactions()->create([
                    'description' => 'System Entry: Aggregate Unseen Costs (Taxes, Fees)',
                    'amount' => $unseenCost,
                    'type' => 'expense',
                    'is_system_generated' => true,
                    // Set the creation date to the end of the month it represents.
                    'created_at' => $endDate,
                ]);

                $this->info("Generated unseen cost of {$unseenCost} for user {$user->email}.");
            }
        }

        $this->info('Successfully generated all unseen costs.');
    }
}