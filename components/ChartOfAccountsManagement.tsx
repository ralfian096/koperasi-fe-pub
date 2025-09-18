
import React, { useState, useEffect, useCallback } from 'react';
import { ChartOfAccount, BusinessUnit } from '../types';
import { EditIcon, TrashIcon, PlusIcon } from './icons/Icons';
import { useNotification } from '../contexts/NotificationContext';
import ConfirmationModal from './ConfirmationModal';

const API_ENDPOINT = 'https://api.majukoperasiku.my.id/manage/finance/chart-of-accounts';

// Type mappings for display
const accountTypeMap: Record<ChartOfAccount['account_type'], string> = {
    ASSET: 'Aset',
    LIABILITY: 'Liabilitas',
    EQUITY: 'Ekuitas',
    REVENUE: 'Pendapatan',
    EXPENSE: 'Beban',
};

const accountTypeOptions: { value: ChartOfAccount['account_type']; label: string }[] = [
    { value: 'ASSET', label: 'Aset' },
    { value: 'LIABILITY', label: 'Liabilitas' },
    { value: 'EQUITY', label: 'Ekuitas' },
    { value: 'REVENUE', label: 'Pendapatan' },
    { value: 'EXPENSE', label: 'Beban' },
];

// Modal Component for Chart of Account
const CoAModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: Omit<ChartOfAccount, 'id' | 'business_id'>) => Promise<void>;
  account: ChartOfAccount | null;
}> = ({ isOpen, onClose, onSave, account }) => {
  
  const [formData, setFormData] = useState({
    account_name: '',
    account_code: '',
    account_type: 'ASSET' as ChartOfAccount['account_type'],
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (account) {
            setFormData({
                account_name: account.account_name,
                account_code: account.account_code,
                account_type: account.account_type,
            });
        } else {
            setFormData({
                account_name: '',
                account_code: '',
                account_type: 'ASSET',
            });
        }
        setIsSaving(false);
    }
  }, [account, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.account_name.trim() === '' || formData.account_code.trim() === '') return;
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">{account ? 'Ubah Akun' : 'Tambah Akun Baru'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="account_name" className="block text-sm font-medium text-slate-600">Nama Akun *</label>
            <input type="text" name="account_name" id="account_name" value={formData.account_name} onChange={handleChange} required disabled={isSaving} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="account_code" className="block text-sm font-medium text-slate-600">Kode Akun *</label>
              <input type="text" name="account_code" id="account_code" value={formData.account_code} onChange={handleChange} required disabled={isSaving} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div>
              <label htmlFor="account_type" className="block text-sm font-medium text-slate-600">Tipe Akun *</label>
              <select name="account_type" id="account_type" value={formData.account_type} onChange={handleChange} required disabled={isSaving} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                {accountTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Batal</button>
            <button type="submit" disabled={isSaving} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 w-28 disabled:opacity-50 disabled:cursor-wait">
                {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ChartOfAccountsManagementProps {
    selectedBusinessUnit: BusinessUnit;
}

// Main Component
const ChartOfAccountsManagement: React.FC<ChartOfAccountsManagementProps> = ({ selectedBusinessUnit }) => {
    const { addNotification } = useNotification();
    
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState<ChartOfAccount | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchAccounts = useCallback(async () => {
        if (!selectedBusinessUnit) {
            setAccounts([]);
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`${API_ENDPOINT}?business_id=${selectedBusinessUnit.id}`);
            if (!response.ok) throw new Error('Gagal memuat bagan akun');
            const result = await response.json();
            if (result.code === 200 && result.data && Array.isArray(result.data.data)) {
                setAccounts(result.data.data);
            } else {
                setAccounts([]);
                if (result.code !== 200 && result.message) {
                    throw new Error(result.message || 'Format data tidak valid');
                }
            }
        } catch (err: any) {
            addNotification(`Gagal memuat: ${err.message}`, 'error');
            setAccounts([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedBusinessUnit, addNotification]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);


    const handleOpenModal = (account: ChartOfAccount | null = null) => {
        setEditingAccount(account);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAccount(null);
    };

    const handleSaveAccount = async (formData: Omit<ChartOfAccount, 'id' | 'business_id'>) => {
        try {
            const isEditing = !!editingAccount;
            const payload = {
                ...formData,
                business_id: selectedBusinessUnit.id,
            };

            const url = isEditing ? `${API_ENDPOINT}/${editingAccount.id}` : API_ENDPOINT;
            const method = isEditing ? 'PUT' : 'POST';

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
            addNotification(`Akun "${formData.account_name}" berhasil disimpan.`, 'success');
            await fetchAccounts();
        } catch (error: any) {
            addNotification(`Gagal menyimpan: ${error.message}`, 'error');
            throw error; // Re-throw to keep modal open
        }
    };
    
     const handleDeleteAccount = (account: ChartOfAccount) => {
        setDeletingAccount(account);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingAccount) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`${API_ENDPOINT}/${deletingAccount.id}`, { method: 'DELETE' });
            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.message || `Gagal menghapus. Status: ${response.status}`);
            }
            addNotification(`Akun "${deletingAccount.account_name}" berhasil dihapus.`, 'success');
            await fetchAccounts();
        } catch (error: any) {
            addNotification(`Gagal menghapus: ${error.message}`, 'error');
        } finally {
            setIsDeleting(false);
            setIsConfirmModalOpen(false);
            setDeletingAccount(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <h2 className="text-3xl font-bold text-slate-800">Bagan Akun (Chart of Accounts)</h2>
            </div>
            
            <div className="flex justify-end">
                <button 
                    onClick={() => handleOpenModal()} 
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition"
                >
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    Tambah Akun
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kode Akun</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Akun</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipe</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isLoading ? (
                                <tr><td colSpan={4} className="text-center py-10 text-slate-500">Memuat data...</td></tr>
                            ) : accounts.length > 0 ? accounts.map((account) => (
                                <tr key={account.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">{account.account_code}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{account.account_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{accountTypeMap[account.account_type] || account.account_type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(account)} className="text-indigo-600 hover:text-indigo-900 mr-4"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteAccount(account)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-slate-500">
                                        Tidak ada akun yang terdaftar untuk unit usaha ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <CoAModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveAccount} account={editingAccount} />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Konfirmasi Hapus"
                message={`Apakah Anda yakin ingin menghapus akun "${deletingAccount?.account_name}"? Aksi ini tidak dapat dibatalkan.`}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default ChartOfAccountsManagement;
