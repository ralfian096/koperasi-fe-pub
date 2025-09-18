
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  onSave: (formData: any) => Promise<void>;
  account: ChartOfAccount | null;
  accounts: ChartOfAccount[];
}> = ({ isOpen, onClose, onSave, account, accounts }) => {
  
  const [formData, setFormData] = useState({
    parent_id: '',
    account_code: '',
    account_name: '',
    account_type: 'ASSET' as ChartOfAccount['account_type'],
    normal_balance: 'DEBIT' as ChartOfAccount['normal_balance'],
    is_active: 1,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (account) {
            setFormData({
                parent_id: account.parent_id ? String(account.parent_id) : '',
                account_name: account.account_name,
                account_code: account.account_code,
                account_type: account.account_type,
                normal_balance: account.normal_balance,
                is_active: account.is_active,
            });
        } else {
            setFormData({
                parent_id: '',
                account_code: '',
                account_name: '',
                account_type: 'ASSET',
                normal_balance: 'DEBIT',
                is_active: 1,
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
    const finalValue = name === 'is_active' ? Number(value) : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };
  
  const possibleParents = accounts.filter(acc => acc.id !== account?.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl max-h-full overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">{account ? 'Ubah Akun' : 'Tambah Akun Baru'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="account_name" className="block text-sm font-medium text-slate-600">Nama Akun *</label>
            <input type="text" name="account_name" id="account_name" value={formData.account_name} onChange={handleChange} required disabled={isSaving} className="input"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="account_code" className="block text-sm font-medium text-slate-600">Kode Akun *</label>
              <input type="text" name="account_code" id="account_code" value={formData.account_code} onChange={handleChange} required disabled={isSaving} className="input"/>
            </div>
            <div>
              <label htmlFor="account_type" className="block text-sm font-medium text-slate-600">Tipe Akun *</label>
              <select name="account_type" id="account_type" value={formData.account_type} onChange={handleChange} required disabled={isSaving} className="input">
                {accountTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
           <div>
              <label htmlFor="parent_id" className="block text-sm font-medium text-slate-600">Induk Akun</label>
              <select name="parent_id" id="parent_id" value={formData.parent_id} onChange={handleChange} disabled={isSaving} className="input">
                <option value="">-- Tanpa Induk --</option>
                {possibleParents.map(parent => <option key={parent.id} value={parent.id}>{parent.account_code} - {parent.account_name}</option>)}
              </select>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="normal_balance" className="block text-sm font-medium text-slate-600">Saldo Normal *</label>
              <select name="normal_balance" id="normal_balance" value={formData.normal_balance} onChange={handleChange} required disabled={isSaving} className="input">
                  <option value="DEBIT">Debit</option>
                  <option value="CREDIT">Kredit</option>
              </select>
            </div>
             <div>
                <label htmlFor="is_active" className="block text-sm font-medium text-slate-600">Status</label>
                <select name="is_active" id="is_active" value={formData.is_active} onChange={handleChange} required disabled={isSaving} className="input">
                    <option value={1}>Aktif</option>
                    <option value={0}>Tidak Aktif</option>
                </select>
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} disabled={isSaving} className="btn-secondary">Batal</button>
            <button type="submit" disabled={isSaving} className="btn-primary w-28">
                {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
       <style>{`.input { margin-top: 0.25rem; display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; } .btn-primary { padding: 0.5rem 1rem; background-color: #dc2626; color: white; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; } .btn-primary:hover { background-color: #b91c1c; } .btn-primary:disabled { background-color: #fca5a5; cursor: not-allowed;} .btn-secondary { padding: 0.5rem 1rem; background-color: #e2e8f0; color: #1e293b; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; } .btn-secondary:hover { background-color: #cbd5e1; }`}</style>
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
    
    const hierarchicalAccounts = useMemo(() => {
        const items = JSON.parse(JSON.stringify(accounts)) as ChartOfAccount[];
        const childrenOf: { [key: string]: ChartOfAccount[] } = {};
        items.forEach(item => {
            if (item.parent_id) {
                if (!childrenOf[item.parent_id]) {
                    childrenOf[item.parent_id] = [];
                }
                childrenOf[item.parent_id].push(item);
            }
        });

        items.forEach(item => {
            if (childrenOf[item.id]) {
                item.children = childrenOf[item.id].sort((a, b) => a.account_code.localeCompare(b.account_code));
            }
        });

        return items.filter(item => !item.parent_id).sort((a, b) => a.account_code.localeCompare(b.account_code));
    }, [accounts]);


    const handleOpenModal = (account: ChartOfAccount | null = null) => {
        setEditingAccount(account);
        setIsModalOpen(true);
    };

    const handleSaveAccount = async (formData: any) => {
        const isEditing = !!editingAccount;
        const url = isEditing ? `${API_ENDPOINT}/${editingAccount.id}` : API_ENDPOINT;
        const method = isEditing ? 'PUT' : 'POST';

        const payload: { [key: string]: any } = {
            business_id: selectedBusinessUnit.id,
            account_name: formData.account_name,
            account_code: formData.account_code,
            account_type: formData.account_type,
            normal_balance: formData.normal_balance,
            is_active: formData.is_active,
            parent_id: formData.parent_id ? Number(formData.parent_id) : null,
        };

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
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
            throw error;
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

    const AccountRow: React.FC<{account: ChartOfAccount, level: number}> = ({ account, level }) => (
        <>
            <tr key={account.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900" style={{paddingLeft: `${1.5 + level * 1.5}rem`}}>{account.account_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">{account.account_code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{accountTypeMap[account.account_type]}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{account.normal_balance}</td>
                <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${account.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{account.is_active ? 'Aktif' : 'Tidak Aktif'}</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleOpenModal(account)} className="text-red-600 hover:text-red-900 mr-4"><EditIcon className="w-5 h-5"/></button>
                    <button onClick={() => handleDeleteAccount(account)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                </td>
            </tr>
            {account.children && account.children.map(child => <AccountRow key={child.id} account={child} level={level + 1} />)}
        </>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <h2 className="text-3xl font-bold text-slate-800">Bagan Akun (Chart of Accounts)</h2>
            </div>
            <div className="flex justify-end">
                <button onClick={() => handleOpenModal()} className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition">
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    Tambah Akun
                </button>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Akun</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kode Akun</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipe</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Saldo Normal</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isLoading ? (
                                <tr><td colSpan={6} className="text-center py-10 text-slate-500">Memuat data...</td></tr>
                            ) : hierarchicalAccounts.length > 0 ? (
                                hierarchicalAccounts.map(account => <AccountRow key={account.id} account={account} level={0} />)
                            ) : (
                                <tr><td colSpan={6} className="text-center py-10 text-slate-500">Tidak ada akun yang terdaftar untuk unit usaha ini.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <CoAModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveAccount} account={editingAccount} accounts={accounts} />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Konfirmasi Hapus"
                message={`Anda yakin ingin menghapus akun "${deletingAccount?.account_name}"? Aksi ini tidak dapat dibatalkan.`}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default ChartOfAccountsManagement;
