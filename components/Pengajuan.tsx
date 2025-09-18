

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Pengajuan } from '../types';
import { PlusIcon, EditIcon, TrashIcon, EyeIcon } from './icons/Icons';
import PengajuanModal from './PengajuanModal';
import ConfirmationModal from './ConfirmationModal';
import { useNotification } from '../contexts/NotificationContext';

const API_ENDPOINT = 'https://api.majukoperasiku.my.id/manage/budget-proposals';

const statusDisplayMap: Record<string, string> = {
    DRAFT: 'Draft',
    SUBMITTED: 'Diajukan',
    APPROVED: 'Diterima',
    REJECTED: 'Ditolak',
};

const statusStyles: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-700',
    SUBMITTED: 'bg-blue-100 text-blue-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
};

const Pengajuan: React.FC = () => {
    const { addNotification } = useNotification();
    
    const [pengajuanList, setPengajuanList] = useState<Pengajuan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPengajuan, setEditingPengajuan] = useState<Pengajuan | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [pengajuanToDelete, setPengajuanToDelete] = useState<Pengajuan | null>(null);

    const [statusFilter, setStatusFilter] = useState<string>('all');

    const fetchPengajuan = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(API_ENDPOINT);
            if (!response.ok) {
                 const err = await response.json().catch(() => ({ message: 'Gagal memuat data pengajuan' }));
                 throw new Error(err.message);
            }
            const result = await response.json();
            if (result.code === 200 && result.data && Array.isArray(result.data.data)) {
                const mappedData: Pengajuan[] = result.data.data.map((p: any) => ({
                    ...p,
                    id: p.id,
                    submitted_at: new Date(p.submitted_at),
                }));
                setPengajuanList(mappedData);
            } else {
                setPengajuanList([]);
            }
        } catch (err: any) {
            addNotification(err.message, 'error');
            setPengajuanList([]);
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        fetchPengajuan();
    }, [fetchPengajuan]);

    const filteredPengajuan = useMemo(() => {
        return pengajuanList
            .filter(p => {
                if (statusFilter === 'all') return true;
                if (statusFilter === 'DRAFT') return p.status === 'DRAFT' || p.status === null;
                return p.status === statusFilter;
            })
            .sort((a, b) => b.submitted_at.getTime() - a.submitted_at.getTime());
    }, [pengajuanList, statusFilter]);

    const handleOpenModal = (p: Pengajuan | null = null) => {
        setEditingPengajuan(p);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPengajuan(null);
    };
    
    const handleDelete = (p: Pengajuan) => {
        setPengajuanToDelete(p);
        setIsConfirmOpen(true);
    };
    
    const confirmDelete = async () => {
        if(!pengajuanToDelete) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_ENDPOINT}/${pengajuanToDelete.id}`, { method: 'DELETE' });
            if (!response.ok) {
                 const err = await response.json().catch(() => ({ message: 'Gagal menghapus pengajuan' }));
                 throw new Error(err.message);
            }
            addNotification(`Pengajuan "${pengajuanToDelete.title}" telah dihapus.`, 'success');
            await fetchPengajuan();
        } catch (err: any) {
             addNotification(err.message, 'error');
        } finally {
            setIsSubmitting(false);
            setIsConfirmOpen(false);
            setPengajuanToDelete(null);
        }
    };
    
    const handleStatusUpdate = async (p: Pengajuan, newStatus: 'APPROVED' | 'REJECTED') => {
        setIsSubmitting(true);
         try {
            const response = await fetch(`${API_ENDPOINT}/${p.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ _method: 'PUT', status: newStatus }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Gagal memperbarui status');

            addNotification(`Status pengajuan "${p.title}" diubah menjadi ${statusDisplayMap[newStatus]}.`, 'info');
            await fetchPengajuan();
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Pengajuan RAB</h2>
                    <p className="text-slate-500 mt-1">Kelola dan lacak semua pengajuan Rencana Anggaran Biaya.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="h-10 px-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="all">Semua Status</option>
                        <option value="DRAFT">Draft</option>
                        <option value="SUBMITTED">Diajukan</option>
                        <option value="APPROVED">Diterima</option>
                        <option value="REJECTED">Ditolak</option>
                    </select>
                    <button onClick={() => handleOpenModal()} className="flex items-center h-10 px-4 bg-indigo-600 text-white rounded-lg font-semibold text-sm shadow-md hover:bg-indigo-700 transition">
                        <PlusIcon className="w-5 h-5 mr-2"/>
                        Buat Pengajuan
                    </button>
                </div>
            </header>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Judul Pengajuan</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tanggal</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Anggaran</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isLoading ? (
                                <tr><td colSpan={5} className="text-center py-10 text-slate-500">Memuat data pengajuan...</td></tr>
                            ) : filteredPengajuan.length > 0 ? (
                                filteredPengajuan.map((p) => {
                                    const statusKey = p.status || 'DRAFT';
                                    const displayStatus = statusDisplayMap[statusKey] || 'Draft';
                                    const canEdit = p.status === 'DRAFT' || p.status === null;

                                    return (
                                        <tr key={p.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-slate-900">{p.title}</div>
                                                <div className="text-xs text-slate-500">{p.submission_code}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{p.submitted_at.toLocaleDateString('id-ID')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">
                                                Rp{(p.total_amount || 0).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusStyles[statusKey]}`}>
                                                    {displayStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                {p.status === 'SUBMITTED' && (
                                                    <>
                                                        <button onClick={() => handleStatusUpdate(p, 'APPROVED')} disabled={isSubmitting} className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 disabled:opacity-50">Terima</button>
                                                        <button onClick={() => handleStatusUpdate(p, 'REJECTED')} disabled={isSubmitting} className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 disabled:opacity-50">Tolak</button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => handleOpenModal(p)}
                                                    title={canEdit ? 'Ubah Pengajuan' : 'Lihat Detail'}
                                                    className="text-indigo-600 hover:text-indigo-900 p-1 inline-block"
                                                >
                                                    {canEdit ? <EditIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                                </button>
                                                {canEdit && (
                                                    <button onClick={() => handleDelete(p)} title="Hapus Pengajuan" className="text-red-600 hover:text-red-900 p-1 inline-block">
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-slate-500">
                                        Tidak ada data pengajuan untuk ditampilkan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <PengajuanModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onSave={fetchPengajuan}
                    pengajuanToEdit={editingPengajuan}
                />
            )}
            
            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="Konfirmasi Hapus"
                message={`Anda yakin ingin menghapus pengajuan "${pengajuanToDelete?.title}"? Aksi ini tidak bisa dibatalkan.`}
                isLoading={isSubmitting}
            />
        </div>
    );
};

export default Pengajuan;