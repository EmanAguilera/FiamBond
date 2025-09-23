<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class HashExistingPasswords extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:hash-existing-passwords'; // Changed signature for clarity

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Finds plain-text passwords in the users table and hashes them correctly.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting to scan and hash existing user passwords...');

        $users = User::all();
        $updatedCount = 0;

        foreach ($users as $user) {
            // Check if the password is NOT already hashed.
            // Hash::info returns 'unknown' for plain text.
            if (Hash::info($user->password)['algoName'] === 'unknown') {
                $this->line("Updating password for user: {$user->email}");
                
                // Hash the plain-text password and save the user
                $user->password = Hash::make($user->password);
                $user->save();

                $updatedCount++;
            }
        }

        if ($updatedCount > 0) {
            $this->info("Successfully updated {$updatedCount} user passwords.");
        } else {
            $this->info('All user passwords seem to be already hashed. No action taken.');
        }

        return 0;
    }
}