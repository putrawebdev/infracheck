import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

const CategoryFormModal = ({
  id = 'category-form-modal',
  isOpen,
  onClose,
  onSubmit,
  category = null,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        slug: category.slug || category.code || '',
        description: category.description || '',
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
      });
    }
    setErrors({});
  }, [category, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'name' && !category) {
        updated.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
      }
      return updated;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Nama kategori wajib diisi';
    if (!formData.slug.trim()) errs.slug = 'Slug wajib diisi';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (onSubmit) {
      await onSubmit(formData);
    }
  };

  return (
    <Modal
      id={id}
      isOpen={isOpen}
      onClose={onClose}
      title={category ? 'Edit Kategori Infrastruktur' : 'Tambah Kategori Baru'}
      maxWidth="max-w-md"
      footer={
        <>
          <Button
            id={`${id}-cancel-btn`}
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            id={`${id}-submit-btn`}
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {category ? 'Simpan Perubahan' : 'Tambah Kategori'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id={`${id}-name`}
          name="name"
          label="Nama Kategori"
          placeholder="Contoh: Jalan Raya & Jembatan"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
          disabled={isLoading}
        />

        <Input
          id={`${id}-slug`}
          name="slug"
          label="Slug Identifikasi"
          placeholder="jalan-raya-jembatan"
          value={formData.slug}
          onChange={handleChange}
          error={errors.slug}
          helperText="Digunakan sebagai identifier URL atau kode sistem."
          required
          disabled={isLoading}
        />

        <div className="flex flex-col gap-1.5 text-left">
          <label htmlFor={`${id}-desc`} className="text-xs font-semibold text-[#c5c5d4] tracking-wide">
            Deskripsi Kategori
          </label>
          <textarea
            id={`${id}-desc`}
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            placeholder="Jelaskan cakupan infrastruktur publik pada kategori ini..."
            disabled={isLoading}
            className="w-full rounded-xl border border-[#444652] bg-[#252a35] px-3.5 py-2.5 text-sm text-[#e4e1e6] placeholder:text-[#6b7280] focus:border-[#8ca0eb] focus:outline-none focus:ring-2 focus:ring-[#8ca0eb]/20 disabled:bg-[#1f2228] transition-colors resize-none"
          />
        </div>
      </form>
    </Modal>
  );
};

export default CategoryFormModal;
