

import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import CustomerModal from './CustomerModal';
import { CustomerCategory } from '../types';
import { PlusIcon, EditIcon, TrashIcon } from './icons/Icons';
import ConfirmationModal from './ConfirmationModal';


// Tipe data lokal untuk respons API
interface ApiCustomer {
  id: number;
  name: string;
  phone_number: string;
  email: string | null;
  address: string | null;
  customer_category_id?: number | null;
  category: {
    id: number;
    name: string;
  } | null;
  business: {
    id: number;
    name: string;
  };
}

interface ApiBusinessUnit {
    id: number;
    name: string;
}

const API_BASE_URL = 'https://api.majukoperasiku.my.id/manage';

// Main Component
const CustomerManagement: React.FC = () => {
    const { addNotification } = useNotification();
    
    // State untuk data yang diambil dari API
    const [businessUnits, setBusinessUnits] = useState<ApiBusinessUnit[]>([]);
    const [customers, setCustomers] = useState<ApiCustomer[]>([]);
    const [customerCategories, setCustomerCategories] = useState<CustomerCategory[]>([]);
    
    // State untuk kontrol UI
    const [selectedUnit, setSelectedUnit] = useState<string>('');
    const [isLoading, setIsLoading] = useState({ units: true, customers: false, categories: true });
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<ApiCustomer | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [deletingCustomer, setDeletingCustomer] = useState<ApiCustomer | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch customer categories based on selected unit
    const fetchCustomerCategoriesForUnit = useCallback(async () => {
        if (!selectedUnit) {
            setCustomerCategories([]);
            return;
        }
        setIsLoading(prev => ({ ...prev, categories: true }));
        try {
            const response = await fetch(`${API_BASE_URL}/customer-category?business_id=${selectedUnit}`);
            if (!response.ok) throw new Error('Gagal memuat kategori customer');
            const result = await response.json();
            if (result.code === 200 && result.data && Array.isArray(result.data.data)) {
                setCustomerCategories(result.data.data);
            } else {
                setCustomerCategories([]);
            }
        } catch (err: any) {
            addNotification(`Gagal memuat kategori: ${err.message}`, 'error');
            setCustomerCategories([]);
        } finally {
            setIsLoading(prev => ({ ...prev, categories: false }));
        }
    }, [selectedUnit, addNotification]);

    useEffect(() => {
        fetchCustomerCategoriesForUnit();
    }, [fetchCustomerCategoriesForUnit]);

    // Mengambil data unit usaha untuk dropdown
    useEffect(() => {
        const fetchBusinessUnits = async () => {
            setIsLoading(prev => ({ ...prev, units: true }));
            try {
                const response = await fetch(`${API_BASE_URL}/business/summary`);
                if (!response.ok) throw new Error('Gagal memuat unit bisnis');
                const result = await response.json();
                if (result.code === 200 && result.data && Array.isArray(result.data.data)) {
                    setBusinessUnits(result.data.data);
                    if (result.data.data.length > 0) {
                        setSelectedUnit(String(result.data.data[0].id));
                    }
                } else {
                    throw new Error(result.message || 'Format data unit bisnis tidak valid');
                }
            } catch (err: any) {
                setError(err.message);
                addNotification(`Gagal memuat unit bisnis: ${err.message}`, 'error');
            } finally {
                setIsLoading(prev => ({ ...prev, units: false }));
            }
        };
        fetchBusinessUnits();
    }, [addNotification]);
    
    // Mengambil data customer ketika unit usaha dipilih
    const fetchCustomers = useCallback(async () => {
        if (!selectedUnit) {
            setCustomers([]);
            return;
        }
        setIsLoading(prev => ({ ...prev, customers: true }));
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/customers?business_id=${selectedUnit}`);
            if (!response.ok) throw new Error('Gagal memuat data customer');
            const result = await response.json();
            
            if (result.code === 200 && result.data && Array.isArray(result.data.data)) {
                setCustomers(result.data.data);
            } else {
                 setCustomers([]);
                 if (result.code !== 200) {
                    throw new Error(result.message || 'Format data customer tidak valid');
                 }
            }
        } catch (err: any) {
            setError(err.message);
            addNotification(`Gagal memuat customer: ${err.message}`, 'error');
            setCustomers([]);
        } finally {
            setIsLoading(prev => ({ ...prev, customers: false }));
        }
    }, [selectedUnit, addNotification]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    const handleOpenModal = (customer: ApiCustomer | null = null) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
    };

    const handleSaveCustomer = async (formData: any, customerId: number | null) => {
        const isEditing = customerId !== null;
        const url = isEditing ? `${API_BASE_URL}/customers/${customerId}` : `${API_BASE_URL}/customers`;
        const method = isEditing ? 'PUT' : 'POST';

        const payload = {
            ...formData,
            business_id: Number(selectedUnit),
            customer_category_id: formData.customer_category_id ? Number(formData.customer_category_id) : null,
        };

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok) {
                if (response.status === 422 && result.errors) {
                    const errorMessages = Object.values(result.errors).flat().join(' ');
                    throw new Error(errorMessages);
                }
                throw new Error(result.message || 'Gagal menyimpan customer');
            }
            
            addNotification(`Customer berhasil ${isEditing ? 'diperbarui' : 'ditambahkan'}.`, 'success');
            handleCloseModal();
            await fetchCustomers();
        } catch (error: any) {
            addNotification(`Gagal menyimpan: ${error.message}`, 'error');
            throw error;
        }
    };
    
     const handleDeleteCustomer = (customer: ApiCustomer) => {
        setDeletingCustomer(customer);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingCustomer) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/customers/${deletingCustomer.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.message || `Gagal menghapus. Status: ${response.status}`);
            }
            addNotification(`Customer "${deletingCustomer.name}" berhasil dihapus.`, 'success');
            await fetchCustomers();
        } catch (error: any) {
            addNotification(`Gagal menghapus: ${error.message}`, 'error');
        } finally {
            setIsDeleting(false);
            setIsConfirmModalOpen(false);
            setDeletingCustomer(null);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-bold text-slate-800">Manajemen Customer</h2>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <select 
                        value={selectedUnit} 
                        onChange={(e) => setSelectedUnit(e.target.value)} 
                        className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                        disabled={isLoading.units || businessUnits.length === 0}
                    >
                      {isLoading.units ? (
                          <option>Memuat unit bisnis...</option>
                      ) : businessUnits.length === 0 ? (
                          <option>Tidak ada unit bisnis</option>
                      ) : (
                        businessUnits.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)
                      )}
                    </select>
                </div>
            </div>

             <div className="flex justify-end">
                <button 
                    onClick={() => handleOpenModal()}
                    className={`flex items-center px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition ${!selectedUnit ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!selectedUnit}
                >
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
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kategori</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Unit Usaha</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isLoading.customers ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-slate-500">Memuat customer...</td>
                                </tr>
                            ) : error && customers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-red-500">{error}</td>
                                </tr>
                            ) : customers.length > 0 ? (
                                customers.map((customer) => (
                                <tr key={customer.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{customer.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{customer.phone_number}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{customer.email || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{customer.category?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{customer.business.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(customer)} className="text-red-600 hover:text-red-900 mr-4"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteCustomer(customer)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-slate-500">
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
                customerToEdit={editingCustomer}
                categories={customerCategories}
                isLoadingCategories={isLoading.categories}
            />
             <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Konfirmasi Hapus"
                message={`Apakah Anda yakin ingin menghapus customer "${deletingCustomer?.name}"? Aksi ini tidak dapat dibatalkan.`}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default CustomerManagement;
