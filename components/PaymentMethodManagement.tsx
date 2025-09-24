
import React, { useState, useEffect, useCallback } from 'react';
import { EditIcon, TrashIcon, PlusIcon } from './icons/Icons';
import { useNotification } from '../contexts/NotificationContext';
import ConfirmationModal from './ConfirmationModal';

const API_ENDPOINT = 'https://api.majukoperasiku.my.id/manage/payment_methods';

// --- Type Definitions ---
interface ApiPaymentMethod {
  id: number;
  name: string;
  type: 'CASH' | 'EDC' | 'QRIS' | 'OTHER';
  logo: string | null;
  description: string | null;
  is_active: number; // 1 for active, 0 for inactive
}

const typeDisplayMap: Record<ApiPaymentMethod['type'], string> = {
    CASH: 'Tunai',
    EDC: 'EDC / Kartu',
    QRIS: 'QRIS',
    OTHER: 'Lainnya',
};

// --- Modal Component ---
const PaymentMethodModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: Omit<ApiPaymentMethod, 'id'>) => Promise<void>;
  method: ApiPaymentMethod | null;
}> = ({ isOpen, onClose, onSave, method }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'CASH' as ApiPaymentMethod['type'],
    logo: '',
    description: '',
    is_active: 1,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (method) {
        setFormData({
          name: method.name,
          type: method.type,
          logo: method.logo || '',
          description: method.description || '',
          is_active: method.is_active,
        });
      } else {
        setFormData({
          name: '',
          type: 'CASH',
          logo: '',
          description: '',
          is_active: 1,
        });
      }
      setIsSaving(false);
    }
  }, [method, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() === '') return;
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      // Keep modal open on failure to allow user to correct issues
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = name === 'is_active' ? Number(value) : value;
    setFormData(prev => ({ ...prev, [name]: finalValue as any }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">{method ? 'Ubah Metode' : 'Tambah Metode Baru'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-600">Nama Metode *</label>
              <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required disabled={isSaving} className="input"/>
            </div>
             <div>
              <label htmlFor="type" className="block text-sm font-medium text-slate-600">Tipe *</label>
              <select name="type" id="type" value={formData.type} onChange={handleChange} required disabled={isSaving} className="input">
                  {Object.entries(typeDisplayMap).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="logo" className="block text-sm font-medium text-slate-600">Logo (URL Gambar / Ikon)</label>
            <input type="text" name="logo" id="logo" value={formData.logo} onChange={handleChange} disabled={isSaving} placeholder="https://example.com/logo.png" className="input"/>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-600">Deskripsi</label>
            <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={2} disabled={isSaving} className="input"/>
          </div>
          <div>
              <label htmlFor="is_active" className="block text-sm font-medium text-slate-600">Status</label>
              <select name="is_active" id="is_active" value={formData.is_active} onChange={handleChange} required disabled={isSaving} className="input">
                  <option value={1}>Aktif</option>
                  <option value={0}>Tidak Aktif</option>
              </select>
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} disabled={isSaving} className="btn-secondary">Batal</button>
            <button type="submit" disabled={isSaving} className="btn-primary w-28">
                {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
       <style>{`.input { margin-top: 0.25rem; display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; } .btn-primary { padding: 0.5rem 1rem; background-color: #4f46e5; color: white; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; } .btn-primary:hover { background-color: #4338ca; } .btn-primary:disabled { background-color: #a5b4fc; cursor: not-allowed;} .btn-secondary { padding: 0.5rem 1rem; background-color: #e2e8f0; color: #1e293b; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; } .btn-secondary:hover { background-color: #cbd5e1; }`}</style>
    </div>
  );
};

// --- Main Component ---
const PaymentMethodManagement: React.FC = () => {
    const { addNotification } = useNotification();
    const [methods, setMethods] = useState<ApiPaymentMethod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<ApiPaymentMethod | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [deletingMethod, setDeletingMethod] = useState<ApiPaymentMethod | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchMethods = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(API_ENDPOINT);
            if (!response.ok) throw new Error('Gagal mengambil data metode pembayaran');
            const result = await response.json();
            if (result.code === 200 && result.data && Array.isArray(result.data.data)) {
                setMethods(result.data.data);
            } else {
                throw new Error(result.message || 'Format data tidak valid');
            }
        } catch (err: any) {
            addNotification(err.message, 'error');
            setMethods([]);
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        fetchMethods();
    }, [fetchMethods]);

    const handleOpenModal = (method: ApiPaymentMethod | null = null) => {
        setEditingMethod(method);
        setIsModalOpen(true);
    };

    const handleSave = async (formData: Omit<ApiPaymentMethod, 'id'>) => {
        const isEditing = !!editingMethod;
        const url = isEditing ? `${API_ENDPOINT}/${editingMethod.id}` : API_ENDPOINT;
        const method = isEditing ? 'PUT' : 'POST';
        
        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (!response.ok) {
                const errorMessages = result.errors ? Object.values(result.errors).flat().join(' ') : result.message;
                throw new Error(errorMessages || 'Gagal menyimpan data');
            }
            addNotification(`Metode "${formData.name}" berhasil disimpan.`, 'success');
            await fetchMethods();
        } catch (error: any) {
            addNotification(`Gagal menyimpan: ${error.message}`, 'error');
            throw error;
        }
    };
    
    const handleDelete = (method: ApiPaymentMethod) => {
        setDeletingMethod(method);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingMethod) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`${API_ENDPOINT}/${deletingMethod.id}`, { method: 'DELETE' });
            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.message || 'Gagal menghapus metode');
            }
            addNotification(`Metode "${deletingMethod.name}" berhasil dihapus.`, 'success');
            await fetchMethods();
        } catch (error: any) {
            addNotification(error.message, 'error');
        } finally {
            setIsDeleting(false);
            setIsConfirmModalOpen(false);
            setDeletingMethod(null);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Manajemen Metode Pembayaran</h2>
            
            <div className="flex justify-end">
                <button 
                    onClick={() => handleOpenModal()} 
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition"
                >
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    Tambah Metode
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Metode</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipe</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isLoading ? (
                                <tr><td colSpan={4} className="text-center py-10 text-slate-500">Memuat data...</td></tr>
                            ) : methods.length > 0 ? methods.map((method) => (
                                <tr key={method.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{method.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{typeDisplayMap[method.type]}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            method.is_active === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {method.is_active === 1 ? 'Aktif' : 'Tidak Aktif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(method)} className="text-indigo-600 hover:text-indigo-900 mr-4"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDelete(method)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-slate-500">
                                        Belum ada metode pembayaran yang dikonfigurasi.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <PaymentMethodModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSave} 
                method={editingMethod} 
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Konfirmasi Hapus"
                message={`Anda yakin ingin menghapus metode pembayaran "${deletingMethod?.name}"? Aksi ini tidak dapat dibatalkan.`}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default PaymentMethodManagement;