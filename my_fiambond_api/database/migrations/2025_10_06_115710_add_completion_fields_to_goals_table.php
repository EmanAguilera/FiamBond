<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        // Use Schema::table() to modify the existing 'goals' table
        Schema::table('goals', function (Blueprint $table) {
            // Add a column to store the ID of the user who completed the goal.
            // It's nullable because active goals won't have a completer.
            // ->after('status') is optional but helps keep the database schema organized.
            $table->foreignId('completed_by_id')
                  ->nullable()
                  ->after('status') // This places the new column after the 'status' column
                  ->constrained('users')
                  ->onDelete('set null');

            // Add a column to store the exact timestamp of when the goal was completed.
            $table->timestamp('completed_at')->nullable()->after('completed_by_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::table('goals', function (Blueprint $table) {
            // To properly drop a foreign key, it's best to use the array syntax
            // which tells Laravel to drop the key first, then the column.
            $table->dropForeign(['completed_by_id']);
            $table->dropColumn(['completed_by_id', 'completed_at']);
        });
    }
};