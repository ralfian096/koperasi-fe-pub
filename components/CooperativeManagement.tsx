
import React, { useState, useEffect, useCallback } from 'react';
import { EditIcon, TrashIcon, PlusIcon } from './icons/Icons';
import { useNotification } from '../contexts/NotificationContext';
import ConfirmationModal from './ConfirmationModal';

const API_ENDPOINT = 'https://api.majukoperasiku.my.id/manage/members';

interface ApiMember {
  id: number;
  member_code: string;
  name: string;
  is_active: number; // 1 for active, 0 for inactive
  created_at: string;
}

// Modal Component for Member
const MemberModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: Omit<ApiMember, 'id' | 'created_at'>) => Promise<void>;
  member: ApiMember | null;
}> = ({ isOpen, onClose, onSave, member }) => {
  const [formData, setFormData] = useState({
    name: '',
    member_code: '',
    is_active: 1,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (member) {
        setFormData({
          name: member.name,
          member_code: member.member_code,
          is_active: member.is_active,
        });
      } else {
        setFormData({
          name: '',
          member_code: '',
          is_active: 1,
        });
      }
      setIsSaving(false);
    }
  }, [member, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() === '' || formData.member_code.trim() === '') return;
    
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'select-one' ? Number(value) : value 
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">{member ? 'Ubah Anggota' : 'Tambah Anggota Baru'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-600">Nama Lengkap *</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" disabled={isSaving}/>
          </div>
          <div>
            <label htmlFor="member_code" className="block text-sm font-medium text-slate-600">Kode Anggota *</label>
            <input type="text" name="member_code" id="member_code" value={formData.member_code} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" disabled={isSaving}/>
          </div>
          <div>
            <label htmlFor="is_active" className="block text-sm font-medium text-slate-600">Status</label>
            <select name="is_active" id="is_active" value={formData.is_active} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" disabled={isSaving}>
                <option value={1}>Aktif</option>
                <option value={0}>Tidak Aktif</option>
            </select>
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300" disabled={isSaving}>Batal</button>
            <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 w-28" disabled={isSaving}>
                {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// Main Component
const CooperativeManagement: React.FC = () => {
    const { addNotification } = useNotification();
    const [members, setMembers] = useState<ApiMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<ApiMember | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [deletingMember, setDeletingMember] = useState<ApiMember | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchMembers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(API_ENDPOINT);
            if (!response.ok) throw new Error('Gagal mengambil data anggota');
            const result = await response.json();
            if (result.code === 200 && result.data && Array.isArray(result.data.data)) {
                setMembers(result.data.data);
            } else {
                throw new Error(result.message || 'Format data tidak valid');
            }
        } catch (err: any) {
            addNotification(err.message, 'error');
            setMembers([]);
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const handleOpenModal = (member: ApiMember | null = null) => {
        setEditingMember(member);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMember(null);
    };
    
    const handleSaveMember = async (formData: Omit<ApiMember, 'id' | 'created_at'>) => {
        const isEditing = !!editingMember;
        const url = isEditing ? `${API_ENDPOINT}/${editingMember.id}` : API_ENDPOINT;
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
            addNotification(`Anggota "${formData.name}" berhasil disimpan.`, 'success');
            await fetchMembers();
        } catch (error: any) {
            addNotification(`Gagal menyimpan: ${error.message}`, 'error');
            throw error; // Re-throw to keep modal open
        }
    };

    const handleDeleteMember = (member: ApiMember) => {
        setDeletingMember(member);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingMember) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`${API_ENDPOINT}/${deletingMember.id}`, { method: 'DELETE' });
            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.message || 'Gagal menghapus anggota');
            }
            addNotification(`Anggota "${deletingMember.name}" berhasil dihapus.`, 'success');
            await fetchMembers();
        } catch (error: any) {
            addNotification(error.message, 'error');
        } finally {
            setIsDeleting(false);
            setIsConfirmModalOpen(false);
            setDeletingMember(null);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <h2 className="text-3xl font-bold text-slate-800">Manajemen Anggota Koperasi</h2>
            </div>
            
            <div className="flex justify-end">
                <button 
                    onClick={() => handleOpenModal()} 
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition"
                >
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    Tambah Anggota
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Anggota</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kode Anggota</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isLoading ? (
                                <tr><td colSpan={4} className="text-center py-10 text-slate-500">Memuat data...</td></tr>
                            ) : members.length > 0 ? members.map((member) => (
                                <tr key={member.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{member.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{member.member_code}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            member.is_active === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {member.is_active === 1 ? 'Aktif' : 'Tidak Aktif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(member)} className="text-red-600 hover:text-red-900 mr-4"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteMember(member)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-slate-500">
                                        Tidak ada anggota koperasi yang terdaftar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <MemberModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                onSave={handleSaveMember} 
                member={editingMember} 
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Konfirmasi Hapus"
                message={`Apakah Anda yakin ingin menghapus anggota "${deletingMember?.name}"? Aksi ini tidak dapat dibatalkan.`}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default CooperativeManagement;
