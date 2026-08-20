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
        Schema::create('report_photos', function (Blueprint $table) {
            $table->id(); 
            
            // Relasi ke tabel reports
            $table->foreignId('report_id')->constrained('reports')->onDelete('cascade');
            
            $table->string('user_token'); 
            $table->string('photo_url'); 
            $table->text('caption')->nullable(); // Caption bersifat opsional[cite: 5]
            $table->timestamps(); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_photos');
    }
};
