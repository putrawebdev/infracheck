<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        try {
            if (DB::getDriverName() === 'pgsql') {
                DB::statement("ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_status_check");
                DB::statement("ALTER TABLE reports ALTER COLUMN status TYPE VARCHAR(50)");
            }
        } catch (\Throwable $e) {
            // Ignore error if constraint does not exist
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op
    }
};
