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
        Schema::create('users', function (Blueprint $table) {
            $table->id(); // bigint PK[cite: 5]
            $table->string('name'); // Nama admin / dinas[cite: 5]
            $table->string('email')->unique(); // Email unik[cite: 5]
            $table->timestamp('email_verified_at')->nullable(); // Bawaan Laravel untuk verifikasi email
            $table->string('password'); // Hashed password[cite: 5]
            
            // Menambahkan kolom role dengan pilihan admin atau superadmin[cite: 5]
            $table->enum('role', ['admin', 'superadmin'])->default('admin'); 
            
            $table->rememberToken(); // Bawaan Laravel untuk fitur "Remember Me"
            $table->timestamps(); // Membuat kolom created_at dan updated_at[cite: 5]
        });
    

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
