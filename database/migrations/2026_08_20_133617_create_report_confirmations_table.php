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
        Schema::create('report_confirmations', function (Blueprint $table) {
            $table->id(); 
            
            // Relasi ke tabel reports 
            $table->foreignId('report_id')->constrained('reports')->onDelete('cascade'); 
            
            $table->string('user_token'); // Token anonim pengkonfirmasi
            $table->string('ip_address'); // Untuk mencegah spam IP[cite: 5]
            $table->timestamps(); 

            // Aturan: 1 token hanya bisa konfirmasi 1 kali per laporan[cite: 5]
            $table->unique(['report_id', 'user_token']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_confirmations');
    }
};
