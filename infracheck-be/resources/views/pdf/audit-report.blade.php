<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Dokumen Audit InfraCheck</title>
    <style>
        body {
            font-family: sans-serif;
            font-size: 13px;
            color: #1e293b;
            line-height: 1.6;
            margin: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 20px;
        }
        .title {
            font-size: 20px;
            font-weight: bold;
            color: #0f172a;
            letter-spacing: 0.5px;
        }
        .tagline {
            font-size: 11px;
            color: #64748b;
            margin-top: 4px;
        }
        .section {
            margin-bottom: 18px;
        }
        .label {
            font-weight: bold;
            width: 160px;
            display: inline-block;
            color: #334155;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .info-table td {
            padding: 6px 4px;
            vertical-align: top;
        }
        .photo-box {
            margin-top: 8px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 8px;
            background: #f8fafc;
            display: inline-block;
            max-width: 95%;
        }
        img {
            max-width: 100%;
            height: auto;
            max-height: 220px;
            border-radius: 4px;
            display: block;
        }
        .footer {
            margin-top: 30px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            font-size: 10px;
            color: #94a3b8;
            text-align: center;
        }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
        }
        .badge-done { background: #d1fae5; color: #065f46; }
        .badge-processing { background: #fef3c7; color: #92400e; }
        .badge-new { background: #dbeafe; color: #1e40af; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">INFRACHECK — DOKUMEN AUDIT RESMI</div>
        <div class="tagline">Platform Crowdsourcing Audit & Pelaporan Infrastruktur Publik</div>
    </div>

    <div class="section">
        <table class="info-table">
            <tr>
                <td style="width: 25%;"><span class="label">ID Laporan / Tiket:</span></td>
                <td style="width: 75%; font-weight: bold;">{{ $report->tracking_id ?? $report->id }}</td>
            </tr>
            <tr>
                <td><span class="label">Kategori Infrastruktur:</span></td>
                <td>{{ strtoupper($report->category ?? '-') }}</td>
            </tr>
            <tr>
                <td><span class="label">Tingkat Urgensi:</span></td>
                <td>{{ strtoupper($report->urgency ?? '-') }}</td>
            </tr>
            <tr>
                <td><span class="label">Status Saat Ini:</span></td>
                <td>
                    @php
                        $st = strtolower($report->status ?? 'new');
                        $badgeClass = ($st === 'done' || $st === 'selesai') ? 'badge-done' : (($st === 'processing' || $st === 'in_progress') ? 'badge-processing' : 'badge-new');
                    @endphp
                    <span class="badge {{ $badgeClass }}">
                        {{ strtoupper($report->status ?? 'BARU') }}
                    </span>
                </td>
            </tr>
            <tr>
                <td><span class="label">Koordinat GPS:</span></td>
                <td>{{ $report->latitude ?? '-' }}, {{ $report->longitude ?? '-' }}</td>
            </tr>
            @if(!empty($report->location_address))
            <tr>
                <td><span class="label">Alamat / Lokasi:</span></td>
                <td>{{ $report->location_address }}</td>
            </tr>
            @endif
            <tr>
                <td><span class="label">Jumlah Konfirmasi:</span></td>
                <td>{{ $report->confirmation_count ?? 1 }} Warga</td>
            </tr>
            <tr>
                <td><span class="label">Tanggal Laporan:</span></td>
                <td>{{ $report->created_at ?? '-' }}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <strong>Deskripsi Kondisi Lapangan:</strong>
        <p style="background: #f1f5f9; padding: 10px; border-radius: 6px; margin-top: 6px;">{{ $report->description ?? '-' }}</p>
    </div>

    @if(!empty($mainPhoto))
    <div class="section">
        <strong>Dokumentasi Foto Utama:</strong><br>
        <div class="photo-box">
            <img src="{{ $mainPhoto }}" alt="Foto Utama">
        </div>
    </div>
    @endif

    @if(!empty($photos) && count($photos) > 0)
    <div class="section">
        <strong>Foto Bukti Tambahan ({{ count($photos) }} foto):</strong>
        @foreach($photos as $photoItem)
            @php
                $photoSrc = is_array($photoItem) ? ($photoItem['src'] ?? null) : ($photoItem->src ?? null);
                $photoCaption = is_array($photoItem) ? ($photoItem['caption'] ?? 'Bukti Tambahan') : ($photoItem->caption ?? 'Bukti Tambahan');
            @endphp
            @if(!empty($photoSrc))
            <div class="photo-box" style="margin-bottom: 10px;">
                <img src="{{ $photoSrc }}" alt="Foto Bukti">
                <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;"><em>Caption: {{ $photoCaption }}</em></p>
            </div>
            @endif
        @endforeach
    </div>
    @endif

    <div class="footer">
        Dokumen ini diterbitkan secara otomatis oleh Sistem Audit InfraCheck. Informasi valid per tanggal cetak.
    </div>
</body>
</html>