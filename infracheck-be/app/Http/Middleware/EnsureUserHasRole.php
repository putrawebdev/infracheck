<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Handle an incoming request and check if user has the required role.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Autentikasi diperlukan untuk mengakses sumber daya ini.'
            ], 401);
        }

        $userRole = strtolower(trim((string) ($user->role ?? '')));

        // Format role yang diizinkan (case-insensitive & trimmed)
        $allowedRoles = [];
        foreach ($roles as $r) {
            foreach (explode(',', $r) as $subRole) {
                $trimmed = strtolower(trim($subRole));
                if ($trimmed !== '') {
                    $allowedRoles[] = $trimmed;
                }
            }
        }

        if (!in_array($userRole, $allowedRoles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak: Anda tidak memiliki wewenang untuk tindakan ini.'
            ], 403);
        }

        return $next($request);
    }
}
