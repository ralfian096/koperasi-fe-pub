
import React, { useState, useEffect, useCallback } from 'react';
import { JournalEntry, BusinessUnit, JournalDetail } from '../types';
import { TrashIcon, PlusIcon } from './icons/Icons';
import { useNotification } from '../contexts/NotificationContext';
import ConfirmationModal from './ConfirmationModal';
import JurnalModal from './JurnalModal';

const API_ENDPOINT = 'https://api.majukoperasiku.my.id/manage/finance/journal-entries';

const formatNumber = (amount: string | number) => {
    const num = parseFloat(String(amount));
    return num.toLocaleString('id-ID');
};


interface JurnalProps {
    selectedBusinessUnit: BusinessUnit;
}

const Jurnal: React.FC<JurnalProps> = ({ selectedBusinessUnit }) => {
    const { addNotification } = useNotification();
    
    const [journals, setJournals] = useState<JournalEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingJournal, setEditingJournal] = useState<JournalEntry | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [deletingJournal, setDeletingJournal] = useState<JournalEntry | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchJournals = useCallback(async () => {
        if (!selectedBusinessUnit) {
            setJournals([]);
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`${API_ENDPOINT}?business_id=${selectedBusinessUnit.id}`);
            if (!response.ok) throw new Error('Gagal memuat entri jurnal');
            const result = await response.json();
            if (result.code === 200 && result.data && Array.isArray(result.data.data)) {
                 const mappedJournals = result.data.data.map((journal: any): JournalEntry => {
                    let total_debit = 0;
                    let total_credit = 0;
                    
                    journal.details.forEach((detail: any) => {
                        const amount = parseFloat(detail.amount);
                        if (detail.entry_type === 'DEBIT') {
                            total_debit += amount;
                        } else {
                            total_credit += amount;
                        }
                    });

                    // Create a version compatible with the modal
                    const itemsForModal = journal.details.map((d: any) => ({
                        id: d.id,
                        chart_of_account_id: parseInt(d.account_chart_id, 10),
                        debit: d.entry_type === 'DEBIT' ? parseFloat(d.amount) : 0,
                        credit: d.entry_type === 'CREDIT' ? parseFloat(d.amount) : 0,
                        account: d.account_chart,
                    }));

                    return {
                        ...journal,
                        date: journal.entry_date, // For modal compatibility
                        total_debit: String(total_debit),
                        total_credit: String(total_credit),
                        items: itemsForModal, // Add items for modal
                    };
                });
                setJournals(mappedJournals);
            } else {
                setJournals([]);
            }
        } catch (err: any) {
            addNotification(`Gagal memuat: ${err.message}`, 'error');
            setJournals([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedBusinessUnit, addNotification]);

    useEffect(() => {
        fetchJournals();
    }, [fetchJournals]);

    const handleOpenModal = (journal: JournalEntry | null = null) => {
        setEditingJournal(journal);
        setIsModalOpen(true);
    };

    const handleDelete = (journal: JournalEntry) => {
        setDeletingJournal(journal);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingJournal) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`${API_ENDPOINT}/${deletingJournal.id}`, { method: 'DELETE' });
            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.message || `Gagal menghapus. Status: ${response.status}`);
            }
            addNotification(`Jurnal "${deletingJournal.description}" berhasil dihapus.`, 'success');
            await fetchJournals();
        } catch (error: any) {
            addNotification(`Gagal menghapus: ${error.message}`, 'error');
        } finally {
            setIsDeleting(false);
            setIsConfirmModalOpen(false);
            setDeletingJournal(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <h2 className="text-3xl font-bold text-slate-800">Jurnal Umum</h2>
            </div>
            <div className="flex justify-end">
                <button onClick={() => handleOpenModal()} className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg shadow-md hover:bg-primary-700 transition">
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    Tambah Jurnal
                </button>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-slate-50">
                            <tr className="border-b border-slate-300">
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tanggal & Deskripsi</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider w-48">Debit (IDR)</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider w-48">Kredit (IDR)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {isLoading ? (
                                <tr><td colSpan={3} className="text-center py-10 text-slate-500">Memuat data jurnal...</td></tr>
                            ) : journals.length > 0 ? (
                                journals.map((journal) => (
                                    <React.Fragment key={journal.id}>
                                        {/* Row Header Jurnal */}
                                        <tr className="border-t-4 border-slate-100 border-b border-slate-200">
                                            <td className="px-6 py-3 align-middle">
                                                <div className="font-semibold text-slate-800">{journal.entry_date}</div>
                                            </td>
                                            <td className="px-6 py-3 align-middle font-medium text-slate-800">{journal.description}</td>
                                            <td className="px-6 py-3 align-middle text-right">
                                                <button onClick={() => handleDelete(journal)} className="text-red-500 hover:text-red-700" title="Hapus"><TrashIcon className="w-5 h-5"/></button>
                                            </td>
                                        </tr>
                                        {/* Row Detail Jurnal */}
                                        {journal.details.map((detail: JournalDetail) => (
                                            <tr key={detail.id}>
                                                <td className="pl-12 pr-6 py-2 text-sm text-slate-600">{detail.account_chart.account_name}</td>
                                                <td className="px-6 py-2 text-sm text-slate-700 text-right">{detail.entry_type === 'DEBIT' ? formatNumber(detail.amount) : '-'}</td>
                                                <td className="px-6 py-2 text-sm text-slate-700 text-right">{detail.entry_type === 'CREDIT' ? formatNumber(detail.amount) : '-'}</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))
                            ) : (
                                <tr><td colSpan={3} className="text-center py-10 text-slate-500">Tidak ada entri jurnal untuk unit usaha ini.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {isModalOpen && (
                 <JurnalModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={fetchJournals} 
                    journalToEdit={editingJournal} 
                    businessUnitId={selectedBusinessUnit.id}
                 />
            )}
           
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Konfirmasi Hapus"
                message={`Anda yakin ingin menghapus jurnal "${deletingJournal?.description}"? Aksi ini tidak dapat dibatalkan.`}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default Jurnal;