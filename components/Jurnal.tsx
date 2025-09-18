
import React, { useState, useEffect, useCallback } from 'react';
import { JournalEntry, BusinessUnit } from '../types';
import { EditIcon, TrashIcon, PlusIcon, EyeIcon } from './icons/Icons';
import { useNotification } from '../contexts/NotificationContext';
import ConfirmationModal from './ConfirmationModal';
import JurnalModal from './JurnalModal';

const API_ENDPOINT = 'https://api.majukoperasiku.my.id/manage/finance/journal-entries';

const formatCurrency = (amount: string | number) => `Rp${parseFloat(String(amount)).toLocaleString('id-ID')}`;

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
                setJournals(result.data.data);
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
                <button onClick={() => handleOpenModal()} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition">
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    Tambah Jurnal
                </button>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tanggal</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Keterangan</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Debit</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Kredit</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isLoading ? (
                                <tr><td colSpan={5} className="text-center py-10 text-slate-500">Memuat data jurnal...</td></tr>
                            ) : journals.length > 0 ? (
                                journals.map((journal) => (
                                    <tr key={journal.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(journal.date).toLocaleDateString('id-ID')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{journal.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 text-right">{formatCurrency(journal.total_debit)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 text-right">{formatCurrency(journal.total_credit)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleOpenModal(journal)} className="text-indigo-600 hover:text-indigo-900 mr-4" title="Lihat Detail"><EyeIcon className="w-5 h-5"/></button>
                                            <button onClick={() => handleDelete(journal)} className="text-red-600 hover:text-red-900" title="Hapus"><TrashIcon className="w-5 h-5"/></button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={5} className="text-center py-10 text-slate-500">Tidak ada entri jurnal untuk unit usaha ini.</td></tr>
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