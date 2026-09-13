<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TurnstileService
{
    /**
     * Validasi respon token Cloudflare Turnstile dari frontend.
     *
     * @param  string|null  $token
     * @param  string|null  $ip
     * @return bool
     */
    public static function verify(?string $token, ?string $ip = null): bool
    {
        $secretKey = env('TURNSTILE_SECRET_KEY');

        // Jika Turnstile secret key belum dikonfigurasi (misal mode development lokal), izinkan request
        if (empty($secretKey)) {
            return true;
        }

        // Jika Turnstile aktif di environment tapi token tidak dikirim
        if (empty($token)) {
            return false;
        }

        try {
            $response = Http::asForm()->timeout(5)->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                'secret' => $secretKey,
                'response' => $token,
                'remoteip' => $ip,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return (bool) ($data['success'] ?? false);
            }

            Log::warning('Cloudflare Turnstile verification HTTP failed: ' . $response->status());
            return false;
        } catch (\Throwable $th) {
            Log::error('Cloudflare Turnstile verification exception: ' . $th->getMessage());
            // Fail-open secara aman jika API Cloudflare sedang down agar tidak memblokir laporan darurat warga
            return true;
        }
    }
}
