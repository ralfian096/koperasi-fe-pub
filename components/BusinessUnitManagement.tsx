

import React, { useState, useEffect } from 'react';
import { BusinessUnit } from '../types';
import { EditIcon, TrashIcon, PlusIcon, ImagePlaceholderIcon } from './icons/Icons';
import { useNotification } from '../contexts/NotificationContext';
import ConfirmationModal from './ConfirmationModal';
import BusinessUnitModal from './BusinessUnitModal'; // Import the reusable modal

const API_STORAGE_URL = 'https://api.majukoperasiku.my.id/storage';
const API_ENDPOINT = 'https://api.majukoperasiku.my.id/manage/business';

const getFullLogoUrl = (path: string | null): string | null => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob:')) {
    return path;
  }
  return `${API_STORAGE_URL}/${path}`;
};

const ImageWithFallback: React.FC<{
  src: string | null;
  alt: string;
  className: string;
  fallbackClassName?: string;
}> = ({ src, alt, className, fallbackClassName }) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    if (src) {
      setError(false);
    }
  }, [src]);

  const handleError = () => {
    setError(true);
  };

  if (error || !src) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-slate-100">
        <ImagePlaceholderIcon className={fallbackClassName || 'w-full h-full text-slate-400 p-2'} />
      </div>
    );
  }

  return <img src={src} alt={alt} onError={handleError} className={className} />;
};

// Main Component
const BusinessUnitManagement: React.FC = () => {
    const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { addNotification } = useNotification();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<BusinessUnit | null>(null);

    // State for confirmation modal
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [deletingUnit, setDeletingUnit] = useState<BusinessUnit | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchBusinessUnits = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch(API_ENDPOINT);
            if (!response.ok) {
                throw new Error(`Gagal mengambil data: Status ${response.status}`);
            }
            const result = await response.json();
            if (result.code === 200 && result.data && Array.isArray(result.data.data)) {
                setBusinessUnits(result.data.data);
            } else {
                throw new Error(result.message || 'Format respons API tidak valid');
            }
        } catch (err: any) {
            setError(err.message);
            addNotification(`Gagal memuat data: ${err.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBusinessUnits();
    }, []);

    const handleOpenModal = (unit: BusinessUnit | null = null) => {
        setEditingUnit(unit);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUnit(null);
    };

    const handleSaveUnit = () => {
        fetchBusinessUnits(); // Always refetch data on save
    };

    const handleDeleteUnit = (unit: BusinessUnit) => {
        setDeletingUnit(unit);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingUnit) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`${API_ENDPOINT}/${deletingUnit.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                let errorMessage = `Server merespons dengan status ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // Ignore if response is not JSON
                }
                throw new Error(errorMessage);
            }

            addNotification(`Unit usaha "${deletingUnit.name}" berhasil dihapus.`, 'success');
            fetchBusinessUnits(); // Refresh the list
        } catch (err: any) {
            addNotification(`Gagal menghapus: ${err.message}`, 'error');
        } finally {
            setIsDeleting(false);
            setIsConfirmModalOpen(false);
            setDeletingUnit(null);
        }
    };
    
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Manajemen Unit Usaha</h2>
            
            <div className="flex justify-end">
                <button 
                    onClick={() => handleOpenModal()} 
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition"
                >
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    Tambah Unit Usaha
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Logo</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Unit Usaha</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kontak</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Jumlah Outlet</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isLoading ? (
                                <tr><td colSpan={7} className="text-center py-10 text-slate-500">Memuat data...</td></tr>
                            ) : error && businessUnits.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-10 text-red-500">Error: {error}</td></tr>
                            ) : businessUnits.length > 0 ? businessUnits.map((unit) => (
                                <tr key={unit.id}>
                                    <td className="px-6 py-4">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border">
                                            <ImageWithFallback
                                                src={getFullLogoUrl(unit.logo)}
                                                alt={unit.name}
                                                className="h-full w-full object-cover"
                                                fallbackClassName="w-6 h-6 text-slate-400"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{unit.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{unit.email || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{unit.contact || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-center">{unit.outlets?.length || 0}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            unit.is_active === '1' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {unit.is_active === '1' ? 'Aktif' : 'Tidak Aktif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(unit)} className="text-red-600 hover:text-red-900 mr-4"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteUnit(unit)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-slate-500">
                                        Tidak ada unit usaha yang ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <BusinessUnitModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveUnit} unit={editingUnit} />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Konfirmasi Hapus"
                message={`Apakah Anda yakin ingin menghapus unit usaha "${deletingUnit?.name}"? Aksi ini tidak dapat dibatalkan.`}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default BusinessUnitManagement;