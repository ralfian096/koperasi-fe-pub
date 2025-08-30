
import React, { useState, useMemo, useEffect } from 'react';
import usePosData from '../hooks/usePosData';
import { ProductCategory } from '../types';
import { EditIcon, TrashIcon, PlusIcon } from './icons/Icons';

// Modal Component for Category
const CategoryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Omit<ProductCategory, 'id' | 'outletId'> | ProductCategory) => void;
  category: ProductCategory | null;
}> = ({ isOpen, onClose, onSave, category }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
        setName(category?.name || '');
    }
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === '') return;
    if (category) {
      onSave({ ...category, name });
    } else {
      onSave({ name });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">{category ? 'Ubah Kategori' : 'Tambah Kategori Baru'}</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-600">Nama Kategori</label>
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
const ProductCategoryManagement: React.FC = () => {
    const { businessUnits, outlets, categories, addCategory, updateCategory, deleteCategory } = usePosData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);

    const [selectedUnit, setSelectedUnit] = useState<string>(businessUnits[0]?.id || '');
    const [selectedOutlet, setSelectedOutlet] = useState<string>('');

    const availableOutlets = useMemo(() => {
        return outlets.filter(o => o.businessUnitId === selectedUnit);
    }, [selectedUnit, outlets]);
    
    useEffect(() => {
        if (availableOutlets.length > 0) {
            // Cek apakah outlet yang dipilih saat ini masih ada di daftar yang tersedia
            const currentOutletExists = availableOutlets.some(o => o.id === selectedOutlet);
            if (!currentOutletExists) {
                setSelectedOutlet(availableOutlets[0].id);
            }
        } else {
            setSelectedOutlet('');
        }
    }, [selectedUnit, availableOutlets, selectedOutlet]);

    const filteredCategories = useMemo(() => {
        if (!selectedOutlet) return [];
        return categories.filter(c => c.outletId === selectedOutlet);
    }, [categories, selectedOutlet]);

    const handleOpenModal = (category: ProductCategory | null = null) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    const handleSaveCategory = (categoryData: Omit<ProductCategory, 'id' | 'outletId'> | ProductCategory) => {
        if ('id' in categoryData) {
            updateCategory(categoryData);
        } else {
            if (selectedOutlet) {
                addCategory({ ...categoryData, outletId: selectedOutlet });
            }
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <h2 className="text-3xl font-bold text-slate-800">Manajemen Kategori Produk</h2>
                 <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <select
                      value={selectedUnit}
                      onChange={(e) => setSelectedUnit(e.target.value)}
                      className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {businessUnits.map(unit => (
                        <option key={unit.id} value={unit.id}>{unit.name}</option>
                      ))}
                    </select>
                    <select
                       value={selectedOutlet}
                       onChange={(e) => setSelectedOutlet(e.target.value)}
                       className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                       disabled={availableOutlets.length === 0}
                    >
                       {availableOutlets.map(outlet => (
                        <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
                      ))}
                    </select>
                 </div>
            </div>
            
            <div className="flex justify-end">
                <button 
                    onClick={() => handleOpenModal()} 
                    className={`flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition ${!selectedOutlet ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!selectedOutlet}
                >
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    Tambah Kategori
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Kategori</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredCategories.length > 0 ? filteredCategories.map((category) => (
                                <tr key={category.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{category.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(category)} className="text-indigo-600 hover:text-indigo-900 mr-4"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => deleteCategory(category.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={2} className="text-center py-10 text-slate-500">
                                        {selectedOutlet ? 'Tidak ada kategori untuk outlet ini.' : 'Silakan pilih unit usaha dan outlet.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <CategoryModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveCategory} category={editingCategory} />
        </div>
    );
};

export default ProductCategoryManagement;
