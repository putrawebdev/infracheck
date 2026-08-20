<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Dokumen Audit InfraCheck</title>
    <style>
        body { font-family: sans-serif; font-size: 14px; color: #333; line-height: 1.5; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .title { font-size: 20px; font-weight: bold; }
        .tagline { font-size: 12px; color: #666; }
        .section { margin-bottom: 15px; }
        .label { font-weight: bold; width: 150px; display: inline-block; }
        .photo-box { margin-top: 10px; border: 1px solid #ddd; padding: 10px; }
        img { max-width: 100%; height: auto; max-height: 200px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">INFRACHECK — DOKUMEN AUDIT RESMI</div>
        <div class="tagline">Platform Crowdsourcing Audit Infrastruktur Publik</div>
    </div>

    <div class="section">
        <p><span class="label">ID Laporan:</span> {{ $report->tracking_id }}</p>
        <p><span class="label">Kategori:</span> {{ strtoupper($report->category) }}</p>
        <p><span class="label">Tingkat Urgensi:</span> {{ strtoupper($report->urgency) }}</p>
        <p><span class="label">Status Saat Ini:</span> {{ strtoupper($report->status) }}</p>
        <p><span class="label">Koordinat GPS:</span> {{ $report->latitude }}, {{ $report->longitude }}</p>
        <p><span class="label">Jumlah Konfirmasi:</span> {{ $report->confirmation_count }} Warga</p>
        <p><span class="label">Tanggal Laporan:</span> {{ $report->created_at }}</p>
    </div>

    <div class="section">
        <strong>Deskripsi Kerusakan:</strong>
        <p>{{ $report->description }}</p>
    </div>

    <div class="section">
        <strong>Dokumentasi Foto Utama:</strong><br>
        <div class="photo-box">
            <img src="{{ $report->photo_url }}" alt="Foto Utama">
        </div>
    </div>

    @if(count($photos) > 0)
    <div class="section">
        <strong>Foto Kontribusi Tambahan Warga ({{ count($photos) }} foto):</strong>
        @foreach($photos as $photo)
            <div class="photo-box">
                <img src="{{ $photo->photo_url }}" alt="Foto Kontribusi">
                <p><em>Caption: {{ $photo->caption ?? 'Tidak ada caption' }}</em></p>
            </div>
        @endforeach
    </div>
    @endif
</body>
</html>