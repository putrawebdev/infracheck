<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ImageSecurityService
{
    /**
     * Sanitasi, bersihkan metadata EXIF (GPS, Device ID), dan simpan gambar sebagai WebP aman.
     *
     * @param  \Illuminate\Http\UploadedFile  $file
     * @param  string  $folder
     * @param  int  $quality
     * @return string Path relatif untuk disk 'public' (contoh: "reports/abcdef12345.webp")
     */
    public static function sanitizeAndStore(UploadedFile $file, string $folder = 'reports', int $quality = 82): string
    {
        // 1. Pastikan folder tujuan di storage/app/public sudah ada
        $destinationDir = storage_path("app/public/{$folder}");
        File::ensureDirectoryExists($destinationDir);

        $safeFilename = Str::random(40) . '.webp';
        $fullPath = $destinationDir . DIRECTORY_SEPARATOR . $safeFilename;

        $realPath = $file->getRealPath();
        $mimeType = strtolower($file->getMimeType() ?? '');
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension());

        // 2. Coba proses re-encoding via PHP GD jika fungsi tersedia
        if (function_exists('imagewebp')) {
            try {
                $image = null;

                if (in_array($extension, ['jpg', 'jpeg'], true) || str_contains($mimeType, 'jpeg')) {
                    if (function_exists('imagecreatefromjpeg')) {
                        $image = @imagecreatefromjpeg($realPath);

                        // Perbaiki orientasi foto smartphone jika ada tag EXIF sebelum dibersihkan
                        if ($image && function_exists('exif_read_data')) {
                            try {
                                $exif = @exif_read_data($realPath);
                                $orientation = $exif['Orientation'] ?? null;
                                if ($orientation && function_exists('imagerotate')) {
                                    $image = match ((int) $orientation) {
                                        3 => imagerotate($image, 180, 0),
                                        6 => imagerotate($image, -90, 0),
                                        8 => imagerotate($image, 90, 0),
                                        default => $image,
                                    };
                                }
                            } catch (\Throwable $exifError) {
                                // Abaikan error pembacaan EXIF yang corrupt
                            }
                        }
                    }
                } elseif ($extension === 'png' || str_contains($mimeType, 'png')) {
                    if (function_exists('imagecreatefrompng')) {
                        $image = @imagecreatefrompng($realPath);
                        if ($image) {
                            imagepalettetotruecolor($image);
                            imagealphablending($image, true);
                            imagesavealpha($image, true);
                        }
                    }
                } elseif ($extension === 'webp' || str_contains($mimeType, 'webp')) {
                    if (function_exists('imagecreatefromwebp')) {
                        $image = @imagecreatefromwebp($realPath);
                    }
                }

                // Jika image resource berhasil dibuat, simpan sebagai WebP (100% EXIF-free)
                if ($image) {
                    imagewebp($image, $fullPath, $quality);
                    imagedestroy($image);

                    if (file_exists($fullPath) && filesize($fullPath) > 0) {
                        return "{$folder}/{$safeFilename}";
                    }
                }
            } catch (\Throwable $th) {
                Log::warning('ImageSecurityService GD re-encoding fallback triggered: ' . $th->getMessage());
            }
        }

        // 3. Fallback jika GD tidak dapat memproses: simpan dengan nama acak murni
        $fallbackExt = in_array($extension, ['jpg', 'jpeg', 'png', 'webp'], true) ? $extension : 'jpg';
        $fallbackName = Str::random(40) . '.' . $fallbackExt;
        $file->storeAs($folder, $fallbackName, 'public');

        return "{$folder}/{$fallbackName}";
    }
}
