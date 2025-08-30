
import React, { useState, useEffect, useMemo } from 'react';
import usePosData from '../hooks/usePosData';
import { Outlet } from '../types';
import { EditIcon, TrashIcon, PlusIcon } from './icons/Icons';

// Modal Component for Outlet
const OutletModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (outlet: Omit<Outlet, 'id'> | Outlet) => void;
  outlet: Outlet | null;
}> = ({ isOpen, onClose, onSave, outlet }) => {
  const { businessUnits } = usePosData();
  const [formData, setFormData] = useState({
    name: '',
    businessUnitId: ''
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: outlet?.name || '',
        businessUnitId: outlet?.businessUnitId || (businessUnits[0]?.id || '')
      });
    }
  }, [outlet, isOpen, businessUnits]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() === '' || formData.businessUnitId === '') return;
    if (outlet) {
      onSave({ ...outlet, ...formData });
    } else {
      onSave(formData);
    }
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">{outlet ? 'Ubah Outlet' : 'Tambah Outlet Baru'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-600">Nama Outlet</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div>
            <label htmlFor="businessUnitId" className="block text-sm font-medium text-slate-600">Unit Usaha Induk</label>
            <select name="businessUnitId" id="businessUnitId" value={formData.businessUnitId} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100">
                {businessUnits.length > 0 ? businessUnits.map(unit => (
                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                )) : (
                    <option value="" disabled>Buat Unit Usaha terlebih dahulu</option>
                )}
            </select>
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Batal</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700" disabled={businessUnits.length === 0}>Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Component
const OutletManagement: React.FC = () => {
    const { outlets, businessUnits, addOutlet, updateOutlet, deleteOutlet } = usePosData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);

    const businessUnitMap = useMemo(() =>
        businessUnits.reduce((acc, unit) => {
            acc[unit.id] = unit.name;
            return acc;
        }, {} as Record<string, string>),
    [businessUnits]);

    const handleOpenModal = (outlet: Outlet | null = null) => {
        setEditingOutlet(outlet);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingOutlet(null);
    };

    const handleSaveOutlet = (outletData: Omit<Outlet, 'id'> | Outlet) => {
        if ('id' in outletData) {
            updateOutlet(outletData);
        } else {
            addOutlet(outletData);
        }
    };

    const handleDeleteOutlet = (outletId: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus outlet ini? Semua data terkait (produk, transaksi, dll) akan ikut terhapus.')) {
            deleteOutlet(outletId);
        }
    };
    
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Manajemen Outlet</h2>
            
            <div className="flex justify-end">
                <button 
                    onClick={() => handleOpenModal()} 
                    className={`flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition ${businessUnits.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={businessUnits.length === 0}
                >
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    Tambah Outlet
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Outlet</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Unit Usaha Induk</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {outlets.length > 0 ? outlets.map((outlet) => (
                                <tr key={outlet.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{outlet.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{businessUnitMap[outlet.businessUnitId] || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(outlet)} className="text-indigo-600 hover:text-indigo-900 mr-4"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteOutlet(outlet.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} className="text-center py-10 text-slate-500">
                                        Tidak ada outlet yang dibuat.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <OutletModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveOutlet} outlet={editingOutlet} />
        </div>
    );
};

export default OutletManagement;