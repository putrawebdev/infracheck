<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Services\ImageSecurityService;
use App\Services\TurnstileService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class ReportController extends Controller
{
    // Fungsi untuk mengambil semua data laporan (untuk Peta Publik & Admin)
    public function index(Request $request)
    {
        // Ambil semua data laporan aktif (tidak terhapus) dari database, diurutkan dari yang paling baru
        $query = DB::table('reports');
        if (Schema::hasColumn('reports', 'deleted_at')) {
            $query->whereNull('deleted_at');
        }
        $reports = $query->orderBy('created_at', 'desc')->get();
        $schemeAndHost = $request->getSchemeAndHttpHost();

        $reportIds = $reports->pluck('id')->toArray();
        $allPhotos = DB::table('report_photos')
            ->whereIn('report_id', $reportIds)
            ->orderBy('created_at', 'asc')
            ->get()
            ->groupBy('report_id');

        $reports = $reports->map(function ($report) use ($allPhotos) {
            $photos = $allPhotos->get($report->id, collect());
            $photoUrls = [];
            foreach ($photos as $p) {
                if (!empty($p->photo_url) && !str_contains($p->photo_url, 'dummyimage.com')) {
                    $photoUrls[] = $p->photo_url;
                }
            }

            // Clean primary photo_url if dummy or unsplash placeholder
            $realPhotos = array_values(array_filter($photoUrls, fn($u) => !str_contains($u, 'unsplash.com') && !str_contains($u, 'dummyimage.com')));

            $primaryPhoto = $report->photo_url;
            if (empty($primaryPhoto) || str_contains($primaryPhoto, 'dummyimage.com') || str_contains($primaryPhoto, 'unsplash.com')) {
                $primaryPhoto = !empty($realPhotos)
                    ? $realPhotos[0]
                    : (!empty($photoUrls) ? $photoUrls[0] : 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1000&q=80');
            }

            if (!empty($realPhotos)) {
                $photoUrls = $realPhotos;
                if (!in_array($primaryPhoto, $photoUrls)) {
                    array_unshift($photoUrls, $primaryPhoto);
                }
            } elseif (empty($photoUrls)) {
                $photoUrls = [$primaryPhoto];
            } elseif (!in_array($primaryPhoto, $photoUrls)) {
                array_unshift($photoUrls, $primaryPhoto);
            }

            $report->photo_url = $primaryPhoto;
            $report->images = array_values(array_unique($photoUrls));
            $report->photos = $photos;
            return $report;
        });

        return response()->json([
            'success' => true,
            'data' => $reports
        ], 200);
    }

    // Fungsi submit laporan baru
    public function store(Request $request)
    {
        // 1. Resolve category name if category_name or category is provided
        $categoryName = $request->input('category') ?? $request->input('category_name') ?? 'Jalan Berlubang';
        $locationAddress = $request->input('location_address') ?? $request->input('location') ?? null;

        // 2. Validasi proteksi bot nir-gesekan (Cloudflare Turnstile)
        $turnstileToken = $request->input('cf_turnstile_response') ?? $request->input('turnstile_token');
        if (!TurnstileService::verify($turnstileToken, $request->ip())) {
            return response()->json([
                'success' => false,
                'message' => 'Verifikasi bot gagal. Silakan muat ulang halaman dan coba kembali.',
            ], 422);
        }

        // 3. Batas Geofencing Regional (Default koordinat wilayah Indonesia)
        $minLat = (float) env('GEOFENCE_MIN_LAT', -11.0);
        $maxLat = (float) env('GEOFENCE_MAX_LAT', 6.5);
        $minLng = (float) env('GEOFENCE_MIN_LNG', 95.0);
        $maxLng = (float) env('GEOFENCE_MAX_LNG', 141.0);

        // 4. Validasi data
        $request->validate([
            'description' => 'required|string|min:5|max:5000',
            'urgency' => 'required|in:low,medium,high,critical',
            'latitude' => "required|numeric|between:{$minLat},{$maxLat}",
            'longitude' => "required|numeric|between:{$minLng},{$maxLng}",
            'images' => 'nullable',
            'images.*' => [
                'nullable',
                function ($attribute, $value, $fail) {
                    if (is_string($value)) {
                        if (!str_starts_with($value, '/storage/') && !filter_var($value, FILTER_VALIDATE_URL)) {
                            $fail('Format URL foto dalam daftar gambar tidak valid.');
                        }
                    } elseif ($value instanceof \Illuminate\Http\UploadedFile) {
                        $ext = strtolower($value->getClientOriginalExtension());
                        if (!in_array($ext, ['jpeg', 'jpg', 'png', 'webp'])) {
                            $fail('Format file gambar harus berupa jpeg, jpg, png, atau webp.');
                        }
                        if ($value->getSize() > 10240 * 1024) {
                            $fail('Ukuran file gambar melebihi 10MB.');
                        }
                    } else {
                        $fail('Item gambar tidak valid.');
                    }
                }
            ],
            'photo' => 'nullable|file|mimes:jpeg,jpg,png,webp|max:10240',
            'image' => 'nullable|file|mimes:jpeg,jpg,png,webp|max:10240',
            'photos.*' => [
                'nullable',
                function ($attribute, $value, $fail) {
                    if (is_string($value)) {
                        if (!str_starts_with($value, '/storage/') && !filter_var($value, FILTER_VALIDATE_URL)) {
                            $fail('Format URL foto dalam daftar gambar tidak valid.');
                        }
                    } elseif ($value instanceof \Illuminate\Http\UploadedFile) {
                        $ext = strtolower($value->getClientOriginalExtension());
                        if (!in_array($ext, ['jpeg', 'jpg', 'png', 'webp'])) {
                            $fail('Format file gambar harus berupa jpeg, jpg, png, atau webp.');
                        }
                        if ($value->getSize() > 10240 * 1024) {
                            $fail('Ukuran file gambar melebihi 10MB.');
                        }
                    } else {
                        $fail('Item gambar tidak valid.');
                    }
                }
            ],
            'photo_url' => [
                'nullable',
                'string',
                'max:2048',
                function ($attribute, $value, $fail) {
                    if (!empty($value) && !str_starts_with($value, '/storage/') && !filter_var($value, FILTER_VALIDATE_URL)) {
                        $fail('Format URL foto tidak valid.');
                    }
                },
            ],
        ], [
            'latitude.between' => 'Titik koordinat latitude berada di luar wilayah operasional yang didukung.',
            'longitude.between' => 'Titik koordinat longitude berada di luar wilayah operasional yang didukung.',
            'description.min' => 'Deskripsi laporan minimal berisi 5 karakter.',
        ]);

        // 3. Generate Tracking ID otomatis
        $trackingId = 'IC-' . date('Y') . '-' . strtoupper(Str::random(5));

        // 4. Generate Anonymous Token pelapor
        $userToken = (string) Str::uuid();

        // 5. Handle File Uploads & URLs
        $uploadedPhotoUrls = [];
        $schemeAndHost = $request->getSchemeAndHttpHost();

        // Check array of files: images / images[]
        if ($request->hasFile('images')) {
            $files = $request->file('images');
            if (!is_array($files)) {
                $files = [$files];
            }
            foreach ($files as $file) {
                if ($file && $file->isValid()) {
                    $path = ImageSecurityService::sanitizeAndStore($file, 'reports');
                    $uploadedPhotoUrls[] = '/storage/' . $path;
                }
            }
        } elseif ($request->hasFile('photos')) {
            $files = $request->file('photos');
            if (!is_array($files)) {
                $files = [$files];
            }
            foreach ($files as $file) {
                if ($file && $file->isValid()) {
                    $path = ImageSecurityService::sanitizeAndStore($file, 'reports');
                    $uploadedPhotoUrls[] = '/storage/' . $path;
                }
            }
        } elseif ($request->hasFile('photo')) {
            $file = $request->file('photo');
            if ($file && $file->isValid()) {
                $path = ImageSecurityService::sanitizeAndStore($file, 'reports');
                $uploadedPhotoUrls[] = '/storage/' . $path;
            }
        } elseif ($request->hasFile('image')) {
            $file = $request->file('image');
            if ($file && $file->isValid()) {
                $path = ImageSecurityService::sanitizeAndStore($file, 'reports');
                $uploadedPhotoUrls[] = '/storage/' . $path;
            }
        }

        // Check array of string URLs in images / photos input
        if ($request->filled('images') && is_array($request->images)) {
            foreach ($request->images as $img) {
                if (is_string($img) && (filter_var($img, FILTER_VALIDATE_URL) || str_starts_with($img, '/storage/'))) {
                    $uploadedPhotoUrls[] = $img;
                }
            }
        }

        // Check string photo_url only if not already collected
        if ($request->filled('photo_url') && is_string($request->photo_url) && !str_contains($request->photo_url, 'dummyimage.com')) {
            $cleanUrl = str_starts_with($request->photo_url, '/storage/') ? $schemeAndHost . $request->photo_url : $request->photo_url;
            if (!in_array($cleanUrl, $uploadedPhotoUrls, true)) {
                $uploadedPhotoUrls[] = $cleanUrl;
            }
        }

        $uploadedPhotoUrls = array_values(array_unique(array_filter($uploadedPhotoUrls)));

        // Fallback default image if none provided
        $defaultPhoto = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1000&q=80';
        $primaryPhotoUrl = !empty($uploadedPhotoUrls) ? $uploadedPhotoUrls[0] : $defaultPhoto;

        // 6. Simpan ke Database
        $reportId = DB::table('reports')->insertGetId([
            'user_token' => $userToken,
            'category' => $categoryName,
            'description' => $request->description,
            'urgency' => $request->urgency,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'location_address' => $locationAddress,
            'photo_url' => $primaryPhotoUrl, 
            'tracking_id' => $trackingId,
            'status' => 'new',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 7. Simpan semua foto ke tabel report_photos
        $savedPhotos = [];
        if (!empty($uploadedPhotoUrls)) {
            foreach ($uploadedPhotoUrls as $pUrl) {
                $photoId = DB::table('report_photos')->insertGetId([
                    'report_id' => $reportId,
                    'user_token' => $userToken,
                    'photo_url' => $pUrl,
                    'caption' => 'Foto Bukti Kerusakan',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $savedPhotos[] = [
                    'id' => $photoId,
                    'report_id' => $reportId,
                    'photo_url' => $pUrl,
                    'caption' => 'Foto Bukti Kerusakan',
                ];
            }
        }

        $imageUrls = !empty($uploadedPhotoUrls) ? $uploadedPhotoUrls : [$primaryPhotoUrl];

        // 8. Kembalikan respons ke frontend
        return response()->json([
            'success' => true,
            'message' => 'Laporan berhasil disubmit!',
            'tracking_id' => $trackingId,
            'report_id' => $reportId,
            'data' => [
                'id' => $reportId,
                'tracking_id' => $trackingId,
                'category' => $categoryName,
                'category_name' => $categoryName,
                'description' => $request->description,
                'urgency' => $request->urgency,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'location_address' => $locationAddress,
                'photo_url' => $primaryPhotoUrl,
                'images' => $imageUrls,
                'photos' => $savedPhotos,
                'confirmation_count' => 1,
                'status' => 'new',
                'created_at' => now()->toIso8601String(),
                'updated_at' => now()->toIso8601String(),
            ]
        ], 201);
    }

    // Fungsi untuk melacak status laporan berdasarkan Tracking ID
    public function track(Request $request, $trackingId)
    {
        // Cari data laporan aktif berdasarkan tracking_id
        $query = DB::table('reports')->where('tracking_id', $trackingId);
        if (Schema::hasColumn('reports', 'deleted_at')) {
            $query->whereNull('deleted_at');
        }
        $report = $query->first();

        // Jika laporan tidak ditemukan, kembalikan pesan error 404
        if (!$report) {
            return response()->json([
                'success' => false,
                'message' => 'Tracking ID tidak ditemukan.'
            ], 404);
        }

        // Jika ketemu, kembalikan detail laporan beserta fotonya
        $photos = DB::table('report_photos')->where('report_id', $report->id)->orderBy('created_at', 'asc')->get();
        $photoUrls = [];
        foreach ($photos as $p) {
            if (!empty($p->photo_url) && !str_contains($p->photo_url, 'dummyimage.com')) {
                $photoUrls[] = $p->photo_url;
            }
        }

        $realPhotos = array_values(array_filter($photoUrls, fn($u) => !str_contains($u, 'unsplash.com') && !str_contains($u, 'dummyimage.com')));

        $primaryPhoto = $report->photo_url;
        if (empty($primaryPhoto) || str_contains($primaryPhoto, 'dummyimage.com') || str_contains($primaryPhoto, 'unsplash.com')) {
            $primaryPhoto = !empty($realPhotos)
                ? $realPhotos[0]
                : (!empty($photoUrls) ? $photoUrls[0] : 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1000&q=80');
        }

        if (!empty($realPhotos)) {
            $photoUrls = $realPhotos;
            if (!in_array($primaryPhoto, $photoUrls)) {
                array_unshift($photoUrls, $primaryPhoto);
            }
        } elseif (empty($photoUrls)) {
            $photoUrls = [$primaryPhoto];
        } elseif (!in_array($primaryPhoto, $photoUrls)) {
            array_unshift($photoUrls, $primaryPhoto);
        }

        $report->photo_url = $primaryPhoto;
        $report->images = array_values(array_unique($photoUrls));
        $report->photos = $photos;

        return response()->json([
            'success' => true,
            'data' => $report,
            'photos' => $photos
        ], 200);
    }

    /**
     * Helper to safely find an active report by numeric ID or string tracking_id.
     * Prevents PostgreSQL fatal errors: SQLSTATE[22P02]: invalid input syntax for type bigint.
     */
    private function findReportSafely($id)
    {
        if (empty($id)) {
            return null;
        }

        $query = DB::table('reports');
        if (Schema::hasColumn('reports', 'deleted_at')) {
            $query->whereNull('deleted_at');
        }

        if (is_numeric($id)) {
            $report = (clone $query)->where('id', (int) $id)->first();
            if ($report) {
                return $report;
            }
        }

        // Search by tracking_id
        return (clone $query)->where('tracking_id', (string) $id)->first();
    }

    // Fungsi untuk mengambil detail 1 laporan berdasarkan ID (untuk Admin Detail Report)
    public function show(Request $request, $id)
    {
        $report = $this->findReportSafely($id);

        if (!$report) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan tidak ditemukan.'
            ], 404);
        }

        $photos = DB::table('report_photos')->where('report_id', $report->id)->orderBy('created_at', 'asc')->get();
        $photoUrls = [];
        foreach ($photos as $p) {
            if (!empty($p->photo_url) && !str_contains($p->photo_url, 'dummyimage.com')) {
                $photoUrls[] = $p->photo_url;
            }
        }

        $realPhotos = array_values(array_filter($photoUrls, fn($u) => !str_contains($u, 'unsplash.com') && !str_contains($u, 'dummyimage.com')));

        $primaryPhoto = $report->photo_url;
        if (empty($primaryPhoto) || str_contains($primaryPhoto, 'dummyimage.com') || str_contains($primaryPhoto, 'unsplash.com')) {
            $primaryPhoto = !empty($realPhotos)
                ? $realPhotos[0]
                : (!empty($photoUrls) ? $photoUrls[0] : 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1000&q=80');
        }

        if (!empty($realPhotos)) {
            $photoUrls = $realPhotos;
            if (!in_array($primaryPhoto, $photoUrls)) {
                array_unshift($photoUrls, $primaryPhoto);
            }
        } elseif (empty($photoUrls)) {
            $photoUrls = [$primaryPhoto];
        } elseif (!in_array($primaryPhoto, $photoUrls)) {
            array_unshift($photoUrls, $primaryPhoto);
        }

        $report->photo_url = $primaryPhoto;
        $report->images = array_values(array_unique($photoUrls));
        $report->photos = $photos;

        return response()->json([
            'success' => true,
            'data' => $report,
            'photos' => $photos
        ], 200);
    }

    // Fungsi untuk menambah konfirmasi "Saya Juga Merasakan Ini"
    public function confirm(Request $request, $id)
    {
        // 1. Validasi token anonim yang dikirim dari frontend (localStorage browser warga)
        $request->validate([
            'user_token' => 'required|string',
        ]);

        $userToken = $request->user_token;
        $ipAddress = $request->ip();

        // 2. Cek apakah laporan dengan ID atau tracking_id tersebut benar-benar ada
        $report = $this->findReportSafely($id);
        if (!$report) {
            return response()->json(['message' => 'Laporan tidak ditemukan.'], 404);
        }

        // 3. Cek apakah token ini sudah pernah konfirmasi laporan ini sebelumnya (Mencegah Spam Client)
        $existingConfirmation = DB::table('report_confirmations')
            ->where('report_id', $report->id)
            ->where('user_token', $userToken)
            ->first();

        if ($existingConfirmation) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah pernah mengkonfirmasi laporan ini sebelumnya.'
            ], 400);
        }

        // 4. Pembatasan Anti-Sybil Flood: Cek apakah IP jaringan ini sudah pernah konfirmasi dalam 24 jam terakhir
        $recentIpConfirmation = DB::table('report_confirmations')
            ->where('report_id', $report->id)
            ->where('ip_address', $ipAddress)
            ->where('created_at', '>=', now()->subHours(24))
            ->first();

        if ($recentIpConfirmation) {
            return response()->json([
                'success' => false,
                'message' => 'Alamat jaringan Anda telah mengonfirmasi laporan ini dalam 24 jam terakhir. Silakan coba kembali nanti.'
            ], 429);
        }

        // 4. Simpan data konfirmasi ke tabel report_confirmations
        DB::table('report_confirmations')->insert([
            'report_id' => $report->id,
            'user_token' => $userToken,
            'ip_address' => $ipAddress,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 5. Otomatis tambahkan +1 ke kolom confirmation_count di tabel reports
        DB::table('reports')->where('id', $report->id)->increment('confirmation_count');

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengkonfirmasi laporan!'
        ], 200);
    }

    // Fungsi untuk menambahkan foto bukti kontribusi warga
    public function addPhoto(Request $request, $id)
    {
        // 1. Validasi input dari frontend
        $request->validate([
            'user_token' => 'required|string',
            'caption' => 'nullable|string|max:255',
            'photo' => 'nullable|file|mimes:jpeg,jpg,png,webp|max:10240',
            'image' => 'nullable|file|mimes:jpeg,jpg,png,webp|max:10240',
            'images' => 'nullable',
            'images.*' => [
                'nullable',
                function ($attribute, $value, $fail) {
                    if (is_string($value)) {
                        if (!str_starts_with($value, '/storage/') && !filter_var($value, FILTER_VALIDATE_URL)) {
                            $fail('Format URL foto dalam daftar gambar tidak valid.');
                        }
                    } elseif ($value instanceof \Illuminate\Http\UploadedFile) {
                        $ext = strtolower($value->getClientOriginalExtension());
                        if (!in_array($ext, ['jpeg', 'jpg', 'png', 'webp'])) {
                            $fail('Format file gambar harus berupa jpeg, jpg, png, atau webp.');
                        }
                        if ($value->getSize() > 10240 * 1024) {
                            $fail('Ukuran file gambar melebihi 10MB.');
                        }
                    } else {
                        $fail('Item gambar tidak valid.');
                    }
                }
            ],
            'photo_url' => [
                'nullable',
                'string',
                'max:2048',
                function ($attribute, $value, $fail) {
                    if (!empty($value) && !str_starts_with($value, '/storage/') && !filter_var($value, FILTER_VALIDATE_URL)) {
                        $fail('Format URL foto tidak valid.');
                    }
                },
            ],
        ]);

        // 2. Cek apakah laporan utamanya ada
        $report = $this->findReportSafely($id);
        if (!$report) {
            return response()->json(['message' => 'Laporan tidak ditemukan.'], 404);
        }

        $photoUrl = null;
        $schemeAndHost = $request->getSchemeAndHttpHost();

        // Check if file is uploaded
        if ($request->hasFile('photo')) {
            $path = ImageSecurityService::sanitizeAndStore($request->file('photo'), 'reports');
            $photoUrl = $schemeAndHost . '/storage/' . $path;
        } elseif ($request->hasFile('image')) {
            $path = ImageSecurityService::sanitizeAndStore($request->file('image'), 'reports');
            $photoUrl = $schemeAndHost . '/storage/' . $path;
        } elseif ($request->hasFile('images')) {
            $files = $request->file('images');
            $file = is_array($files) ? $files[0] : $files;
            if ($file && $file->isValid()) {
                $path = ImageSecurityService::sanitizeAndStore($file, 'reports');
                $photoUrl = $schemeAndHost . '/storage/' . $path;
            }
        } elseif ($request->filled('photo_url')) {
            $photoUrl = $request->photo_url;
        }

        if (!$photoUrl) {
            return response()->json([
                'success' => false,
                'message' => 'File foto atau URL gambar wajib disertakan.'
            ], 422);
        }

        // 3. Simpan foto kontribusi ke tabel report_photos
        DB::table('report_photos')->insert([
            'report_id' => $report->id,
            'user_token' => $request->user_token,
            'photo_url' => $photoUrl,
            'caption' => $request->caption ?? 'Bukti Tambahan Warga',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // If report's main photo was a dummy or unsplash placeholder, update it with this real photo
        if (empty($report->photo_url) || str_contains($report->photo_url, 'dummyimage.com') || str_contains($report->photo_url, 'unsplash.com')) {
            DB::table('reports')->where('id', $report->id)->update([
                'photo_url' => $photoUrl,
                'updated_at' => now(),
            ]);
        }

        $allPhotos = DB::table('report_photos')->where('report_id', $report->id)->get();

        return response()->json([
            'success' => true,
            'message' => 'Foto bukti berhasil ditambahkan ke laporan!',
            'photo_url' => $photoUrl,
            'photos' => $allPhotos,
        ], 201);
    }

    // Fungsi untuk admin mengubah status penanganan laporan
    public function updateStatus(Request $request, $id)
    {
        // 1. Validasi status baru yang dikirim admin (new, processing, done, rejected)
        $request->validate([
            'status' => 'required|in:new,processing,done,rejected',
        ]);

        // 2. Cek apakah laporan ada
        $report = $this->findReportSafely($id);
        if (!$report) {
            return response()->json(['message' => 'Laporan tidak ditemukan.'], 404);
        }

        // 3. Update status di database dengan safe fallback untuk constraint database
        try {
            DB::table('reports')->where('id', $report->id)->update([
                'status' => $request->status,
                'updated_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // Jika kolom status di PostgreSQL memiliki check constraint enum lama (new, processing, done),
            // lepaskan check constraint secara dinamis agar 'rejected' dapat disimpan.
            try {
                DB::statement("ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_status_check");
                DB::statement("ALTER TABLE reports ALTER COLUMN status TYPE VARCHAR(50)");
                DB::table('reports')->where('id', $report->id)->update([
                    'status' => $request->status,
                    'updated_at' => now(),
                ]);
            } catch (\Throwable $ex) {
                Log::error('Gagal memperbarui status laporan: ' . $ex->getMessage());
                throw $e;
            }
        }

        // 4. Catat riwayat perubahan ke tabel audit_logs untuk jejak audit
        try {
            if (Schema::hasTable('audit_logs')) {
                DB::table('audit_logs')->insert([
                    'user_id' => $request->user()?->id,
                    'action' => 'UPDATE_REPORT_STATUS',
                    'entity_type' => 'report',
                    'entity_id' => $report->id,
                    'details' => json_encode([
                        'tracking_id' => $report->tracking_id,
                        'old_status' => $report->status,
                        'new_status' => $request->status,
                    ]),
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('Audit log write failed on update status: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Status laporan berhasil diperbarui!',
            'status' => $request->status,
            'new_status' => $request->status,
            'data' => [
                'id' => $report->id,
                'status' => $request->status,
                'note' => $request->note ?? $request->admin_note ?? '',
            ],
        ], 200);
    }
    
    /**
     * Helper to safely convert an image (local storage file, WebP, or remote Cloudinary/Unsplash)
     * into a compact base64 JPEG data URI so DomPDF can render it safely without out-of-memory or CDN block issues.
     */
    private function convertImageToBase64DataUri(?string $url): ?string
    {
        if (empty($url) || !is_string($url) || str_contains($url, 'dummyimage.com')) {
            return null;
        }

        // Already a data URI
        if (str_starts_with($url, 'data:image/')) {
            return $url;
        }

        try {
            $rawContent = null;
            $parsedPath = parse_url($url, PHP_URL_PATH) ?: $url;
            $filename = basename($parsedPath);
            $relativePath = 'reports/' . $filename;

            // 1. Try Laravel Storage Disk 'public'
            try {
                if (\Illuminate\Support\Facades\Storage::disk('public')->exists($relativePath)) {
                    $rawContent = \Illuminate\Support\Facades\Storage::disk('public')->get($relativePath);
                } elseif (\Illuminate\Support\Facades\Storage::disk('public')->exists($filename)) {
                    $rawContent = \Illuminate\Support\Facades\Storage::disk('public')->get($filename);
                }
            } catch (\Throwable) {}

            // 2. Direct filesystem lookup candidates
            if (empty($rawContent)) {
                $candidates = array_filter([
                    storage_path('app/public/reports/' . $filename),
                    public_path('storage/reports/' . $filename),
                    storage_path('app/public/' . $filename),
                    public_path('storage/' . $filename),
                    public_path(ltrim($parsedPath, '/')),
                ]);

                foreach ($candidates as $candidate) {
                    if (@file_exists($candidate) && @is_file($candidate)) {
                        $rawContent = @file_get_contents($candidate);
                        if (!empty($rawContent)) {
                            break;
                        }
                    }
                }
            }

            // 3. Fallback: Fetch via HTTP (supports Cloudinary, external URLs, and local app URL)
            if (empty($rawContent)) {
                $fetchUrl = $url;
                if (!filter_var($fetchUrl, FILTER_VALIDATE_URL)) {
                    $base = env('APP_URL') ?: (request() ? request()->getSchemeAndHttpHost() : 'https://infracheck-production.up.railway.app');
                    $fetchUrl = rtrim($base, '/') . '/' . ltrim($parsedPath, '/');
                }

                if (filter_var($fetchUrl, FILTER_VALIDATE_URL)) {
                    try {
                        $response = \Illuminate\Support\Facades\Http::timeout(6)
                            ->withoutVerifying()
                            ->withHeaders(['User-Agent' => 'Mozilla/5.0 InfraCheck/1.0'])
                            ->get($fetchUrl);
                        if ($response->successful()) {
                            $rawContent = $response->body();
                        }
                    } catch (\Throwable) {
                        $ctx = stream_context_create([
                            'http' => ['timeout' => 5, 'ignore_errors' => true, 'header' => "User-Agent: Mozilla/5.0 InfraCheck/1.0\r\n"],
                            'ssl'  => ['verify_peer' => false, 'verify_peer_name' => false],
                        ]);
                        $rawContent = @file_get_contents($fetchUrl, false, $ctx);
                    }
                }
            }

            if (empty($rawContent)) {
                return null;
            }

            // 4. Decode with GD (handles both standard formats and WebP)
            if (function_exists('imagecreatefromstring') && function_exists('imagejpeg')) {
                $gdImage = @imagecreatefromstring($rawContent);

                // If imagecreatefromstring failed (common for WebP on some GD versions), try imagecreatefromwebp
                if (!$gdImage && function_exists('imagecreatefromwebp')) {
                    $tmpFile = tempnam(sys_get_temp_dir(), 'pdf_img_');
                    if ($tmpFile) {
                        file_put_contents($tmpFile, $rawContent);
                        $gdImage = @imagecreatefromwebp($tmpFile);
                        @unlink($tmpFile);
                    }
                }

                if ($gdImage) {
                    $origWidth = imagesx($gdImage);
                    $origHeight = imagesy($gdImage);
                    $maxWidth = 700;

                    if ($origWidth > $maxWidth && $origHeight > 0) {
                        $newWidth = $maxWidth;
                        $newHeight = (int) ($origHeight * ($maxWidth / $origWidth));
                        $resized = imagecreatetruecolor($newWidth, $newHeight);
                        imagecopyresampled($resized, $gdImage, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);
                        imagedestroy($gdImage);
                        $gdImage = $resized;
                    }

                    ob_start();
                    imagejpeg($gdImage, null, 80);
                    $jpegContent = ob_get_clean();
                    imagedestroy($gdImage);

                    if (!empty($jpegContent)) {
                        return 'data:image/jpeg;base64,' . base64_encode($jpegContent);
                    }
                }
            }

            // Fallback for standard supported image types if GD is unavailable
            $mimeType = null;
            if (class_exists('\finfo')) {
                $finfo = new \finfo(FILEINFO_MIME_TYPE);
                $mimeType = $finfo->buffer($rawContent) ?: null;
            }
            if ($mimeType && in_array($mimeType, ['image/jpeg', 'image/png', 'image/gif'], true)) {
                return 'data:' . $mimeType . ';base64,' . base64_encode($rawContent);
            }

            return null;
        } catch (\Throwable $e) {
            Log::warning('PDF image conversion failed: ' . $e->getMessage());
            return null;
        }
    }

    // Fungsi untuk generate & download PDF audit laporan
    public function generatePdf($id)
    {
        try {
            @ini_set('memory_limit', '512M');
            @set_time_limit(60);

            // 1. Ambil data laporan utama berdasarkan ID atau tracking_id secara aman (Anti-Type Error Postgres)
            $report = $this->findReportSafely($id);
            if (!$report) {
                // Fallback jika id adalah string umum seperti 'audit-summary'
                $report = DB::table('reports')
                    ->when(Schema::hasColumn('reports', 'deleted_at'), fn($q) => $q->whereNull('deleted_at'))
                    ->orderBy('created_at', 'desc')
                    ->first();
            }
            if (!$report) {
                return response()->json(['message' => 'Laporan tidak ditemukan.'], 404);
            }

            // 2. Ambil seluruh foto kontribusi tambahan dari warga
            $photos = DB::table('report_photos')->where('report_id', $report->id)->get();

            // 3. Tentukan foto utama
            $mainPhotoUrl = $report->photo_url;
            if ((empty($mainPhotoUrl) || str_contains($mainPhotoUrl, 'unsplash.com') || str_contains($mainPhotoUrl, 'dummyimage.com')) && $photos->isNotEmpty()) {
                $mainPhotoUrl = $photos->first()->photo_url;
            }

            $mainPhotoDataUri = $this->convertImageToBase64DataUri($mainPhotoUrl);

            $sanitizedPhotos = [];
            foreach ($photos as $photo) {
                // Hindari duplikasi foto utama
                if (!empty($photo->photo_url) && (
                    $photo->photo_url === $mainPhotoUrl ||
                    basename($photo->photo_url) === basename($mainPhotoUrl)
                )) {
                    continue;
                }
                $dataUri = $this->convertImageToBase64DataUri($photo->photo_url ?? null);
                if ($dataUri) {
                    $sanitizedPhotos[] = [
                        'src' => $dataUri,
                        'caption' => $photo->caption ?? 'Bukti Tambahan Warga',
                    ];
                }
            }

            // Jika main photo gagal di-convert tapi ada foto di sanitizedPhotos, jadikan yang pertama sebagai main photo
            if (empty($mainPhotoDataUri) && !empty($sanitizedPhotos)) {
                $first = array_shift($sanitizedPhotos);
                $mainPhotoDataUri = $first['src'];
            }

            // 4. Siapkan data yang akan dikirim ke tampilan PDF
            $data = [
                'report' => $report,
                'mainPhoto' => $mainPhotoDataUri,
                'photos' => $sanitizedPhotos,
            ];

            // 5. Pastikan folder cache font DomPDF ada dan dapat ditulis
            $fontDir = storage_path('fonts');
            if (!file_exists($fontDir)) {
                @mkdir($fontDir, 0755, true);
            }

            // 6. Load tampilan PDF dengan opsi isolasi & direktori font aman
            $pdf = Pdf::loadView('pdf.audit-report', $data)
                ->setPaper('a4', 'portrait')
                ->setOptions([
                    'isRemoteEnabled' => true,
                    'isPhpEnabled' => false,
                    'isJavascriptEnabled' => false,
                    'fontDir' => $fontDir,
                    'fontCache' => $fontDir,
                    'tempDir' => sys_get_temp_dir(),
                    'chroot' => array_filter([
                        realpath(base_path('public')),
                        realpath(storage_path('app/public')),
                        realpath(storage_path()),
                    ]),
                ]);

            // 7. Sanitasi nama file output untuk mencegah Header Injection
            $safeTrackingId = preg_replace('/[^A-Za-z0-9_-]/', '', $report->tracking_id);
            $filename = 'Audit-Report-' . ($safeTrackingId ?: $report->id) . '.pdf';

            // 8. Download file PDF dengan nama aman
            return $pdf->download($filename);
        } catch (\Throwable $e) {
            Log::error('PDF generation error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat dokumen PDF audit: ' . $e->getMessage(),
            ], 500);
        }
    }

    // Fungsi untuk admin menghapus laporan yang statusnya sudah Selesai (Done)
    public function destroy(Request $request, $id)
    {
        $report = $this->findReportSafely($id);

        if (!$report) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan tidak ditemukan.'
            ], 404);
        }

        // Pastikan laporan hanya dapat dihapus jika statusnya sudah selesai (done)
        $status = strtolower(trim($report->status));
        if ($status !== 'done' && $status !== 'selesai') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya laporan dengan status Selesai yang dapat dihapus dari sistem.'
            ], 422);
        }

        $adminId = $request->user()?->id;

        // Simpan data snapshot laporan untuk bukti jejak audit sebelum ditandai terhapus
        $reportSnapshot = [
            'tracking_id' => $report->tracking_id,
            'category' => $report->category,
            'status' => $report->status,
            'description' => $report->description,
            'latitude' => $report->latitude,
            'longitude' => $report->longitude,
            'confirmation_count' => $report->confirmation_count ?? 1,
            'created_at' => $report->created_at,
        ];

        // Lakukan Soft Delete jika kolom deleted_at tersedia, fallback ke hard delete jika belum dimigrasi
        if (Schema::hasColumn('reports', 'deleted_at')) {
            DB::table('reports')->where('id', $report->id)->update([
                'deleted_at' => now(),
                'deleted_by' => $adminId,
                'updated_at' => now(),
            ]);
        } else {
            // Hapus file fisik dari storage jika fallback ke hard delete
            $photos = DB::table('report_photos')->where('report_id', $report->id)->get();
            foreach ($photos as $p) {
                if (!empty($p->photo_url) && str_contains($p->photo_url, '/storage/reports/')) {
                    $relPath = 'reports/' . basename($p->photo_url);
                    Storage::disk('public')->delete($relPath);
                }
            }
            if (!empty($report->photo_url) && str_contains($report->photo_url, '/storage/reports/')) {
                $relPath = 'reports/' . basename($report->photo_url);
                Storage::disk('public')->delete($relPath);
            }

            // Hapus relasi data
            DB::table('report_photos')->where('report_id', $report->id)->delete();
            DB::table('report_confirmations')->where('report_id', $report->id)->delete();
            DB::table('reports')->where('id', $report->id)->delete();
        }

        // Catat ke tabel audit_logs untuk akuntabilitas publik
        try {
            if (Schema::hasTable('audit_logs')) {
                DB::table('audit_logs')->insert([
                    'user_id' => $adminId,
                    'action' => 'DELETE_REPORT',
                    'entity_type' => 'report',
                    'entity_id' => $report->id,
                    'details' => json_encode($reportSnapshot),
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('Audit log write failed on delete report: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Laporan berhasil dihapus dari sistem (Soft Delete terproteksi jejak audit).'
        ], 200);
    }
}