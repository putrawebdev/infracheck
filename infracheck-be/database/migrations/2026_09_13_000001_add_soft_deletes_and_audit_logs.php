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
        // 1. Tambahkan kolom SoftDeletes dan deleted_by pada tabel reports jika belum ada
        if (Schema::hasTable('reports') && !Schema::hasColumn('reports', 'deleted_at')) {
            Schema::table('reports', function (Blueprint $table) {
                $table->softDeletes()->after('status');
                $table->unsignedBigInteger('deleted_by')->nullable()->after('deleted_at');
                $table->index('deleted_at');
            });
        }

        // 2. Buat tabel audit_logs untuk jejak audit aksi administratif
        if (!Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('action', 100);
                $table->string('entity_type', 50)->nullable();
                $table->unsignedBigInteger('entity_id')->nullable();
                $table->json('details')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->timestamps();

                $table->index(['entity_type', 'entity_id']);
                $table->index('user_id');
                $table->index('action');
                $table->index('created_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('reports') && Schema::hasColumn('reports', 'deleted_at')) {
            Schema::table('reports', function (Blueprint $table) {
                $table->dropIndex(['deleted_at']);
                $table->dropSoftDeletes();
                $table->dropColumn('deleted_by');
            });
        }

        Schema::dropIfExists('audit_logs');
    }
};
