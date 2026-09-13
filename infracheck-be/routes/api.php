<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ReportController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/
// Proteksi anti brute-force login (maksimal 5 percobaan per menit per IP)
Route::middleware('throttle:5,1')->post('/auth/login', [AuthController::class, 'login']);

// Rute sesi terautentikasi umum
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

// Rute Backoffice & Mutasi Data Terproteksi RBAC (Khusus role admin/superadmin)
Route::middleware(['auth:sanctum', 'role:admin,superadmin'])->group(function () {
    // Admin Profile & Settings
    Route::get('/admin/profile', [AuthController::class, 'getProfile']);
    Route::put('/admin/profile', [AuthController::class, 'updateProfile']);
    Route::put('/admin/password', [AuthController::class, 'updatePassword']);

    // Admin Category Management (authenticated & authorized)
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    // Admin Report Management (authenticated & authorized)
    Route::delete('/reports/{id}', [ReportController::class, 'destroy']);
    Route::patch('/reports/{id}/status', [ReportController::class, 'updateStatus']);
});

/*
|--------------------------------------------------------------------------
| Public & Submission Routes with Anti-Abuse Rate Limiting (Throttle)
|--------------------------------------------------------------------------
*/

// Submit laporan baru (maks 10 submit per 10 menit per IP)
Route::middleware('throttle:10,10')->post('/reports', [ReportController::class, 'store']);

// Konfirmasi dukungan warga (maks 15 per menit per IP)
Route::middleware('throttle:15,1')->post('/reports/{id}/confirm', [ReportController::class, 'confirm']);

// Kontribusi foto bukti tambahan (maks 15 upload per menit per IP)
Route::middleware('throttle:15,1')->post('/reports/{id}/photos', [ReportController::class, 'addPhoto']);

// Public Read & Download Routes (maks 120 per menit)
Route::middleware('throttle:120,1')->group(function () {
    // Mengambil daftar kategori infrastruktur publik (untuk form laporan & admin)
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{id}', [CategoryController::class, 'show']);

    // Mengambil semua data laporan (untuk peta publik & admin)
    Route::get('/reports', [ReportController::class, 'index']);

    // Mengambil detail laporan berdasarkan ID (untuk admin detail & audit)
    Route::get('/reports/{id}', [ReportController::class, 'show']);

    // Cek status laporan via Tracking ID
    Route::get('/reports/track/{trackingId}', [ReportController::class, 'track']);

    // Generate & download PDF audit
    Route::get('/reports/{id}/pdf', [ReportController::class, 'generatePdf']);
});