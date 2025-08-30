import React, { useState, useMemo, useEffect } from 'react';
import usePosData from '../hooks/usePosData';
import { Customer, CustomerCategory } from '../types';
import { EditIcon, TrashIcon, PlusIcon } from './icons/Icons';

// Modal Component
const CustomerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id' | 'businessUnitId'> | Customer) => void;
  customer: Customer | null;
  categories: CustomerCategory[];
}> = ({ isOpen, onClose, onSave, customer, categories }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    categoryId: '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: customer?.name || '',
        phone: customer?.phone || '',
        categoryId: customer?.categoryId || (categories[0]?.id || ''),
      });
    }
  }, [customer, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customer) {
      onSave({ ...customer, ...formData });
    } else {
      onSave(formData as Omit<Customer, 'id' | 'businessUnitId'>);
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
        <h2 className="text-2xl font-bold mb-6 text-slate-800">{customer ? 'Ubah Customer' : 'Tambah Customer Baru'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-600">Nama Customer</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"/>
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-600">Nomor Telepon</label>
            <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"/>
          </div>
           <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-slate-600">Kategori</label>
            <select name="categoryId" id="categoryId" value={formData.categoryId} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" disabled={categories.length === 0}>
                {categories.length > 0 ? categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>) : <option>Buat Kategori dulu</option>}
            </select>
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Batal</button>
            <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Component
const CustomerManagement: React.FC = () => {
    const { businessUnits, customers, customerCategories, addCustomer, updateCustomer, deleteCustomer } = usePosData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    
    const [selectedUnit, setSelectedUnit] = useState<string>(businessUnits[0]?.id || '');

    const filteredCustomers = useMemo(() => {
        if (!selectedUnit) return [];
        return customers.filter(c => c.businessUnitId === selectedUnit);
    }, [customers, selectedUnit]);

    const categoryMap = React.useMemo(() => 
        customerCategories.reduce((acc, cat) => {
            acc[cat.id] = cat.name;
            return acc;
        }, {} as Record<string, string>),
    [customerCategories]);

    const handleOpenModal = (customer: Customer | null = null) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };
    const handleCloseModal = () => setIsModalOpen(false);

    const handleSaveCustomer = (customerData: Omit<Customer, 'id' | 'businessUnitId'> | Customer) => {
        if ('id' in customerData) {
            updateCustomer(customerData);
        } else {
            addCustomer({ ...customerData, businessUnitId: selectedUnit });
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-bold text-slate-800">Manajemen Customer</h2>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500">
                      {businessUnits.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={() => handleOpenModal()} className={`flex items-center px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition ${!selectedUnit ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!selectedUnit}>
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    Tambah Customer
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">No. Telepon</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kategori</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{customer.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{customer.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{categoryMap[customer.categoryId] || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(customer)} className="text-red-600 hover:text-red-900 mr-4"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => deleteCustomer(customer.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                            {filteredCustomers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-slate-500">
                                        {selectedUnit ? 'Tidak ada customer untuk unit usaha ini.' : 'Silakan pilih unit usaha.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <CustomerModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                onSave={handleSaveCustomer} 
                customer={editingCustomer}
                categories={customerCategories}
            />
        </div>
    );
};

export default CustomerManagement;