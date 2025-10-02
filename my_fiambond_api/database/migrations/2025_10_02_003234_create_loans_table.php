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
        Schema::create('loans', function (Blueprint $table) {
             $table->id();
             $table->foreignId('family_id')->constrained()->onDelete('cascade');
             $table->foreignId('creditor_id')->constrained('users')->onDelete('cascade'); // The lender
             $table->foreignId('debtor_id')->constrained('users')->onDelete('cascade');   // The borrower
             $table->decimal('amount', 10, 2);
             $table->decimal('repaid_amount', 10, 2)->default(0.00);
             $table->string('description');
             $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};
