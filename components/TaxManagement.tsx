
import React, { useState, useEffect, useCallback } from 'react';
import { EditIcon, TrashIcon, PlusIcon } from './icons/Icons';
import { useNotification } from '../contexts/NotificationContext';
import ConfirmationModal from './ConfirmationModal';
import { BusinessUnit } from '../types';

// Local types to match API responses
interface ApiTax {
    id: number;
    name: string;
    rate: string;
    type: 'PERCENTAGE' | 'FIXED';
    description: string | null;
    is_active: number; // 0 or 1
}

const API_TAXES_ENDPOINT = 'https://api.majukoperasiku.my.id/manage/taxes';

// Modal Component for Tax
const TaxModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: any) => Promise<void>;
  tax: ApiTax | null;
}> = ({ isOpen, onClose, onSave, tax }) => {
  const [formData, setFormData] = useState({
    name: '',
    rate: '',
    type: 'PERCENTAGE',
    description: '',
    is_active: 1,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: tax?.name || '',
        rate: tax ? parseFloat(tax.rate).toString() : '', // Clean up trailing zeros for display
        type: tax?.type || 'PERCENTAGE',
        description: tax?.description || '',
        is_active: tax?.is_active ?? 1,
      });
      setIsSaving(false);
    }
  }, [tax, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() === '' || formData.rate.trim() === '') return;
    setIsSaving(true);
    try {
      await onSave({ ...formData, rate: parseFloat(formData.rate) });
      onClose();
    } catch (error) {
        // Keep modal open on failure
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const finalValue = name === 'is_active' ? Number(value) : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto py-10">
      <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 w-full max-w-lg max-h-full overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">{tax ? 'Ubah Pajak' : 'Tambah Pajak Baru'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-600">Nama Pajak *</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required disabled={isSaving} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="rate" className="block text-sm font-medium text-slate-600">Rate *</label>
              <input type="number" name="rate" id="rate" value={formData.rate} onChange={handleChange} required disabled={isSaving} step="0.01" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"/>
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-slate-600">Tipe</label>
              <select name="type" id="type" value={formData.type} onChange={handleChange} required disabled={isSaving} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500">
                  <option value="PERCENTAGE">Persentase (%)</option>
                  <option value="FIXED">Fixed (Rp)</option>
              </select>
            </div>
          </div>
           <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-600">Deskripsi</label>
              <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={2} disabled={isSaving} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"/>
          </div>
          <div>
              <label htmlFor="is_active" className="block text-sm font-medium text-slate-600">Status</label>
              <select name="is_active" id="is_active" value={formData.is_active} onChange={handleChange} required disabled={isSaving} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500">
                  <option value={1}>Aktif</option>
                  <option value={0}>Tidak Aktif</option>
              </select>
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

interface TaxManagementProps {
    selectedBusinessUnit: BusinessUnit;
}

// Main Component
const TaxManagement: React.FC<TaxManagementProps> = ({ selectedBusinessUnit }) => {
    const { addNotification } = useNotification();
    
    // API State
    const [taxes, setTaxes] = useState<ApiTax[]>([]);
    const [isLoading, setIsLoading] = useState({ taxes: false });
    
    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTax, setEditingTax] = useState<ApiTax | null>(null);

    // Delete Confirmation State
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [deletingTax, setDeletingTax] = useState<ApiTax | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const fetchTaxes = useCallback(async () => {
        if (!selectedBusinessUnit) {
            setTaxes([]);
            return;
        }
        setIsLoading(prev => ({ ...prev, taxes: true }));
        try {
            const response = await fetch(`${API_TAXES_ENDPOINT}?business_id=${selectedBusinessUnit.id}`);
            if (!response.ok) throw new Error('Gagal memuat data pajak');
            const result = await response.json();
            if (result.code === 200 && result.data && Array.isArray(result.data.data)) {
                setTaxes(result.data.data);
            } else {
                setTaxes([]);
            }
        } catch (err: any) {
            addNotification(`Gagal memuat pajak: ${err.message}`, 'error');
            setTaxes([]);
        } finally {
            setIsLoading(prev => ({ ...prev, taxes: false }));
        }
    }, [selectedBusinessUnit, addNotification]);

    useEffect(() => {
        fetchTaxes();
    }, [fetchTaxes]);

    const handleOpenModal = (tax: ApiTax | null = null) => {
        setEditingTax(tax);
        setIsModalOpen(true);
    };

    const handleSave = async (formData: any) => {
        const isEditing = !!editingTax;
        const url = isEditing ? `${API_TAXES_ENDPOINT}/${editingTax.id}` : API_TAXES_ENDPOINT;
        const method = isEditing ? 'PUT' : 'POST';
        const payload = { ...formData, business_id: selectedBusinessUnit.id };
        if(isEditing) payload.id = editingTax.id;

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
            addNotification(`Pajak "${payload.name}" berhasil disimpan.`, 'success');
            await fetchTaxes();
        } catch (error: any) {
            addNotification(`Gagal menyimpan: ${error.message}`, 'error');
            throw error;
        }
    };

    const handleDelete = (tax: ApiTax) => {
        setDeletingTax(tax);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingTax) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`${API_TAXES_ENDPOINT}/${deletingTax.id}`, { method: 'DELETE' });
            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.message || `Gagal menghapus. Status: ${response.status}`);
            }
            addNotification(`Pajak "${deletingTax.name}" berhasil dihapus.`, 'success');
            await fetchTaxes();
        } catch (error: any) {
            addNotification(`Gagal menghapus: ${error.message}`, 'error');
        } finally {
            setIsDeleting(false);
            setIsConfirmModalOpen(false);
            setDeletingTax(null);
        }
    };

    const formatRate = (tax: ApiTax) => {
        const rateValue = parseFloat(tax.rate);
        if (tax.type === 'PERCENTAGE') {
            return `${rateValue.toLocaleString('id-ID')}%`;
        }
        return `Rp${rateValue.toLocaleString('id-ID')}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-bold text-slate-800">Manajemen Pajak</h2>
            </div>
            
            <div className="flex justify-end">
                <button onClick={() => handleOpenModal()} disabled={!selectedBusinessUnit} className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    Tambah Pajak
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Pajak</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rate</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipe</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isLoading.taxes ? (
                                <tr><td colSpan={5} className="text-center py-10 text-slate-500">Memuat data pajak...</td></tr>
                            ) : taxes.length > 0 ? taxes.map((tax) => (
                                <tr key={tax.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{tax.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatRate(tax)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{tax.type === 'PERCENTAGE' ? 'Persentase' : 'Fixed'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tax.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {tax.is_active ? 'Aktif' : 'Tidak Aktif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(tax)} className="text-red-600 hover:text-red-900 mr-4"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDelete(tax)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-slate-500">
                                        Tidak ada data pajak untuk unit usaha ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {isModalOpen && <TaxModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} tax={editingTax} />}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Konfirmasi Hapus"
                message={`Apakah Anda yakin ingin menghapus pajak "${deletingTax?.name}"? Aksi ini tidak dapat dibatalkan.`}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default TaxManagement;
