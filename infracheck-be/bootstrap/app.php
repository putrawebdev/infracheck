<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Daftarkan alias middleware role untuk RBAC (Role-Based Access Control)
        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureUserHasRole::class,
        ]);

        // Pasang SecurityHeadersMiddleware secara global ke seluruh response HTTP
        $middleware->append(\App\Http\Middleware\SecurityHeadersMiddleware::class);

        // Konfigurasi trusted proxies untuk mencegah pemalsuan header IP (X-Forwarded-For)
        $middleware->trustProxies(at: [
            '127.0.0.1',
            '10.0.0.0/8',
            '172.16.0.0/12',
            '192.168.0.0/16',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
