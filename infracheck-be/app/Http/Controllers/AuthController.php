<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Handle admin login request.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Email atau kata sandi tidak valid.',
            ], 401);
        }

        // Hapus token lama untuk mencegah token proliferation dan menjamin single active session
        $user->tokens()->delete();
        $token = $user->createToken('admin_token', ['role:admin'])->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    /**
     * Get the authenticated user.
     */
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    /**
     * Handle admin logout request.
     */
    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        return response()->json([
            'message' => 'Berhasil keluar akun.',
        ]);
    }

    /**
     * Get admin profile.
     */
    public function getProfile(Request $request)
    {
        return response()->json([
            'data' => $request->user(),
            'user' => $request->user(),
        ]);
    }

    /**
     * Update admin profile info.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,'.$user->id,
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profil admin berhasil diperbarui.',
            'data' => $user,
            'user' => $user,
        ]);
    }

    /**
     * Update admin password.
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Kata sandi saat ini tidak sesuai.',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Revoke token sesi lain agar sesi di perangkat lain otomatis invalidated
        $currentTokenId = $user->currentAccessToken()?->id;
        if ($currentTokenId) {
            $user->tokens()->where('id', '!=', $currentTokenId)->delete();
        } else {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => 'Kata sandi berhasil diperbarui.',
        ]);
    }
}
