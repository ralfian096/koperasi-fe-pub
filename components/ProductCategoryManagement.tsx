
import React, { useState, useEffect, useCallback } from 'react';
import { ProductCategory, BusinessUnit } from '../types';
import { EditIcon, TrashIcon, PlusIcon } from './icons/Icons';
import { useNotification } from '../contexts/NotificationContext';
import ConfirmationModal from './ConfirmationModal';

const API_ENDPOINT = 'https://api.majukoperasiku.my.id/manage/product-categories';

// Modal Component for Category
const CategoryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: { name: string }) => Promise<void>;
  category: ProductCategory | null;
}> = ({ isOpen, onClose, onSave, category }) => {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setName(category?.name || '');
        setIsSaving(false);
    }
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === '') return;
    setIsSaving(true);
    try {
        await onSave({ name });
        onClose();
    } catch (error) {
        // Keep modal open on failure
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">{category ? 'Ubah Kategori' : 'Tambah Kategori Baru'}</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-600">Nama Kategori</label>
            <input type="text" name="name" id="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSaving} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"/>
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Batal</button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 w-28 disabled:opacity-50 disabled:cursor-wait">
                {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ProductCategoryManagementProps {
    selectedBusinessUnit: BusinessUnit;
}

// Main Component
const ProductCategoryManagement: React.FC<ProductCategoryManagementProps> = ({ selectedBusinessUnit }) => {
    const { addNotification } = useNotification();
    
    // API-driven state
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    
    // Loading states
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);

    // Modal and delete confirmation state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [deletingCategory, setDeletingCategory] = useState<ProductCategory | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchCategories = useCallback(async () => {
        if (!selectedBusinessUnit) {
            setCategories([]);
            return;
        }
        setIsLoadingCategories(true);
        try {
            const response = await fetch(`${API_ENDPOINT}?business_id=${selectedBusinessUnit.id}`);
            if (!response.ok) throw new Error('Gagal memuat kategori produk');
            const result = await response.json();
            if (result.code === 200 && result.data && Array.isArray(result.data.data)) {
                setCategories(result.data.data);
            } else {
                setCategories([]);
                if (result.code !== 200 && result.message) {
                    throw new Error(result.message || 'Format data kategori tidak valid');
                }
            }
        } catch (err: any) {
            addNotification(`Gagal memuat kategori: ${err.message}`, 'error');
            setCategories([]);
        } finally {
            setIsLoadingCategories(false);
        }
    }, [selectedBusinessUnit, addNotification]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);


    const handleOpenModal = (category: ProductCategory | null = null) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    const handleSaveCategory = async (formData: { name: string }) => {
        try {
            const isEditing = !!editingCategory;
            const businessId = selectedBusinessUnit.id;

            if (!businessId) {
                throw new Error('Unit Bisnis harus dipilih.');
            }

            const url = isEditing ? `${API_ENDPOINT}/${editingCategory.id}` : API_ENDPOINT;
            const method = isEditing ? 'PUT' : 'POST';
            
            // Menyiapkan payload sesuai dengan aturan API yang diminta
            const payload: { name: string; business_id: number; id?: number; } = {
                name: formData.name,
                business_id: businessId,
            };

            if (isEditing) {
                payload.id = editingCategory.id;
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (!response.ok) {
                const errorMessages = result.errors ? Object.values(result.errors).flat().join(' ') : result.message;
                throw new Error(errorMessages || 'Gagal menyimpan data');
            }
            addNotification(`Kategori "${formData.name}" berhasil disimpan.`, 'success');
            await fetchCategories();
        } catch (error: any) {
            addNotification(`Gagal menyimpan: ${error.message}`, 'error');
            throw error; // Re-throw to keep modal open
        }
    };
    
     const handleDeleteCategory = (category: ProductCategory) => {
        setDeletingCategory(category);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingCategory) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`${API_ENDPOINT}/${deletingCategory.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.message || `Gagal menghapus. Status: ${response.status}`);
            }
            addNotification(`Kategori "${deletingCategory.name}" berhasil dihapus.`, 'success');
            await fetchCategories();
        } catch (error: any) {
            addNotification(`Gagal menghapus: ${error.message}`, 'error');
        } finally {
            setIsDeleting(false);
            setIsConfirmModalOpen(false);
            setDeletingCategory(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <h2 className="text-3xl font-bold text-slate-800">Manajemen Kategori Produk</h2>
            </div>
            
            <div className="flex justify-end">
                <button 
                    onClick={() => handleOpenModal()} 
                    className={`flex items-center px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition ${!selectedBusinessUnit ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!selectedBusinessUnit}
                >
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    Tambah Kategori
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Kategori</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Jumlah Produk</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isLoadingCategories ? (
                                <tr><td colSpan={3} className="text-center py-10 text-slate-500">Memuat data kategori...</td></tr>
                            ) : categories.length > 0 ? categories.map((category) => (
                                <tr key={category.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{category.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-center">{category.products_count}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(category)} className="text-red-600 hover:text-red-900 mr-4"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteCategory(category)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} className="text-center py-10 text-slate-500">
                                        Tidak ada kategori untuk unit usaha ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <CategoryModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveCategory} category={editingCategory} />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Konfirmasi Hapus"
                message={`Apakah Anda yakin ingin menghapus kategori "${deletingCategory?.name}"? Aksi ini tidak dapat dibatalkan.`}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default ProductCategoryManagement;