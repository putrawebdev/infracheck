import React from 'react';
import { Edit2, Trash2, Tag as TagIcon } from 'lucide-react';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import Spinner from '../ui/Spinner';

const CategoryTable = ({
  id = 'category-table',
  categories = [],
  isLoading = false,
  onEdit,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <div className="bg-[#191C1E] rounded-2xl border border-[#444652] p-12 flex flex-col items-center justify-center">
        <Spinner size="lg" color="blue" />
        <p className="text-xs text-[#c5c5d4] mt-3 font-medium">Memuat data kategori...</p>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <EmptyState
        id={`${id}-empty`}
        icon={TagIcon}
        title="Belum ada kategori"
        description="Daftar kategori infrastruktur publik masih kosong. Tambahkan kategori pertama Anda."
      />
    );
  }

  return (
    <div id={id} className="bg-[#191C1E] rounded-2xl border border-[#444652] shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#22272e] border-b border-[#343844] text-[11px] font-semibold text-[#c5c5d4] uppercase tracking-wider">
              <th className="py-3.5 px-4 w-16 text-center">#</th>
              <th className="py-3.5 px-4">Nama Kategori</th>
              <th className="py-3.5 px-4">Slug / Kode</th>
              <th className="py-3.5 px-4">Deskripsi</th>
              <th className="py-3.5 px-4 w-28 text-center">Jumlah Laporan</th>
              <th className="py-3.5 px-4 w-32 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#343844]/60 text-sm text-[#e4e1e6]">
            {categories.map((cat, index) => (
              <tr key={cat.id || index} className="hover:bg-[#252a35]/50 transition-colors">
                <td className="py-3.5 px-4 text-center text-xs font-mono text-[#8b8b98]">
                  {index + 1}
                </td>
                <td className="py-3.5 px-4 font-semibold text-[#e4e1e6]">
                  {cat.name}
                </td>
                <td className="py-3.5 px-4">
                  <span className="inline-block px-2.5 py-0.5 bg-[#252a35] text-[#8ca0eb] font-mono text-xs rounded-full border border-[#343844]">
                    {cat.slug || cat.code || '-'}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-xs text-[#c5c5d4] max-w-xs truncate">
                  {cat.description || 'Tidak ada deskripsi'}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#202a4d] text-[#a4b3ed] border border-[#354477]">
                    {cat.reports_count ?? cat.total_reports ?? 0}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      id={`${id}-edit-${cat.id}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit && onEdit(cat)}
                      className="text-[#c5c5d4] hover:text-[#8ca0eb] hover:bg-[#2e3239]"
                      aria-label={`Edit ${cat.name}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      id={`${id}-delete-${cat.id}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete && onDelete(cat)}
                      className="text-[#c5c5d4] hover:text-rose-400 hover:bg-rose-950/30"
                      aria-label={`Hapus ${cat.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryTable;
