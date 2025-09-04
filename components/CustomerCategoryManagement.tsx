
import React, { useState, useEffect, useCallback } from 'react';
import { EditIcon, TrashIcon, PlusIcon } from './icons/Icons';
import { useNotification } from '../contexts/NotificationContext';
import ConfirmationModal from './ConfirmationModal';

// Tipe data lokal untuk respons API
interface ApiCustomerCategory {
  id: number;
  business_id: number;
  name: string;
  description: string | null;
  customers_count: number;
  business: {
    id: number;
    name: string;
  };
}

// Tipe data untuk unit bisnis dari API summary
interface ApiBusinessUnit {
    id: number;
    name: string;
}

const API_CUSTOMER_CATEGORY_ENDPOINT = 'https://api.majukoperasiku.my.id/manage/customer-category';
const API_BUSINESS_SUMMARY_ENDPOINT = 'https://api.majukoperasiku.my.id/manage/business/summary';


// Modal Component
const CategoryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: { name: string; description: string }) => Promise<void>;
  category: ApiCustomerCategory | null;
}> = ({ isOpen, onClose, onSave, category }) => {
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: category?.name || '',
        description: category?.description || '',
      });
      setIsSaving(false);
    }
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() === '') return;
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      // Biarkan modal tetap terbuka jika gagal
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">{category ? 'Ubah Kategori' : 'Tambah Kategori Baru'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-600">Nama Kategori *</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required disabled={isSaving} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"/>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-600">Deskripsi</label>
            <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} disabled={isSaving} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"/>
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 disabled:opacity-50">Batal</button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 w-28 disabled:opacity-50 disabled:cursor-wait">
                {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Component
const CustomerCategoryManagement: React.FC = () => {
    const { addNotification } = useNotification();
    
    const [businessUnits, setBusinessUnits] = useState<ApiBusinessUnit[]>([]);
    const [customerCategories, setCustomerCategories] = useState<ApiCustomerCategory[]>([]);
    
    const [selectedUnit, setSelectedUnit] = useState<string>('');
    const [isLoadingUnits, setIsLoadingUnits] = useState(true);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ApiCustomerCategory | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [deletingCategory, setDeletingCategory] = useState<ApiCustomerCategory | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchBusinessUnits = async () => {
            setIsLoadingUnits(true);
            try {
                const response = await fetch(API_BUSINESS_SUMMARY_ENDPOINT);
                if (!response.ok) throw new Error('Gagal memuat unit bisnis');
                const result = await response.json();
                if (result.code === 200 && result.data && Array.isArray(result.data.data)) {
                    const units: ApiBusinessUnit[] = result.data.data;
                    setBusinessUnits(units);
                    if (units.length > 0 && !selectedUnit) {
                        setSelectedUnit(String(units[0].id));
                    }
                } else {
                    throw new Error(result.message || 'Format data unit bisnis tidak valid');
                }
            } catch (err: any) {
                addNotification(`Gagal memuat data: ${err.message}`, 'error');
            } finally {
                setIsLoadingUnits(false);
            }
        };
        fetchBusinessUnits();
    }, [addNotification, selectedUnit]);
    
    const fetchCustomerCategories = useCallback(async () => {
        if (!selectedUnit) {
            setCustomerCategories([]);
            return;
        }
        setIsLoadingCategories(true);
        try {
            const response = await fetch(`${API_CUSTOMER_CATEGORY_ENDPOINT}?business_id=${selectedUnit}`);
            if (!response.ok) throw new Error('Gagal memuat kategori customer');
            const result = await response.json();
            if (result.code === 200 && result.data && Array.isArray(result.data.data)) {
                setCustomerCategories(result.data.data);
            } else {
                setCustomerCategories([]);
                // Tidak menampilkan error jika hanya kosong
                if (result.code !== 200) throw new Error(result.message || 'Format data tidak valid');
            }
        } catch (err: any) {
            addNotification(`Gagal memuat kategori: ${err.message}`, 'error');
            setCustomerCategories([]);
        } finally {
            setIsLoadingCategories(false);
        }
    }, [selectedUnit, addNotification]);

    useEffect(() => {
        fetchCustomerCategories();
    }, [fetchCustomerCategories]);
    
    const handleOpenModal = (category: ApiCustomerCategory | null = null) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    const handleSaveCategory = async (formData: { name: string; description: string }) => {
        const isEditing = !!editingCategory;
        const url = isEditing
            ? `${API_CUSTOMER_CATEGORY_ENDPOINT}/${editingCategory.id}`
            : API_CUSTOMER_CATEGORY_ENDPOINT;
        const method = isEditing ? 'PUT' : 'POST';

        const payload: any = { ...formData };
        if (!isEditing) {
            payload.business_id = Number(selectedUnit);
        }

        try {
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
            addNotification(`Kategori "${payload.name}" berhasil disimpan.`, 'success');
            await fetchCustomerCategories();
        } catch (error: any) {
            addNotification(`Gagal menyimpan: ${error.message}`, 'error');
            throw error; // Re-throw untuk menjaga modal tetap terbuka
        }
    };
    
    const handleDeleteCategory = (category: ApiCustomerCategory) => {
        setDeletingCategory(category);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingCategory) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`${API_CUSTOMER_CATEGORY_ENDPOINT}/${deletingCategory.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.message || `Gagal menghapus. Status: ${response.status}`);
            }
            addNotification(`Kategori "${deletingCategory.name}" berhasil dihapus.`, 'success');
            await fetchCustomerCategories();
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
                 <h2 className="text-3xl font-bold text-slate-800">Manajemen Kategori Customer</h2>
                 <select 
                    value={selectedUnit} 
                    onChange={(e) => setSelectedUnit(e.target.value)} 
                    className="w-full sm:w-64 px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                    disabled={isLoadingUnits || businessUnits.length === 0}
                >
                    {isLoadingUnits ? (
                        <option>Memuat Unit Bisnis...</option>
                    ) : businessUnits.length === 0 ? (
                      <option>Tidak ada unit bisnis</option>
                    ) : (
                        businessUnits.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)
                    )}
                </select>
            </div>
            
            <div className="flex justify-end">
                <button 
                    onClick={() => handleOpenModal()} 
                    className={`flex items-center px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition ${!selectedUnit ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!selectedUnit}
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
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Deskripsi</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Jumlah Customer</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isLoadingCategories ? (
                                <tr><td colSpan={4} className="text-center py-10 text-slate-500">Memuat data...</td></tr>
                            ) : customerCategories.length > 0 ? customerCategories.map((category) => (
                                <tr key={category.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{category.name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{category.description || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-center">{category.customers_count}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(category)} className="text-red-600 hover:text-red-900 mr-4"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteCategory(category)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-slate-500">
                                        {selectedUnit ? 'Tidak ada kategori untuk unit usaha ini.' : 'Silakan pilih unit usaha.'}
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

export default CustomerCategoryManagement;
