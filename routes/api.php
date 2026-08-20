<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

use App\Http\Controllers\ReportController;
// Jalur untuk submit laporan baru
Route::post('/reports', [ReportController::class, 'store']);
// Jalur untuk mengambil semua data laporan (untuk peta)
Route::get('/reports', [ReportController::class, 'index']);
// Jalur untuk cek status laporan via Tracking ID
Route::get('/reports/track/{trackingId}', [ReportController::class, 'track']);
// Jalur untuk konfirmasi laporan
Route::post('/reports/{id}/confirm', [ReportController::class, 'confirm']);
// Jalur untuk kontribusi foto bukti
Route::post('/reports/{id}/photos', [ReportController::class, 'addPhoto']);
// Jalur untuk update status oleh admin
Route::patch('/reports/{id}/status', [ReportController::class, 'updateStatus']);
// Jalur untuk generate & download PDF audit
Route::get('/reports/{id}/pdf', [ReportController::class, 'generatePdf']);