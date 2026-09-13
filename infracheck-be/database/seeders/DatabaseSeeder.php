<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Akun Administrator Utama
        User::updateOrCreate(
            ['email' => 'admin@infracheck.id'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        // Akun Admin Tambahan / Demo
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin Dinas PU',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        // Master Data Kategori Infrastruktur Publik Default
        $defaultCategories = [
            [
                'name' => 'Jalan Berlubang',
                'slug' => 'jalan-berlubang',
                'code' => 'CAT-01',
                'description' => 'Kerusakan pada badan jalan seperti lubang, aspal terkelupas, atau retak yang membahayakan pengendara.',
                'is_active' => true,
            ],
            [
                'name' => 'Jembatan Rusak',
                'slug' => 'jembatan-rusak',
                'code' => 'CAT-02',
                'description' => 'Kerusakan struktur gelagar, sambungan aspal, atau pembatas pengaman jembatan.',
                'is_active' => true,
            ],
            [
                'name' => 'Drainase & Saluran Air',
                'slug' => 'drainase-saluran-air',
                'code' => 'CAT-03',
                'description' => 'Saluran air tersumbat sampah, tanggul jebol, sedimentasi lumpur, atau genangan air hujan.',
                'is_active' => true,
            ],
            [
                'name' => 'Penerangan Jalan',
                'slug' => 'penerangan-jalan',
                'code' => 'CAT-04',
                'description' => 'Lampu Penerangan Jalan Umum (PJU) mati, tiang roboh, atau korsleting kabel listrik.',
                'is_active' => true,
            ],
            [
                'name' => 'Fasilitas Publik',
                'slug' => 'fasilitas-publik',
                'code' => 'CAT-05',
                'description' => 'Kerusakan halte bus, trotoar pejalan kaki, taman umum, atau rambu penunjuk jalan.',
                'is_active' => true,
            ],
        ];

        foreach ($defaultCategories as $category) {
            Category::updateOrCreate(
                ['slug' => $category['slug']],
                $category
            );
        }
    }
}
