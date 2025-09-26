import React, { useState, useEffect, useCallback } from 'react';
import { BusinessUnit, Promotion, PromotionReward, PromotionCondition } from '../types';
import { useNotification } from '../contexts/NotificationContext';
import { PlusIcon, EditIcon, TrashIcon } from './icons/Icons';
import ConfirmationModal from './ConfirmationModal';
import PromotionModal from './PromotionModal'; 

const API_ENDPOINT = 'https://api.majukoperasiku.my.id/manage/promos';

// Maps for displaying readable text
const rewardTypeMap: Record<PromotionReward['reward_type'], string> = {
    DISCOUNT_FIXED: 'Potongan Harga',
    DISCOUNT_PERCENTAGE: 'Diskon Persentase',
    FREE_VARIANT: 'Gratis Produk',
    FREE_RESOURCE: 'Gratis Sewa',
};

const statusStyles = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-slate-100 text-slate-600',
};

const PromotionManagement: React.FC<{ selectedBusinessUnit: BusinessUnit }> = ({ selectedBusinessUnit }) => {
    const { addNotification } = useNotification();
    const [promos, setPromos] = useState<Promotion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingPromo, setDeletingPromo] = useState<Promotion | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchPromos = useCallback(async () => {
        setIsLoading(true);
        setPromos([]); // Clear existing data to ensure only API data is shown

        if (!selectedBusinessUnit) {
            setIsLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_ENDPOINT}?business_id=${selectedBusinessUnit.id}`);
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Gagal memuat data promo');
            }
            if (result.code === 200 && Array.isArray(result.data.data)) {
                setPromos(result.data.data);
            }
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [selectedBusinessUnit, addNotification]);

    useEffect(() => {
        fetchPromos();
    }, [fetchPromos]);
    
    // Helper functions for formatting display
    const getStatus = (promo: Promotion): { text: string; style: string } => {
        if (promo.is_active === 1) {
            return { text: 'Aktif', style: statusStyles.active };
        }
        return { text: 'Tidak Aktif', style: statusStyles.inactive };
    };
    
    const formatDateRange = (start: string, end: string) => {
        const startDate = new Date(start).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        const endDate = new Date(end).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        return `${startDate} - ${endDate}`;
    };

    const formatRewardTypes = (rewards: PromotionReward[]) => {
        if (!rewards || rewards.length === 0) return 'N/A';
        const uniqueTypes = [...new Set(rewards.map(r => rewardTypeMap[r.reward_type] || r.reward_type))];
        return uniqueTypes.join(', ');
    };

    const formatRewardSummary = (rewards: PromotionReward[]) => {
        if (!rewards || rewards.length === 0) return '-';
        return rewards.map(reward => {
            switch (reward.reward_type) {
                case 'DISCOUNT_PERCENTAGE':
                    return `Diskon ${parseFloat(reward.value || '0').toLocaleString('id-ID')}%`;
                case 'DISCOUNT_FIXED':
                    return `Potongan Rp${parseFloat(reward.value || '0').toLocaleString('id-ID')}`;
                case 'FREE_VARIANT':
                    return `Gratis ${reward.quantity || '1'} Varian Produk`;
                case 'FREE_RESOURCE':
                    return `Gratis ${reward.quantity || '1'} Aset Sewa`;
                default:
                    return 'Hadiah tidak diketahui';
            }
        }).join('; ');
    };

    const formatConditionSummary = (conditions: PromotionCondition[]) => {
        if (!conditions || conditions.length === 0) return 'Tanpa syarat khusus';
        return conditions.map(cond => {
            switch (cond.condition_type) {
                case 'TOTAL_PURCHASE':
                    return cond.min_value ? `Min. Belanja Rp${parseFloat(cond.min_value).toLocaleString('id-ID')}` : 'Min. Total Pembelian';
                case 'PRODUCT_VARIANT':
                    return `Beli Varian Tertentu (min. ${cond.min_quantity || '1'} item)`;
                case 'PRODUCT_CATEGORY':
                    return `Beli dari Kategori Tertentu (min. ${cond.min_quantity || '1'} item)`;
                case 'PACKAGE':
                    return 'Beli Paket Tertentu';
                default:
                    return 'Syarat tidak diketahui';
            }
        }).join('; ');
    };

    const handleAdd = () => {
        setEditingPromo(null);
        setIsModalOpen(true);
    };
    const handleEdit = (promo: Promotion) => {
        setEditingPromo(promo);
        setIsModalOpen(true);
    };
    const handleDelete = (promo: Promotion) => {
        setDeletingPromo(promo);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingPromo) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`${API_ENDPOINT}/${deletingPromo.id}`, { method: 'DELETE' });
            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.message || 'Gagal menghapus promo');
            }
            addNotification(`Promo "${deletingPromo.name}" berhasil dihapus.`, 'success');
            await fetchPromos();
        } catch (error: any) {
            addNotification(error.message, 'error');
        } finally {
            setIsDeleting(false);
            setIsConfirmOpen(false);
            setDeletingPromo(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-bold text-slate-800">Manajemen Promo</h2>
                 <button onClick={handleAdd} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition disabled:opacity-50 text-sm">
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    Tambah Promo
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Promo</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipe Hadiah</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Periode Aktif</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ringkasan Hadiah</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Outlet</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ringkasan Syarat</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isLoading ? (
                                <tr><td colSpan={8} className="text-center py-10 text-slate-500">Memuat promo...</td></tr>
                            ) : promos.length > 0 ? (
                                promos.map((promo) => {
                                    const status = getStatus(promo);
                                    const outletCount = promo.outlets?.length || 0;
                                    return (
                                        <tr key={promo.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{promo.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatRewardTypes(promo.rewards)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDateRange(promo.start_date, promo.end_date)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700">{formatRewardSummary(promo.rewards)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500" title={promo.outlets?.map(o => o.name).join(', ')}>
                                                {outletCount > 0 ? `${outletCount} outlet` : 'Tidak ada outlet'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatConditionSummary(promo.conditions)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                 <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${status.style}`}>
                                                    {status.text}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleEdit(promo)} className="text-indigo-600 hover:text-indigo-900 mr-4"><EditIcon className="w-5 h-5"/></button>
                                                <button onClick={() => handleDelete(promo)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan={8} className="text-center py-10 text-slate-500">Tidak ada promo untuk unit usaha ini.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && <PromotionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={fetchPromos}
                promoToEdit={editingPromo}
                selectedBusinessUnit={selectedBusinessUnit}
            />}
            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Konfirmasi Hapus"
                message={`Anda yakin ingin menghapus promo "${deletingPromo?.name}"? Aksi ini tidak bisa dibatalkan.`}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default PromotionManagement;