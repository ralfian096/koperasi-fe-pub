
import React, { useState, useEffect } from 'react';
import { CustomerCategory } from '../types';

interface ApiCustomer {
    id: number;
    name: string;
    phone_number: string;
    email: string | null;
    address: string | null;
    category?: {
        id: number;
        name: string;
    } | null;
}

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: any, customerId: number | null) => Promise<void>;
  categories: CustomerCategory[];
  isLoadingCategories: boolean;
  customerToEdit: ApiCustomer | null;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    categories, 
    isLoadingCategories,
    customerToEdit
}) => {
  
  const isEditing = customerToEdit !== null;

  const initialFormState = {
    name: '',
    phone_number: '',
    email: '',
    address: '',
    customer_category_id: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && customerToEdit) {
        setFormData({
            name: customerToEdit.name,
            phone_number: customerToEdit.phone_number,
            email: customerToEdit.email || '',
            address: customerToEdit.address || '',
            customer_category_id: String(customerToEdit.category?.id || ''),
        });
      } else {
        setFormData(initialFormState);
      }
      setIsSaving(false);
    }
  }, [isOpen, customerToEdit, isEditing]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        await onSave(formData, isEditing ? customerToEdit.id : null);
    } catch (error) {
        console.error("Save failed:", error);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">
            {isEditing ? 'Ubah Customer' : 'Tambah Customer Baru'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-600">Nama Customer *</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required disabled={isSaving} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"/>
                </div>
                 <div>
                    <label htmlFor="phone_number" className="block text-sm font-medium text-slate-600">No. Telepon *</label>
                    <input type="tel" name="phone_number" id="phone_number" value={formData.phone_number} onChange={handleChange} required disabled={isSaving} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"/>
                </div>
            </div>
             <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-600">Email</label>
                <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} disabled={isSaving} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"/>
            </div>
             <div>
                <label htmlFor="address" className="block text-sm font-medium text-slate-600">Alamat</label>
                <textarea name="address" id="address" value={formData.address} onChange={handleChange} rows={2} disabled={isSaving} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"/>
            </div>
             <div>
                <label htmlFor="customer_category_id" className="block text-sm font-medium text-slate-600">Kategori Customer</label>
                <select name="customer_category_id" id="customer_category_id" value={formData.customer_category_id} onChange={handleChange} disabled={isLoadingCategories || isSaving} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 disabled:bg-slate-100">
                   <option value="">-- Pilih Kategori (Opsional) --</option>
                   {isLoadingCategories ? (
                       <option>Memuat kategori...</option>
                   ) : (
                       categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                   )}
                </select>
            </div>
            <div className="mt-8 flex justify-end space-x-3">
                <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 disabled:opacity-50">Batal</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 w-28 disabled:opacity-50 disabled:cursor-wait">
                    {isSaving ? 'Menyimpan...' : 'Simpan'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;
