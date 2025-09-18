
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { JournalEntry, ChartOfAccount } from '../types';
import { useNotification } from '../contexts/NotificationContext';
import { TrashIcon, PlusIcon } from './icons/Icons';

const API_JOURNAL_ENDPOINT = 'https://api.majukoperasiku.my.id/manage/finance/journal-entries';
const API_COA_ENDPOINT = 'https://api.majukoperasiku.my.id/manage/finance/chart-of-accounts';

const flattenCoa = (accounts: ChartOfAccount[]): ChartOfAccount[] => {
    const flattened: ChartOfAccount[] = [];
    const traverse = (accs: ChartOfAccount[], level: number) => {
        for (const account of accs) {
            const { children, children_recursive, ...accData } = account;
            flattened.push({ 
                ...accData, 
                account_name: `${'--'.repeat(level)} ${account.account_name}`
            });
            if (account.children_recursive && account.children_recursive.length > 0) {
                traverse(account.children_recursive, level + 1);
            }
        }
    };
    traverse(accounts, 0);
    return flattened;
};


interface JurnalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    journalToEdit: JournalEntry | null;
    businessUnitId: number;
}

type JournalItemForm = {
    key: number;
    chart_of_account_id: string;
    debit: string;
    credit: string;
};

const JurnalModal: React.FC<JurnalModalProps> = ({ isOpen, onClose, onSave, journalToEdit, businessUnitId }) => {
    const { addNotification } = useNotification();
    const isEditing = !!journalToEdit;
    const isReadOnly = isEditing; // For now, editing is disabled, so modal is always read-only if journalToEdit exists

    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<JournalItemForm[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // State for CoA dropdown
    const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
    const [isLoadingCoa, setIsLoadingCoa] = useState(true);

    const fetchChartOfAccounts = useCallback(async () => {
        setIsLoadingCoa(true);
        try {
            const response = await fetch(`${API_COA_ENDPOINT}?business_id=${businessUnitId}`);
            if (!response.ok) throw new Error('Gagal memuat Bagan Akun');
            const result = await response.json();
            setChartOfAccounts(result.data?.data || []);
        } catch (err: any) {
            addNotification(err.message, 'error');
            setChartOfAccounts([]);
        } finally {
            setIsLoadingCoa(false);
        }
    }, [businessUnitId, addNotification]);
    
    useEffect(() => {
        if (isOpen) {
            fetchChartOfAccounts();
            setIsSubmitting(false);
            if (journalToEdit) {
                setDescription(journalToEdit.description);
                setDate(new Date(journalToEdit.date).toISOString().split('T')[0]);
                setItems(journalToEdit.items.map(item => ({
                    key: item.id,
                    chart_of_account_id: String(item.chart_of_account_id),
                    debit: item.debit > 0 ? String(item.debit) : '',
                    credit: item.credit > 0 ? String(item.credit) : '',
                })));
            } else {
                setDescription('');
                setDate(new Date().toISOString().split('T')[0]);
                setItems([
                    { key: Date.now(), chart_of_account_id: '', debit: '', credit: '' },
                    { key: Date.now() + 1, chart_of_account_id: '', debit: '', credit: '' },
                ]);
            }
        }
    }, [isOpen, journalToEdit, fetchChartOfAccounts]);
    
    const flattenedChartOfAccounts = useMemo(() => flattenCoa(chartOfAccounts), [chartOfAccounts]);

    const handleItemChange = (key: number, field: keyof Omit<JournalItemForm, 'key'>, value: string) => {
        setItems(currentItems => currentItems.map(item => {
            if (item.key === key) {
                const updatedItem = { ...item, [field]: value };
                // Ensure only debit or credit has a value, not both
                if (field === 'debit' && value) updatedItem.credit = '';
                if (field === 'credit' && value) updatedItem.debit = '';
                return updatedItem;
            }
            return item;
        }));
    };
    
    const addItem = () => setItems(prev => [...prev, { key: Date.now(), chart_of_account_id: '', debit: '', credit: '' }]);
    const removeItem = (key: number) => { if (items.length > 2) setItems(prev => prev.filter(item => item.key !== key)); };
    
    const { totalDebit, totalCredit, isBalanced } = useMemo(() => {
        const totals = items.reduce((acc, item) => {
            acc.debit += parseFloat(item.debit) || 0;
            acc.credit += parseFloat(item.credit) || 0;
            return acc;
        }, { debit: 0, credit: 0 });
        
        return {
            totalDebit: totals.debit,
            totalCredit: totals.credit,
            isBalanced: totals.debit > 0 && totals.debit === totals.credit,
        };
    }, [items]);

    const handleSubmit = async () => {
        if (isReadOnly) {
            onClose();
            return;
        }

        if (!description || !date) {
            addNotification('Tanggal dan Keterangan wajib diisi.', 'error');
            return;
        }
        if (!isBalanced) {
            addNotification('Total Debit dan Kredit harus sama dan tidak boleh nol.', 'error');
            return;
        }
        if (items.some(i => !i.chart_of_account_id || (!i.debit && !i.credit))) {
             addNotification('Setiap baris item harus memiliki akun dan nilai debit atau kredit.', 'error');
            return;
        }
        
        setIsSubmitting(true);
        const payload = {
            business_id: businessUnitId,
            date,
            description,
            items: items.map(item => ({
                chart_of_account_id: Number(item.chart_of_account_id),
                debit: parseFloat(item.debit) || 0,
                credit: parseFloat(item.credit) || 0,
            })),
        };

        try {
            const response = await fetch(API_JOURNAL_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok) {
                const errorMessages = result.errors ? Object.values(result.errors).flat().join(' ') : result.message;
                throw new Error(errorMessages || 'Gagal menyimpan data');
            }
            
            addNotification(`Jurnal berhasil dibuat.`, 'success');
            onSave();
            onClose();
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl my-8 p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-6 text-slate-800 flex-shrink-0">{isReadOnly ? 'Detail Jurnal' : 'Buat Jurnal Baru'}</h2>
                <div className="overflow-y-auto pr-2 flex-grow">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600">Tanggal *</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} disabled={isReadOnly || isSubmitting} required className="input"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600">Keterangan *</label>
                                <input type="text" value={description} onChange={e => setDescription(e.target.value)} disabled={isReadOnly || isSubmitting} required className="input"/>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                           <table className="min-w-full">
                            <thead className="border-b">
                                <tr>
                                    <th className="text-left text-sm font-medium text-slate-600 pb-2">Akun *</th>
                                    <th className="text-left text-sm font-medium text-slate-600 pb-2 w-40">Debit</th>
                                    <th className="text-left text-sm font-medium text-slate-600 pb-2 w-40">Kredit</th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.key}>
                                        <td>
                                            <select value={item.chart_of_account_id} onChange={e => handleItemChange(item.key, 'chart_of_account_id', e.target.value)} disabled={isReadOnly || isSubmitting || isLoadingCoa} className="input my-1" required>
                                                <option value="">{isLoadingCoa ? 'Memuat...' : '-- Pilih Akun --'}</option>
                                                {flattenedChartOfAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.account_code} - {acc.account_name}</option>)}
                                            </select>
                                        </td>
                                        <td><input type="number" placeholder="0" value={item.debit} onChange={e => handleItemChange(item.key, 'debit', e.target.value)} disabled={isReadOnly || isSubmitting} className="input my-1 text-right" min="0"/></td>
                                        <td><input type="number" placeholder="0" value={item.credit} onChange={e => handleItemChange(item.key, 'credit', e.target.value)} disabled={isReadOnly || isSubmitting} className="input my-1 text-right" min="0"/></td>
                                        <td>{!isReadOnly && <button type="button" onClick={() => removeItem(item.key)} disabled={isSubmitting} className="text-red-500 ml-2 disabled:opacity-50"><TrashIcon className="w-5 h-5"/></button>}</td>
                                    </tr>
                                ))}
                            </tbody>
                           </table>
                        </div>
                         {!isReadOnly && <button type="button" onClick={addItem} disabled={isSubmitting} className="btn-secondary text-sm disabled:opacity-50"><PlusIcon className="w-4 h-4 mr-1 inline-block"/>Tambah Baris</button>}
                    </div>
                </div>
                 <div className="flex-shrink-0 pt-4 mt-4 border-t">
                    <div className="flex justify-between items-center">
                        <div className={`text-sm font-semibold ${!isBalanced && totalDebit > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                            {!isBalanced ? 'Jurnal tidak seimbang!' : 'Jurnal seimbang.'}
                        </div>
                        <div className="text-right">
                             <div className="grid grid-cols-2 gap-x-4">
                                <span className="text-sm text-slate-500">Total Debit:</span><span className="font-bold text-slate-800">Rp{totalDebit.toLocaleString('id-ID')}</span>
                                <span className="text-sm text-slate-500">Total Kredit:</span><span className="font-bold text-slate-800">Rp{totalCredit.toLocaleString('id-ID')}</span>
                             </div>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-4">
                        <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
                            {isReadOnly ? 'Tutup' : 'Batal'}
                        </button>
                        {!isReadOnly && (
                            <button type="button" onClick={handleSubmit} className="btn-primary w-32" disabled={isSubmitting || !isBalanced}>
                                {isSubmitting ? 'Menyimpan...' : 'Simpan Jurnal'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
             <style>{`.input { margin-top: 0.25rem; display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; transition: all 0.2s; } .input:disabled { background-color: #f1f5f9; cursor: not-allowed; } .btn-primary { padding: 0.5rem 1rem; background-color: #4f46e5; color: white; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; } .btn-primary:hover { background-color: #4338ca; } .btn-primary:disabled { background-color: #a5b4fc; cursor: not-allowed;} .btn-secondary { padding: 0.5rem 1rem; background-color: #e2e8f0; color: #1e293b; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; } .btn-secondary:hover { background-color: #cbd5e1; } .btn-secondary:disabled { background-color: #f1f5f9; cursor: not-allowed;}`}</style>
        </div>
    );
};

export default JurnalModal;
