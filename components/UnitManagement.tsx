import React, { useState, useEffect, useCallback } from 'react';
import { EditIcon, TrashIcon, PlusIcon } from './icons/Icons';
import { useNotification } from '../contexts/NotificationContext';
import ConfirmationModal from './ConfirmationModal';

const API_ENDPOINT = 'https://api.majukoperasiku.my.id/manage/units';

// --- Type Definitions ---
interface ApiUnit {
  unit_id: number;
  name: string;
  description: string | null;
  type: 'QUANTITY' | 'TIME';
  value_in_seconds: number | null;
}

const typeDisplayMap: Record<ApiUnit['type'], string> = {
    QUANTITY: 'Jumlah',
    TIME: 'Waktu',
};

// Type for the form state
type UnitFormData = {
  name: string;
  type: 'QUANTITY' | 'TIME';
  value_in_seconds: string;
};


// --- Modal Component ---
const UnitModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: UnitFormData) => Promise<void>;
  unit: ApiUnit | null;
}> = ({ isOpen, onClose, onSave, unit }) => {
  const [formData, setFormData] = useState<UnitFormData>({
    name: '',
    type: 'QUANTITY',
    value_in_seconds: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (unit) {
        setFormData({
          name: unit.name,
          type: unit.type,
          value_in_seconds: unit.value_in_seconds ? String(unit.value_in_seconds) : '',
        });
      } else {
        setFormData({
          name: '',
          type: 'QUANTITY',
          value_in_seconds: '',
        });
      }
      setIsSaving(false);
    }
  }, [unit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() === '') return;
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      // Keep modal open on failure
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
        const newState = { ...prev, [name as keyof UnitFormData]: value as any };
        if (name === 'type') {
            if (value !== 'TIME') {
                newState.value_in_seconds = '';
            }
        }
        return newState;
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">{unit ? 'Ubah Unit Satuan' : 'Tambah Unit Satuan Baru'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-600">Nama Unit *</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} placeholder="e.g., Pcs, Jam, Kg" required disabled={isSaving} className="input"/>
              </div>
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-slate-600">Tipe Unit *</label>
                <select name="type" id="type" value={formData.type} onChange={handleChange} required disabled={isSaving} className="input">
                  {Object.entries(typeDisplayMap).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
          </div>
          {formData.type === 'TIME' && (
              <div>
                <label htmlFor="value_in_seconds" className="block text-sm font-medium text-slate-600">Waktu dalam detik *</label>
                <input type="number" name="value_in_seconds" id="value_in_seconds" value={formData.value_in_seconds} onChange={handleChange} min="1" placeholder="e.g., 3600" required disabled={isSaving} className="input"/>
              </div>
          )}
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
const UnitManagement: React.FC = () => {
    const { addNotification } = useNotification();
    const [units, setUnits] = useState<ApiUnit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<ApiUnit | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [deletingUnit, setDeletingUnit] = useState<ApiUnit | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchUnits = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(API_ENDPOINT);
            if (!response.ok) throw new Error('Gagal mengambil data unit satuan');
            const result = await response.json();
            if (result.code === 200 && result.data && Array.isArray(result.data.data)) {
                setUnits(result.data.data);
            } else {
                throw new Error(result.message || 'Format data tidak valid');
            }
        } catch (err: any) {
            addNotification(err.message, 'error');
            setUnits([]);
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        fetchUnits();
    }, [fetchUnits]);

    const handleOpenModal = (unit: ApiUnit | null = null) => {
        setEditingUnit(unit);
        setIsModalOpen(true);
    };

    const handleSave = async (formData: UnitFormData) => {
        const isEditing = !!editingUnit;
        const url = isEditing ? `${API_ENDPOINT}/${editingUnit.unit_id}` : API_ENDPOINT;
        const method = isEditing ? 'PUT' : 'POST';
        
        const payload: {
            name: string;
            type: 'QUANTITY' | 'TIME';
            description?: string | null;
            value_in_seconds?: number | null;
        } = {
            name: formData.name,
            type: formData.type,
        };

        if (formData.type === 'TIME') {
            payload.value_in_seconds = formData.value_in_seconds ? Number(formData.value_in_seconds) : null;
            payload.description = null;
        } else {
            payload.description = null;
            payload.value_in_seconds = null;
        }

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) {
                const errorMessages = result.errors ? Object.values(result.errors).flat().join(' ') : result.message;
                throw new Error(errorMessages || 'Gagal menyimpan data');
            }
            addNotification(`Unit "${formData.name}" berhasil disimpan.`, 'success');
            await fetchUnits();
        } catch (error: any) {
            addNotification(`Gagal menyimpan: ${error.message}`, 'error');
            throw error;
        }
    };
    
    const handleDelete = (unit: ApiUnit) => {
        setDeletingUnit(unit);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingUnit) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`${API_ENDPOINT}/${deletingUnit.unit_id}`, { method: 'DELETE' });
            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.message || 'Gagal menghapus unit');
            }
            addNotification(`Unit "${deletingUnit.name}" berhasil dihapus.`, 'success');
            await fetchUnits();
        } catch (error: any) {
            addNotification(error.message, 'error');
        } finally {
            setIsDeleting(false);
            setIsConfirmModalOpen(false);
            setDeletingUnit(null);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Manajemen Unit Satuan</h2>
            
            <div className="flex justify-end">
                <button 
                    onClick={() => handleOpenModal()} 
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition"
                >
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    Tambah Unit Satuan
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Unit</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipe</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Waktu dalam detik</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isLoading ? (
                                <tr><td colSpan={4} className="text-center py-10 text-slate-500">Memuat data...</td></tr>
                            ) : units.length > 0 ? units.map((unit) => (
                                <tr key={unit.unit_id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{unit.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{typeDisplayMap[unit.type] || 'Lainnya'}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{unit.value_in_seconds || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(unit)} className="text-indigo-600 hover:text-indigo-900 mr-4"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDelete(unit)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-slate-500">
                                        Belum ada unit satuan yang dikonfigurasi.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <UnitModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSave} 
                unit={editingUnit} 
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Konfirmasi Hapus"
                message={`Anda yakin ingin menghapus unit satuan "${deletingUnit?.name}"? Aksi ini tidak dapat dibatalkan.`}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default UnitManagement;