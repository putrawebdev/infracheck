<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories with reports count.
     */
    public function index(Request $request)
    {
        try {
            $query = Category::query();

            // Filter active only if requested (e.g. for public reporting form)
            if ($request->boolean('active_only')) {
                $query->where('is_active', true);
            }

            $categories = $query->orderBy('id', 'asc')->get();

            // Aggregate reports_count in a single query to eliminate N+1 database queries
            $reportCounts = [];
            try {
                $repQuery = DB::table('reports');
                if (Schema::hasColumn('reports', 'deleted_at')) {
                    $repQuery->whereNull('deleted_at');
                }
                $reportCounts = $repQuery
                    ->select('category', DB::raw('count(*) as total'))
                    ->groupBy('category')
                    ->pluck('total', 'category')
                    ->toArray();
            } catch (\Throwable $e) {
                $reportCounts = [];
            }

            $categoriesWithCount = $categories->map(function ($cat) use ($reportCounts) {
                $nameCount = $reportCounts[$cat->name] ?? 0;
                $slugCount = (!empty($cat->slug) && $cat->slug !== $cat->name) ? ($reportCounts[$cat->slug] ?? 0) : 0;

                $catArray = $cat->toArray();
                $catArray['reports_count'] = (int) ($nameCount + $slugCount);
                return $catArray;
            });

            return response()->json([
                'success' => true,
                'data' => $categoriesWithCount,
            ], 200);
        } catch (\Throwable $th) {
            Log::error('Gagal memuat kategori:', [
                'error' => $th->getMessage(),
                'trace' => $th->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kendala saat memuat data kategori. Silakan coba beberapa saat lagi.',
                'data' => []
            ], 500);
        }
    }

    /**
     * Store a newly created category in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:categories,slug',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $slug = $validated['slug'] ?? Str::slug($validated['name']);
        
        // Ensure slug is unique
        $originalSlug = $slug;
        $counter = 1;
        while (Category::where('slug', $slug)->exists()) {
            $slug = "{$originalSlug}-{$counter}";
            $counter++;
        }

        $totalCategories = Category::count();
        $code = $validated['code'] ?? ('CAT-' . str_pad($totalCategories + 1, 2, '0', STR_PAD_LEFT));

        $category = Category::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'code' => $code,
            'description' => $validated['description'] ?? '',
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $categoryData = $category->toArray();
        $categoryData['reports_count'] = 0;

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil ditambahkan.',
            'data' => $categoryData,
        ], 201);
    }

    /**
     * Display the specified category.
     */
    public function show($id)
    {
        $category = Category::where('id', $id)->orWhere('slug', $id)->first();

        if (! $category) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori tidak ditemukan.',
            ], 404);
        }

        $repQuery = DB::table('reports')
            ->where(function ($q) use ($category) {
                $q->where('category', $category->name)
                  ->orWhere('category', $category->slug);
            });
        if (Schema::hasColumn('reports', 'deleted_at')) {
            $repQuery->whereNull('deleted_at');
        }
        $reportsCount = $repQuery->count();

        $categoryData = $category->toArray();
        $categoryData['reports_count'] = $reportsCount;

        return response()->json([
            'success' => true,
            'data' => $categoryData,
        ], 200);
    }

    /**
     * Update the specified category in storage.
     */
    public function update(Request $request, $id)
    {
        $category = Category::find($id);

        if (! $category) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:categories,slug,' . $category->id,
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);

        if (isset($validated['name']) && empty($validated['slug']) && !isset($request->slug)) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $category->update($validated);

        $reportsCount = DB::table('reports')
            ->where('category', $category->name)
            ->orWhere('category', $category->slug)
            ->count();

        $categoryData = $category->toArray();
        $categoryData['reports_count'] = $reportsCount;

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil diperbarui.',
            'data' => $categoryData,
        ], 200);
    }

    /**
     * Remove the specified category from storage.
     */
    public function destroy($id)
    {
        $category = Category::find($id);

        if (! $category) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori tidak ditemukan.',
            ], 404);
        }

        // Check if there are active reports using this category
        $activeRepQuery = DB::table('reports')
            ->where(function ($q) use ($category) {
                $q->where('category', $category->name)
                  ->orWhere('category', $category->slug);
            });
        if (Schema::hasColumn('reports', 'deleted_at')) {
            $activeRepQuery->whereNull('deleted_at');
        }
        $reportsCount = $activeRepQuery->count();

        if ($reportsCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "Kategori \"{$category->name}\" memiliki {$reportsCount} laporan terkait dan tidak dapat dihapus. Silakan nonaktifkan kategori sebagai alternatif.",
            ], 422);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil dihapus.',
        ], 200);
    }
}
