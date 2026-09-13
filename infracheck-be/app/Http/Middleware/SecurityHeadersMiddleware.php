<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeadersMiddleware
{
    /**
     * Handle an incoming request and attach essential HTTP security headers.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // 1. Mencegah serangan Clickjacking (UI Redress)
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // 2. Mencegah MIME-Type Sniffing (Executable script masking as image/text)
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // 3. XSS Filter bawaan browser lawas
        $response->headers->set('X-XSS-Protection', '1; mode=block');

        // 4. Batasi kebocoran URL asal pada request lintas domain
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // 5. Batasi akses hardware browser hanya pada fitur yang dibutuhkan
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

        // 6. Content Security Policy (CSP) standar untuk API & asset serving
        if (!$response->headers->has('Content-Security-Policy')) {
            $cspPolicy = "default-src 'self'; "
                . "img-src 'self' data: https:; "
                . "script-src 'self'; "
                . "style-src 'self' 'unsafe-inline'; "
                . "font-src 'self' data:; "
                . "connect-src 'self' https:; "
                . "frame-ancestors 'self';";

            $response->headers->set('Content-Security-Policy', $cspPolicy);
        }

        // 7. Strict-Transport-Security jika request berjalan di protokol HTTPS
        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        return $response;
    }
}
