<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Dokumen Audit InfraCheck</title>
    <style>
        body { font-family: sans-serif; font-size: 13px; color: #1e293b; line-height: 1.6; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
        .title { font-size: 20px; font-weight: bold; color: #0f172a; letter-spacing: 0.5px; }
        .tagline { font-size: 11px; color: #64748b; margin-top: 4px; }
        .section { margin-bottom: 18px; }
        .label { font-weight: bold; width: 160px; display: inline-block; color: #334155; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .info-table td { padding: 6px 4px; vertical-align: top; }
        .photo-box { margin-top: 8px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; background: #f8fafc; display: inline-block; max-width: 95%; }
        img { max-width: 100%; height: auto; max-height: 220px; border-radius: 4px; display: block; }
        .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 10px; color: #94a3b8; text-align: center; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
        .badge-done { background: #d1fae5; color: #065f46; }
        .badge-processing { background: #fef3c7; color: #92400e; }
        .badge-new { background: #dbeafe; color: #1e40af; }
    </style>
</head>
<body>
    @php
        $formatImagePath = function($url) {
            if (empty($url) || !is_string($url)) {
                return null;
            }

            // 1. Tangani file lokal di storage publik secara ketat (Cegah LFI & Path Traversal)
            if (str_contains($url, '/storage/')) {
                // Ambil hanya nama file murni menggunakan basename untuk memotong segmen path ../../
                $parsedPath = parse_url($url, PHP_URL_PATH);
                $filename = basename($parsedPath);

                if (empty($filename) || $filename === '.' || $filename === '..') {
                    return null;
                }

                // Daftar direktori penyimpanan yang diizinkan (Whitelisted Directories)
                $allowedDirs = array_filter([
                    realpath(storage_path('app/public/reports')),
                    realpath(public_path('storage/reports')),
                    realpath(storage_path('app/public')),
                    realpath(public_path('storage')),
                ]);

                foreach ($allowedDirs as $allowedDir) {
                    $candidate = realpath($allowedDir . DIRECTORY_SEPARATOR . $filename);
                    // Pastikan file benar-benar ada dan berada di dalam batasan direktori yang diizinkan (No Chroot Escape)
                    if ($candidate && str_starts_with($candidate, $allowedDir) && file_exists($candidate) && is_file($candidate)) {
                        return $candidate;
                    }
                }

                // Jika file mencoba path traversal atau tidak ditemukan di folder resmi, tolak
                return null;
            }

            // 2. Tangani URL eksternal terpercaya (Cegah SSRF ke localhost / private network)
            if (filter_var($url, FILTER_VALIDATE_URL)) {
                $parsed = parse_url($url);
                $scheme = strtolower($parsed['scheme'] ?? '');
                $host = strtolower($parsed['host'] ?? '');

                // Hanya izinkan domain publik resmi (contoh: placeholder CDN resmi Unsplash & Cloudinary)
                $trustedHosts = ['images.unsplash.com', 'res.cloudinary.com'];
                if ($scheme === 'https' && in_array($host, $trustedHosts, true)) {
                    return $url;
                }
            }

            return null;
        };

        $mainPhotoSafePath = !empty($report->photo_url) ? $formatImagePath($report->photo_url) : null;
    @endphp

    <div class="header">
        <div class="title">INFRACHECK — DOKUMEN AUDIT RESMI</div>
        <div class="tagline">Platform Crowdsourcing Audit & Pelaporan Infrastruktur Publik</div>
    </div>

    <div class="section">
        <table class="info-table">
            <tr>
                <td style="width: 25%;"><span class="label">ID Laporan / Tiket:</span></td>
                <td style="width: 75%; font-weight: bold;">{{ $report->tracking_id }}</td>
            </tr>
            <tr>
                <td><span class="label">Kategori Infrastruktur:</span></td>
                <td>{{ strtoupper($report->category) }}</td>
            </tr>
            <tr>
                <td><span class="label">Tingkat Urgensi:</span></td>
                <td>{{ strtoupper($report->urgency) }}</td>
            </tr>
            <tr>
                <td><span class="label">Status Saat Ini:</span></td>
                <td>
                    <span class="badge {{ $report->status === 'done' ? 'badge-done' : ($report->status === 'processing' ? 'badge-processing' : 'badge-new') }}">
                        {{ strtoupper($report->status) }}
                    </span>
                </td>
            </tr>
            <tr>
                <td><span class="label">Koordinat GPS:</span></td>
                <td>{{ $report->latitude }}, {{ $report->longitude }}</td>
            </tr>
            @if(!empty($report->location_address))
            <tr>
                <td><span class="label">Alamat / Lokasi:</span></td>
                <td>{{ $report->location_address }}</td>
            </tr>
            @endif
            <tr>
                <td><span class="label">Jumlah Konfirmasi:</span></td>
                <td>{{ $report->confirmation_count }} Warga</td>
            </tr>
            <tr>
                <td><span class="label">Tanggal Laporan:</span></td>
                <td>{{ $report->created_at }}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <strong>Deskripsi Kondisi Lapangan:</strong>
        <p style="background: #f1f5f9; padding: 10px; border-radius: 6px; margin-top: 6px;">{{ $report->description }}</p>
    </div>

    @if(!empty($mainPhotoSafePath))
    <div class="section">
        <strong>Dokumentasi Foto Utama:</strong><br>
        <div class="photo-box">
            <img src="{{ $mainPhotoSafePath }}" alt="Foto Utama">
        </div>
    </div>
    @endif

    @if(isset($photos) && count($photos) > 0)
    @php
        $sanitizedPhotos = [];
        foreach ($photos as $photo) {
            $safePath = $formatImagePath($photo->photo_url ?? null);
            if (!empty($safePath)) {
                $sanitizedPhotos[] = [
                    'path' => $safePath,
                    'caption' => $photo->caption ?? 'Bukti Tambahan Warga',
                ];
            }
        }
    @endphp

    @if(count($sanitizedPhotos) > 0)
    <div class="section">
        <strong>Foto Kontribusi Tambahan Warga ({{ count($sanitizedPhotos) }} foto):</strong>
        @foreach($sanitizedPhotos as $sPhoto)
            <div class="photo-box" style="margin-bottom: 10px;">
                <img src="{{ $sPhoto['path'] }}" alt="Foto Kontribusi">
                <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;"><em>Caption: {{ $sPhoto['caption'] }}</em></p>
            </div>
        @endforeach
    </div>
    @endif
    @endif

    <div class="footer">
        Dokumen ini diterbitkan secara otomatis oleh Sistem Audit InfraCheck. Informasi valid per tanggal cetak.
    </div>
</body>
</html>