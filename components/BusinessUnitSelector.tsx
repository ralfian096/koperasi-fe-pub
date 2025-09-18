import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { BusinessUnit } from '../types';
import BusinessUnitModal from './BusinessUnitModal';
import ConfirmationModal from './ConfirmationModal';
import { useNotification } from '../contexts/NotificationContext';
import { 
    BuildingOffice2Icon, 
    StarIcon, 
    BuildingStorefrontIcon, 
    EllipsisHorizontalIcon,
    Squares2X2Icon,
    Bars3Icon,
    MagnifyingGlassIcon,
    EditIcon,
    TrashIcon
} from './icons/Icons';

const API_ENDPOINT = 'https://api.majukoperasiku.my.id/manage/business';

const BusinessUnitCard: React.FC<{
    unit: BusinessUnit;
    onSelect: (unit: BusinessUnit) => void;
    onToggleMenu: (event: React.MouseEvent, unit: BusinessUnit) => void;
}> = ({ unit, onSelect, onToggleMenu }) => {
    
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 flex flex-col p-5 space-y-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            {/* Card Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-lg">
                        <BuildingOffice2Icon className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">{unit.name}</h3>
                        {unit.is_active === '1' && (
                            <span className="text-xs font-semibold inline-block py-1 px-2.5 leading-none text-center whitespace-nowrap align-baseline rounded-full bg-green-100 text-green-700 mt-1">
                                Aktif
                            </span>
                        )}
                    </div>
                </div>
                <button className="text-slate-400 hover:text-amber-500">
                    <StarIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Card Stats */}
            <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 flex items-center justify-center bg-violet-50 rounded-full">
                        <BuildingStorefrontIcon className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800 text-base">{unit.outlets?.length || 0}</p>
                        <p className="text-xs text-slate-500">Jumlah Outlet</p>
                    </div>
                </div>
            </div>

            {/* Card Footer */}
            <div className="flex items-center gap-2 pt-4 !mt-auto">
                <button 
                  data-menu-button="true"
                  onClick={(e) => onToggleMenu(e, unit)}
                  className="h-10 w-10 flex items-center justify-center border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                    <EllipsisHorizontalIcon className="w-5 h-5" />
                </button>
                <button className="h-10 px-4 border border-slate-300 rounded-lg text-slate-800 font-semibold text-sm flex-1 hover:bg-slate-100">
                    Ringkasan
                </button>
                <button 
                    onClick={() => onSelect(unit)}
                    className="h-10 px-4 bg-indigo-600 text-white rounded-lg font-semibold text-sm flex-1 hover:bg-indigo-700 transition-colors"
                >
                    Buka Portal
                </button>
            </div>
        </div>
    );
};

const BusinessUnitListItem: React.FC<{
    unit: BusinessUnit;
    onSelect: (unit: BusinessUnit) => void;
    onToggleMenu: (event: React.MouseEvent, unit: BusinessUnit) => void;
}> = ({ unit, onSelect, onToggleMenu }) => {
     return (
        <tr className="bg-white hover:bg-slate-50 transition-colors">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-4">
                     <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-slate-100 rounded-md">
                        <BuildingOffice2Icon className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-slate-900">{unit.name}</div>
                        <div className={`text-xs font-medium inline-block py-0.5 px-2 rounded-full mt-1 ${unit.is_active === '1' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                           {unit.is_active === '1' ? 'Aktif' : 'Nonaktif'}
                        </div>
                    </div>
                </div>
            </td>
             <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{unit.outlets?.length || 0} Outlet</td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                 <div className="flex items-center justify-end gap-2">
                    <button 
                      data-menu-button="true"
                      onClick={(e) => onToggleMenu(e, unit)}
                      className="h-9 w-9 flex items-center justify-center border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100"
                    >
                        <EllipsisHorizontalIcon className="w-5 h-5" />
                    </button>
                    <button className="h-9 px-4 border border-slate-300 rounded-lg text-slate-800 font-semibold text-sm flex-1 hover:bg-slate-100">
                        Ringkasan
                    </button>
                    <button 
                        onClick={() => onSelect(unit)}
                        className="h-9 px-4 bg-indigo-600 text-white rounded-lg font-semibold text-sm flex-1 hover:bg-indigo-700 transition-colors"
                    >
                        Buka Portal
                    </button>
                </div>
            </td>
        </tr>
     );
};

interface BusinessUnitSelectorProps {
    onSelectUnit: (unit: BusinessUnit) => void;
}

const BusinessUnitSelector: React.FC<BusinessUnitSelectorProps> = ({ onSelectUnit }) => {
    const { addNotification } = useNotification();
    const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
    const [searchQuery, setSearchQuery] = useState('');
    
    // State for modals and the dynamic action menu
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<BusinessUnit | null>(null);
    const [deletingUnit, setDeletingUnit] = useState<BusinessUnit | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
    const [menuUnit, setMenuUnit] = useState<BusinessUnit | null>(null);
    
    const fetchBusinessUnits = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(API_ENDPOINT);
            if (!response.ok) throw new Error('Gagal memuat data unit usaha');
            const result = await response.json();
            if (result.code === 200 && result.data && Array.isArray(result.data.data)) {
                setBusinessUnits(result.data.data);
            } else {
                throw new Error(result.message || 'Format data tidak valid');
            }
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);
    
    useEffect(() => {
        fetchBusinessUnits();
    }, [fetchBusinessUnits]);
    
    const closeMenu = useCallback(() => {
        setOpenMenuId(null);
        setMenuUnit(null);
        setMenuPosition(null);
    }, []);
    
    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('[data-menu-button="true"]') && !target.closest('[data-menu-content="true"]')) {
                closeMenu();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [closeMenu]);

    const filteredBusinessUnits = useMemo(() => {
        if (!searchQuery) return businessUnits;
        return businessUnits.filter(unit =>
            unit.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [businessUnits, searchQuery]);

    const handleToggleMenu = (event: React.MouseEvent, unit: BusinessUnit) => {
        event.stopPropagation();

        if (openMenuId === unit.id) {
            closeMenu();
            return;
        }

        const buttonRect = event.currentTarget.getBoundingClientRect();
        const { innerWidth, innerHeight } = window;

        const menuWidth = 160; // w-40 -> 10rem -> 160px
        const menuHeight = 80; // Approximate height
        const margin = 8;

        let top = buttonRect.bottom + 4; // Position below button
        let left = buttonRect.left;

        if (left + menuWidth > innerWidth - margin) {
            left = buttonRect.right - menuWidth;
        }

        if (top + menuHeight > innerHeight - margin) {
            top = buttonRect.top - menuHeight - 4; // Position above button
        }

        if (left < margin) left = margin;
        if (top < margin) top = margin;

        setMenuPosition({ top, left });
        setOpenMenuId(unit.id);
        setMenuUnit(unit);
    };

    const handleOpenAddModal = () => setIsAddModalOpen(true);
    
    const handleEdit = (unit: BusinessUnit) => {
        closeMenu();
        setEditingUnit(unit);
    };

    const handleDelete = (unit: BusinessUnit) => {
        closeMenu();
        setDeletingUnit(unit);
        setIsConfirmModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setEditingUnit(null);
    };

    const handleSave = () => {
        fetchBusinessUnits();
    };

    const handleConfirmDelete = async () => {
        if (!deletingUnit) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`${API_ENDPOINT}/${deletingUnit.id}`, { method: 'DELETE' });
            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.message || 'Gagal menghapus unit usaha');
            }
            addNotification(`Unit usaha "${deletingUnit.name}" berhasil dihapus.`, 'success');
            await fetchBusinessUnits();
        } catch (error: any) {
            addNotification(`Gagal menghapus: ${error.message}`, 'error');
        } finally {
            setIsDeleting(false);
            setIsConfirmModalOpen(false);
            setDeletingUnit(null);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return <div className="text-center py-12 text-slate-500">Memuat data unit usaha...</div>;
        }
        if (filteredBusinessUnits.length === 0) {
            return (
                 <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                    <p className="text-slate-500">{searchQuery ? 'Tidak ada hasil yang cocok.' : 'Tidak ada unit usaha yang ditemukan.'}</p>
                     <button onClick={handleOpenAddModal} className="mt-4 h-10 px-4 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors">
                        + Tambah Usaha Baru
                    </button>
                </div>
            );
        }
        
        if (viewMode === 'list') {
             return (
                <div className="bg-white rounded-lg shadow-sm border border-slate-200/80">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                             <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit Usaha</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Outlets</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredBusinessUnits.map(unit => (
                                    <BusinessUnitListItem
                                        key={unit.id}
                                        unit={unit}
                                        onSelect={onSelectUnit}
                                        onToggleMenu={handleToggleMenu}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredBusinessUnits.map(unit => (
                    <BusinessUnitCard 
                        key={unit.id} 
                        unit={unit} 
                        onSelect={onSelectUnit}
                        onToggleMenu={handleToggleMenu}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* View Switcher */}
                <div className="flex items-center bg-slate-200 p-1 rounded-lg">
                    <button 
                        onClick={() => setViewMode('card')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${viewMode === 'card' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                    >
                        <Squares2X2Icon className="w-5 h-5" />
                        Kartu
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
                    >
                        <Bars3Icon className="w-5 h-5" />
                        Daftar
                    </button>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Cari unit usaha..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-10 pl-10 pr-4 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
                        />
                    </div>
                     <button onClick={handleOpenAddModal} className="h-10 px-4 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold text-sm hover:bg-slate-100">
                        Tambah Usaha
                    </button>
                </div>
            </header>
            
            {renderContent()}

            {/* Render Action Menu at the top level */}
            {openMenuId && menuUnit && menuPosition && (
                <div
                    data-menu-content="true"
                    style={{
                        position: 'fixed',
                        top: `${menuPosition.top}px`,
                        left: `${menuPosition.left}px`,
                    }}
                    className="w-40 bg-white rounded-md shadow-lg z-20 border border-slate-200 animate-fade-in-up"
                >
                    <div className="py-1">
                        <button 
                            onClick={() => handleEdit(menuUnit)} 
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-3 transition-colors"
                        >
                            <EditIcon className="w-4 h-4" /> Ubah
                        </button>
                        <button 
                            onClick={() => handleDelete(menuUnit)} 
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                        >
                            <TrashIcon className="w-4 h-4" /> Hapus
                        </button>
                    </div>
                </div>
            )}
            
            <BusinessUnitModal
                isOpen={isAddModalOpen || editingUnit !== null}
                onClose={handleCloseModal}
                onSave={handleSave}
                unit={editingUnit}
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Konfirmasi Hapus"
                message={`Anda yakin ingin menghapus unit usaha "${deletingUnit?.name}"? Aksi ini akan menghapus semua data terkait (outlet, produk, dll.) dan tidak dapat dibatalkan.`}
                isLoading={isDeleting}
            />
            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default BusinessUnitSelector;