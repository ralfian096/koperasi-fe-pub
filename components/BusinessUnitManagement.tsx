
import React, { useState, useEffect } from 'react';
import usePosData from '../hooks/usePosData';
import { BusinessUnit } from '../types';
import { EditIcon, TrashIcon, PlusIcon } from './icons/Icons';

// Modal Component for Business Unit
const BusinessUnitModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (unit: Omit<BusinessUnit, 'id'> | BusinessUnit) => void;
  unit: BusinessUnit | null;
}> = ({ isOpen, onClose, onSave, unit }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
        setName(unit?.name || '');
    }
  }, [unit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === '') return;
    if (unit) {
      onSave({ ...unit, name });
    } else {
      onSave({ name });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">{unit ? 'Ubah Unit Usaha' : 'Tambah Unit Usaha Baru'}</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-600">Nama Unit Usaha</label>
            <input type="text" name="name" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Batal</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Component
const BusinessUnitManagement: React.FC = () => {
    const { businessUnits, addBusinessUnit, updateBusinessUnit, deleteBusinessUnit } = usePosData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<BusinessUnit | null>(null);

    const handleOpenModal = (unit: BusinessUnit | null = null) => {
        setEditingUnit(unit);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUnit(null);
    };

    const handleSaveUnit = (unitData: Omit<BusinessUnit, 'id'> | BusinessUnit) => {
        if ('id' in unitData) {
            updateBusinessUnit(unitData);
        } else {
            addBusinessUnit(unitData);
        }
    };

    const handleDeleteUnit = (unitId: string) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus unit usaha ini? Semua outlet dan data terkait akan ikut terhapus.')) {
            deleteBusinessUnit(unitId);
        }
    };
    
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Manajemen Unit Usaha</h2>
            
            <div className="flex justify-end">
                <button 
                    onClick={() => handleOpenModal()} 
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition"
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
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Unit Usaha</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {businessUnits.length > 0 ? businessUnits.map((unit) => (
                                <tr key={unit.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{unit.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(unit)} className="text-indigo-600 hover:text-indigo-900 mr-4"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteUnit(unit.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={2} className="text-center py-10 text-slate-500">
                                        Tidak ada unit usaha yang dibuat.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <BusinessUnitModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveUnit} unit={editingUnit} />
        </div>
    );
};

export default BusinessUnitManagement;