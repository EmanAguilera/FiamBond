<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Add the new 'loan_id' column.
            // It's nullable because regular transactions won't have a loan ID.
            // It's constrained, meaning it must match an ID in the 'loans' table.
            // 'nullOnDelete' means if a loan is deleted, this field becomes NULL instead of deleting the transaction.
            $table->foreignId('loan_id')->nullable()->constrained()->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // This properly removes the column and its foreign key constraint if you ever need to rollback.
            $table->dropForeign(['loan_id']);
            $table->dropColumn('loan_id');
        });
    }
};