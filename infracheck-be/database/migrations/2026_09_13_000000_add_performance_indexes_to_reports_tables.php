<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds high-performance indexes for sorting, filtering, and spatial queries
     * on the reports, report_photos, and report_confirmations tables.
     */
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            // Index for status filtering (new, processing, done)
            $table->index('status', 'reports_status_index');

            // Index for urgency sorting & filtering (critical, high, medium, low)
            $table->index('urgency', 'reports_urgency_index');

            // Index for category filtering
            $table->index('category', 'reports_category_index');

            // Index for timeline ordering (created_at DESC)
            $table->index('created_at', 'reports_created_at_index');

            // Index for citizen user token lookup
            $table->index('user_token', 'reports_user_token_index');

            // Composite index for geographical coordinate queries
            $table->index(['latitude', 'longitude'], 'reports_geo_lat_lng_index');
        });

        Schema::table('report_photos', function (Blueprint $table) {
            // Index for photo timeline ordering
            $table->index('created_at', 'report_photos_created_at_index');
        });

        Schema::table('report_confirmations', function (Blueprint $table) {
            // Index for confirmation timeline ordering
            $table->index('created_at', 'report_confirmations_created_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            $table->dropIndex('reports_status_index');
            $table->dropIndex('reports_urgency_index');
            $table->dropIndex('reports_category_index');
            $table->dropIndex('reports_created_at_index');
            $table->dropIndex('reports_user_token_index');
            $table->dropIndex('reports_geo_lat_lng_index');
        });

        Schema::table('report_photos', function (Blueprint $table) {
            $table->dropIndex('report_photos_created_at_index');
        });

        Schema::table('report_confirmations', function (Blueprint $table) {
            $table->dropIndex('report_confirmations_created_at_index');
        });
    }
};
