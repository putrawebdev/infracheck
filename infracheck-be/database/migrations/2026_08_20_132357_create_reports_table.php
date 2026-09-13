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
        Schema::create('reports', function (Blueprint $table) {
            $table->id(); // Membuat kolom id dengan tipe bigint PK dan auto increment[cite: 1]
            $table->string('user_token'); // Kolom untuk menyimpan token anonim pelapor[cite: 1]
            $table->string('category'); // Menyimpan tipe infrastruktur seperti jalan, jembatan, dll[cite: 1]
            $table->text('description'); // Menyimpan deskripsi kondisi secara lengkap[cite: 1]
            $table->enum('urgency', ['low', 'medium', 'high', 'critical']); // Opsi tingkat urgensi[cite: 1]
            $table->decimal('latitude', 10, 8); // Format koordinat GPS latitude[cite: 1]
            $table->decimal('longitude', 11, 8); // Format koordinat GPS longitude[cite: 1]
            $table->string('location_address')->nullable(); // Alamat tekstual yang boleh kosong[cite: 1]
            $table->string('photo_url'); // Menyimpan URL foto utama dari Cloudinary[cite: 1]
            $table->string('tracking_id')->unique(); // ID unik pelacakan, contoh: IC-2026-00042[cite: 1]
            $table->integer('confirmation_count')->default(1); // Set default ke 1 karena pelapor sudah dihitung[cite: 1]
            $table->enum('status', ['new', 'processing', 'done'])->default('new'); // Status awal selalu 'new'[cite: 1]
            $table->timestamps(); // Otomatis membuat kolom created_at dan updated_at[cite: 1]
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
