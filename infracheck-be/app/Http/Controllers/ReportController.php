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

            // Clean primary photo_url if dummy
            $primaryPhoto = $report->photo_url;
            if (empty($primaryPhoto) || str_contains($primaryPhoto, 'dummyimage.com')) {
                $primaryPhoto = !empty($photoUrls)
                    ? $photoUrls[0]
                    : 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1000&q=80';
            }

            if (empty($photoUrls)) {
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

        $primaryPhoto = $report->photo_url;
        if (empty($primaryPhoto) || str_contains($primaryPhoto, 'dummyimage.com')) {
            $primaryPhoto = !empty($photoUrls)
                ? $photoUrls[0]
                : 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1000&q=80';
        }

        if (empty($photoUrls)) {
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

    // Fungsi untuk mengambil detail 1 laporan berdasarkan ID (untuk Admin Detail Report)
    public function show(Request $request, $id)
    {
        $query = DB::table('reports')->where('id', $id);
        if (Schema::hasColumn('reports', 'deleted_at')) {
            $query->whereNull('deleted_at');
        }
        $report = $query->first();

        if (!$report) {
            $query2 = DB::table('reports')->where('tracking_id', $id);
            if (Schema::hasColumn('reports', 'deleted_at')) {
                $query2->whereNull('deleted_at');
            }
            $report = $query2->first();
        }

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

        $primaryPhoto = $report->photo_url;
        if (empty($primaryPhoto) || str_contains($primaryPhoto, 'dummyimage.com')) {
            $primaryPhoto = !empty($photoUrls)
                ? $photoUrls[0]
                : 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1000&q=80';
        }

        if (empty($photoUrls)) {
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

        // 2. Cek apakah laporan dengan ID tersebut benar-benar ada
        $report = DB::table('reports')->where('id', $id)->first();
        if (!$report) {
            return response()->json(['message' => 'Laporan tidak ditemukan.'], 404);
        }

        // 3. Cek apakah token ini sudah pernah konfirmasi laporan ini sebelumnya (Mencegah Spam Client)
        $existingConfirmation = DB::table('report_confirmations')
            ->where('report_id', $id)
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
            ->where('report_id', $id)
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
            'report_id' => $id,
            'user_token' => $userToken,
            'ip_address' => $ipAddress,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 5. Otomatis tambahkan +1 ke kolom confirmation_count di tabel reports
        DB::table('reports')->where('id', $id)->increment('confirmation_count');

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
        $report = DB::table('reports')->where('id', $id)->first();
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
            'report_id' => $id,
            'user_token' => $request->user_token,
            'photo_url' => $photoUrl,
            'caption' => $request->caption ?? 'Bukti Tambahan Warga',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // If report's main photo was a dummy placeholder, update it with this real photo
        if (empty($report->photo_url) || str_contains($report->photo_url, 'dummyimage.com')) {
            DB::table('reports')->where('id', $id)->update([
                'photo_url' => $photoUrl,
                'updated_at' => now(),
            ]);
        }

        $allPhotos = DB::table('report_photos')->where('report_id', $id)->get();

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
        // 1. Validasi status baru yang dikirim admin
        $request->validate([
            'status' => 'required|in:new,processing,done',
        ]);

        // 2. Cek apakah laporan ada
        $report = DB::table('reports')->where('id', $id)->first();
        if (!$report) {
            return response()->json(['message' => 'Laporan tidak ditemukan.'], 404);
        }

        // 3. Update status di database
        DB::table('reports')->where('id', $id)->update([
            'status' => $request->status,
            'updated_at' => now(),
        ]);

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
            'new_status' => $request->status
        ], 200);
    }
    
    // Fungsi untuk generate & download PDF audit laporan
    public function generatePdf($id)
    {
        // 1. Ambil data laporan utama berdasarkan ID
        $report = DB::table('reports')->where('id', $id)->first();
        if (!$report) {
            return response()->json(['message' => 'Laporan tidak ditemukan.'], 404);
        }

        // 2. Ambil seluruh foto kontribusi tambahan dari warga
        $photos = DB::table('report_photos')->where('report_id', $id)->get();

        // 3. Siapkan data yang akan dikirim ke tampilan PDF
        $data = [
            'report' => $report,
            'photos' => $photos
        ];

        // 4. Load tampilan PDF dengan opsi keamanan isolasi ketat (Anti-SSRF & Anti-Execution)
        $pdf = Pdf::loadView('pdf.audit-report', $data)
            ->setOption('isRemoteEnabled', false)
            ->setOption('isPhpEnabled', false)
            ->setOption('isJavascriptEnabled', false)
            ->setOption('chroot', array_filter([
                realpath(base_path('public')),
                realpath(storage_path('app/public')),
            ]));

        // 5. Sanitasi nama file output untuk mencegah Header Injection
        $safeTrackingId = preg_replace('/[^A-Za-z0-9_-]/', '', $report->tracking_id);

        // 6. Download file PDF dengan nama aman
        return $pdf->download('Audit-Report-' . ($safeTrackingId ?: $report->id) . '.pdf');
    }

    // Fungsi untuk admin menghapus laporan yang statusnya sudah Selesai (Done)
    public function destroy(Request $request, $id)
    {
        $report = DB::table('reports')->where('id', $id)->first();
        if (!$report) {
            $report = DB::table('reports')->where('tracking_id', $id)->first();
        }

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