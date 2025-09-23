
import React, { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import CustomerModal from './CustomerModal';
import { CustomerCategory, BusinessUnit } from '../types';
import { PlusIcon, EditIcon, TrashIcon, MagnifyingGlassIcon } from './icons/Icons';
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

// Tipe data untuk metadata paginasi dari API
interface PaginationInfo {
  current_page: number;
  next_page_url: string | null;
  prev_page_url: string | null;
  per_page: number;
  total: number;
  to: number;
}


const API_BASE_URL = 'https://api.majukoperasiku.my.id/manage';

interface CustomerManagementProps {
    selectedBusinessUnit: BusinessUnit;
}

// Main Component
const CustomerManagement: React.FC<CustomerManagementProps> = ({ selectedBusinessUnit }) => {
    const { addNotification } = useNotification();
    
    // State untuk data yang diambil dari API
    const [customers, setCustomers] = useState<ApiCustomer[]>([]);
    const [customerCategories, setCustomerCategories] = useState<CustomerCategory[]>([]);
    
    // State Paginasi
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    
    // State Pencarian
    const [searchKeyword, setSearchKeyword] = useState('');
    const [debouncedKeyword, setDebouncedKeyword] = useState('');

    // State untuk kontrol UI
    const [isLoading, setIsLoading] = useState({ customers: false, categories: true });
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<ApiCustomer | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [deletingCustomer, setDeletingCustomer] = useState<ApiCustomer | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Debounce effect for search keyword
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(searchKeyword);
            setCurrentPage(1); // Reset page on new search
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [searchKeyword]);

    // Fetch customer categories based on selected unit
    const fetchCustomerCategoriesForUnit = useCallback(async () => {
        if (!selectedBusinessUnit) {
            setCustomerCategories([]);
            return;
        }
        setIsLoading(prev => ({ ...prev, categories: true }));
        try {
            const response = await fetch(`${API_BASE_URL}/customer-category?business_id=${selectedBusinessUnit.id}`);
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
    }, [selectedBusinessUnit, addNotification]);

    useEffect(() => {
        fetchCustomerCategoriesForUnit();
    }, [fetchCustomerCategoriesForUnit]);
    
    // Mengambil data customer ketika unit usaha, halaman, item per halaman, atau keyword berubah
    const fetchCustomers = useCallback(async () => {
        if (!selectedBusinessUnit) {
            setCustomers([]);
            setPagination(null);
            return;
        }
        setIsLoading(prev => ({ ...prev, customers: true }));
        setError(null);
        try {
            const params = new URLSearchParams({
                business_id: String(selectedBusinessUnit.id),
                page: String(currentPage),
                per_page: String(perPage),
            });
            if (debouncedKeyword) {
                params.append('keyword', debouncedKeyword);
            }
            
            const url = `${API_BASE_URL}/customers?${params.toString()}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Gagal memuat data customer');
            const result = await response.json();
            
            if (result.code === 200 && result.data && typeof result.data === 'object') {
                setCustomers(result.data.data || []);
                const { data, ...paginationInfo } = result.data;
                setPagination(paginationInfo);
            } else {
                 setCustomers([]);
                 setPagination(null);
                 if (result.code !== 200) {
                    throw new Error(result.message || 'Format data customer tidak valid');
                 }
            }
        } catch (err: any) {
            setError(err.message);
            addNotification(`Gagal memuat customer: ${err.message}`, 'error');
            setCustomers([]);
            setPagination(null);
        } finally {
            setIsLoading(prev => ({ ...prev, customers: false }));
        }
    }, [selectedBusinessUnit, addNotification, currentPage, perPage, debouncedKeyword]);

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
            business_id: selectedBusinessUnit.id,
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
    
    const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPerPage(Number(e.target.value));
        setCurrentPage(1);
    };

    const fromItem = pagination ? (pagination.current_page - 1) * pagination.per_page + 1 : 0;
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-bold text-slate-800">Manajemen Customer</h2>
            </div>

             <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-auto md:flex-grow md:max-w-sm">
                   <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                   <input
                        type="text"
                        placeholder="Cari customer..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        className="h-10 w-full pl-10 pr-4 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex-shrink-0 flex items-center justify-center w-full md:w-auto h-10 px-4 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition"
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
                                        {debouncedKeyword ? 'Tidak ada customer yang cocok dengan pencarian.' : 'Tidak ada customer untuk unit usaha ini.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                 {pagination && pagination.total > 0 && (
                    <div className="px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600">Item per halaman:</span>
                            <select
                                value={perPage}
                                onChange={handlePerPageChange}
                                className="bg-white border border-slate-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                            >
                                <option value={15}>15</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                        <div className="text-sm text-slate-600">
                            Menampilkan {fromItem} - {pagination.to} dari {pagination.total} customer
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                disabled={!pagination.prev_page_url}
                                className="px-3 py-1 text-sm font-medium bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Sebelumnya
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                disabled={!pagination.next_page_url}
                                className="px-3 py-1 text-sm font-medium bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Berikutnya
                            </button>
                        </div>
                    </div>
                )}
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
