

import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from '../types';
import { EditIcon, TrashIcon, PlusIcon } from './icons/Icons';
import { useNotification } from '../contexts/NotificationContext';
import ConfirmationModal from './ConfirmationModal';

// Local types to match API response exactly
interface ApiOutlet {
  id: number;
  business_id: string; // From API it's a string
  name: string;
  contact: string | null;
  address: string | null;
  geolocation: string | null;
  is_active: string; // "1" = active, "0" = inactive
  business: {
      id: number;
      name: string;
  };
}

interface ApiBusinessUnitForFilter {
  id: number;
  name: string;
}

const API_SUMMARY_ENDPOINT = 'https://api.majukoperasiku.my.id/manage/business/summary';
const API_OUTLETS_ENDPOINT = 'https://api.majukoperasiku.my.id/manage/outlets';

// Modal Component for Outlet
const OutletModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: any) => Promise<void>;
  outlet: ApiOutlet | null;
}> = ({ isOpen, onClose, onSave, outlet }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    address: '',
    geolocation: '',
    is_active: '1',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: outlet?.name || '',
        contact: outlet?.contact || '',
        address: outlet?.address || '',
        geolocation: outlet?.geolocation || '',
        is_active: outlet?.is_active || '1',
      });
      setIsSaving(false);
    }
  }, [outlet, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() === '') return;
    
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Save failed, keeping modal open.", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto py-10">
      <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 w-full max-w-lg max-h-full overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">{outlet ? 'Ubah Outlet' : 'Tambah Outlet Baru'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-600">Nama Outlet</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required disabled={isSaving} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact" className="block text-sm font-medium text-slate-600">Kontak</label>
                <input type="text" name="contact" id="contact" value={formData.contact ?? ''} onChange={handleChange} disabled={isSaving} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"/>
              </div>
               <div>
                <label htmlFor="is_active" className="block text-sm font-medium text-slate-600">Status</label>
                <select name="is_active" id="is_active" value={formData.is_active} onChange={handleChange} required disabled={isSaving} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500">
                    <option value="1">Aktif</option>
                    <option value="0">Tidak Aktif</option>
                </select>
            </div>
          </div>
           <div>
              <label htmlFor="address" className="block text-sm font-medium text-slate-600">Alamat</label>
              <textarea name="address" id="address" value={formData.address ?? ''} onChange={handleChange} rows={2} disabled={isSaving} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"/>
          </div>
           <div>
                <label htmlFor="geolocation" className="block text-sm font-medium text-slate-600">Geolocation</label>
                <input type="text" name="geolocation" id="geolocation" value={formData.geolocation ?? ''} onChange={handleChange} placeholder="e.g. -6.200000, 106.816666" disabled={isSaving} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"/>
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
const OutletManagement: React.FC = () => {
    const { addNotification } = useNotification();
    
    // API State
    const [businessUnits, setBusinessUnits] = useState<ApiBusinessUnitForFilter[]>([]);
    const [outlets, setOutlets] = useState<ApiOutlet[]>([]);
    const [isLoadingUnits, setIsLoadingUnits] = useState(true);
    const [isLoadingOutlets, setIsLoadingOutlets] = useState(false);
    
    // UI State
    const [selectedUnit, setSelectedUnit] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOutlet, setEditingOutlet] = useState<ApiOutlet | null>(null);

    // Delete Confirmation State
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [deletingOutlet, setDeletingOutlet] = useState<ApiOutlet | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch Business Units for the filter dropdown
    const fetchBusinessUnitsForFilter = useCallback(async () => {
        setIsLoadingUnits(true);
        try {
            const response = await fetch(API_SUMMARY_ENDPOINT);
            if (!response.ok) throw new Error('Gagal memuat unit bisnis');
            const result = await response.json();
            if (result.code === 200 && result.data && Array.isArray(result.data.data)) {
                const units = result.data.data.map((u: any) => ({ id: u.id, name: u.name }));
                setBusinessUnits(units);
                if (units.length > 0 && !selectedUnit) {
                    setSelectedUnit(String(units[0].id));
                }
            } else {
                throw new Error(result.message || 'Format data unit bisnis tidak valid');
            }
        } catch (err: any) {
            addNotification(`Gagal memuat unit bisnis: ${err.message}`, 'error');
        } finally {
            setIsLoadingUnits(false);
        }
    }, [addNotification, selectedUnit]);

    useEffect(() => {
        fetchBusinessUnitsForFilter();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch Outlets when a Business Unit is selected
    const fetchOutlets = useCallback(async () => {
        if (!selectedUnit) {
            setOutlets([]);
            return;
        }
        setIsLoadingOutlets(true);
        try {
            const response = await fetch(`${API_OUTLETS_ENDPOINT}?business_id=${selectedUnit}`);
            if (!response.ok) throw new Error('Gagal memuat outlet');
            const result = await response.json();
            if (result.code === 200 && result.data && Array.isArray(result.data.data)) {
                setOutlets(result.data.data);
            } else {
                setOutlets([]);
                throw new Error(result.message || 'Format data outlet tidak valid');
            }
        } catch (err: any) {
            addNotification(`Gagal memuat outlet: ${err.message}`, 'error');
            setOutlets([]);
        } finally {
            setIsLoadingOutlets(false);
        }
    }, [selectedUnit, addNotification]);

    useEffect(() => {
        fetchOutlets();
    }, [fetchOutlets]);

    const handleOpenModal = (outlet: ApiOutlet | null = null) => {
        setEditingOutlet(outlet);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingOutlet(null);
    };

    const handleSaveOutlet = async (formData: Omit<Outlet, 'id' | 'businessUnitId'>) => {
        const isEditing = !!editingOutlet;
        
        const url = isEditing
            ? `${API_OUTLETS_ENDPOINT}/${editingOutlet.id}`
            : API_OUTLETS_ENDPOINT;
        
        const method = isEditing ? 'PUT' : 'POST';

        const payload: { [key: string]: any } = { ...formData };
        
        if (!isEditing) {
            if (!selectedUnit) {
                addNotification('Tidak ada unit usaha yang dipilih.', 'error');
                return Promise.reject(new Error('No business unit selected'));
            }
            payload.business_id = selectedUnit;
        } else {
             payload.id = editingOutlet.id;
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                 if (response.status === 422 && result.errors) {
                    const errorMessages = Object.values(result.errors).flat().join(' ');
                    throw new Error(errorMessages);
                }
                throw new Error(result.message || 'Gagal menyimpan data outlet');
            }

            addNotification(`Outlet "${payload.name}" berhasil disimpan.`, 'success');
            await fetchOutlets();
            
        } catch (error: any) {
            addNotification(`Gagal menyimpan: ${error.message}`, 'error');
            throw error;
        }
    };

    const handleDeleteOutlet = (outlet: ApiOutlet) => {
        setDeletingOutlet(outlet);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingOutlet) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`${API_OUTLETS_ENDPOINT}/${deletingOutlet.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.message || `Gagal menghapus. Status: ${response.status}`);
            }
             addNotification(`Outlet "${deletingOutlet.name}" berhasil dihapus.`, 'success');
             await fetchOutlets();
        } catch (error: any) {
            addNotification(`Gagal menghapus: ${error.message}`, 'error');
        } finally {
            setIsDeleting(false);
            setIsConfirmModalOpen(false);
            setDeletingOutlet(null);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-bold text-slate-800">Manajemen Outlet</h2>
                <select 
                    value={selectedUnit} 
                    onChange={(e) => setSelectedUnit(e.target.value)} 
                    className="w-full sm:w-64 px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                    disabled={isLoadingUnits || businessUnits.length === 0}
                >
                    {isLoadingUnits ? (
                      <option>Memuat unit bisnis...</option>
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
                    className={`flex items-center px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition ${!selectedUnit || businessUnits.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isLoadingUnits || !selectedUnit || businessUnits.length === 0}
                >
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    Tambah Outlet
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Outlet</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Unit Usaha Induk</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kontak</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                             {isLoadingOutlets ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-slate-500">
                                        Memuat data outlet...
                                    </td>
                                </tr>
                             ) : outlets.length > 0 ? outlets.map((outlet) => (
                                <tr key={outlet.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{outlet.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{outlet.business.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{outlet.contact || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            outlet.is_active === '1' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {outlet.is_active === '1' ? 'Aktif' : 'Tidak Aktif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(outlet)} className="text-red-600 hover:text-red-900 mr-4" title="Edit Outlet"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteOutlet(outlet)} className="text-red-600 hover:text-red-900" title="Hapus"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-slate-500">
                                        {isLoadingUnits ? 'Memuat data...' : selectedUnit ? 'Tidak ada outlet untuk unit usaha ini.' : 'Silakan pilih unit usaha.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <OutletModal 
              isOpen={isModalOpen} 
              onClose={handleCloseModal} 
              onSave={handleSaveOutlet} 
              outlet={editingOutlet} 
            />
            
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Konfirmasi Hapus"
                message={`Apakah Anda yakin ingin menghapus outlet "${deletingOutlet?.name}"? Aksi ini tidak dapat dibatalkan.`}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default OutletManagement;