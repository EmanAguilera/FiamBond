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
        Schema::create('goals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Link to a family (nullable, so it can be a personal goal)
            $table->foreignId('family_id')->nullable()->constrained()->onDelete('set null');

            $table->string('name');
            $table->decimal('target_amount', 10, 2);
            $table->text('consequence_note')->nullable();
            
            // The target date for the goal
            $table->date('target_date')->nullable();
            
            // The current status of the goal
            $table->string('status')->default('active');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('goals');
    }
};