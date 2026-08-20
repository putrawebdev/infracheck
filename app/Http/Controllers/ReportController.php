<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    // Fungsi untuk mengambil semua data laporan (untuk Peta Publik)
    public function index()
    {
        // Ambil semua data laporan dari database, diurutkan dari yang paling baru
        $reports = DB::table('reports')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $reports
        ], 200);
    }
    public function store(Request $request)
    {
        // 1. Validasi data
        $request->validate([
            'category' => 'required|string',
            'description' => 'required|string',
            'urgency' => 'required|in:low,medium,high,critical',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        // 2. Generate Tracking ID otomatis
        $trackingId = 'IC-' . date('Y') . '-' . strtoupper(Str::random(5));

        // 3. Generate Anonymous Token pelapor
        $userToken = (string) Str::uuid();

        // 4. Simpan ke Database
        $reportId = DB::table('reports')->insertGetId([
            'user_token' => $userToken,
            'category' => $request->category,
            'description' => $request->description,
            'urgency' => $request->urgency,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'photo_url' => 'https://dummyimage.com/600x400/000/fff&text=Foto+Menyusul', 
            'tracking_id' => $trackingId,
            'status' => 'new',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 5. Kembalikan respons ke frontend
        return response()->json([
            'message' => 'Laporan berhasil disubmit!',
            'tracking_id' => $trackingId,
            'report_id' => $reportId
        ], 201);
    }

    // Fungsi untuk melacak status laporan berdasarkan Tracking ID
    public function track($trackingId)
    {
        // Cari data laporan berdasarkan tracking_id
        $report = DB::table('reports')->where('tracking_id', $trackingId)->first();

        // Jika laporan tidak ditemukan, kembalikan pesan error 404
        if (!$report) {
            return response()->json([
                'success' => false,
                'message' => 'Tracking ID tidak ditemukan.'
            ], 404);
        }

        // Jika ketemu, kembalikan detail laporan tersebut
        return response()->json([
            'success' => true,
            'data' => $report
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

        // 3. Cek apakah token ini sudah pernah konfirmasi laporan ini sebelumnya (Mencegah Spam)
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
            'photo_url' => 'required|string', // Nanti berupa URL dari Cloudinary
            'caption' => 'nullable|string',   // Caption opsional
        ]);

        // 2. Cek apakah laporan utamanya ada
        $report = DB::table('reports')->where('id', $id)->first();
        if (!$report) {
            return response()->json(['message' => 'Laporan tidak ditemukan.'], 404);
        }

        // 3. Simpan foto kontribusi ke tabel report_photos
        DB::table('report_photos')->insert([
            'report_id' => $id,
            'user_token' => $request->user_token,
            'photo_url' => $request->photo_url,
            'caption' => $request->caption,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Foto bukti berhasil ditambahkan ke laporan!'
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

        // 4. Load tampilan PDF (kita akan buat filenya sesaat lagi)
        $pdf = Pdf::loadView('pdf.audit-report', $data);

        // 5. Download file PDF dengan nama sesuai Tracking ID
        return $pdf->download('Audit-Report-' . $report->tracking_id . '.pdf');
    }
}