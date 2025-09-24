import React, { useState, useEffect, useMemo } from 'react';
import { Pengajuan, PengajuanItem } from '../types';
import { useNotification } from '../contexts/NotificationContext';
import { TrashIcon } from './icons/Icons';

const API_ENDPOINT = 'https://api.majukoperasiku.my.id/manage/budget-proposals';

interface PengajuanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    pengajuanToEdit: Pengajuan | null;
}

const PengajuanModal: React.FC<PengajuanModalProps> = ({ isOpen, onClose, onSave, pengajuanToEdit }) => {
    const { addNotification } = useNotification();
    const isEditing = !!pengajuanToEdit;

    const statusDisplayMap: Record<string, string> = {
        DRAFT: 'Draft',
        SUBMITTED: 'Diajukan',
        APPROVED: 'Diterima',
        REJECTED: 'Ditolak',
    };
    
    const statusStyles: Record<string, string> = {
        DRAFT: 'bg-slate-100 text-slate-700',
        SUBMITTED: 'bg-blue-100 text-blue-700',
        APPROVED: 'bg-green-100 text-green-700',
        REJECTED: 'bg-red-100 text-red-700',
    };

    const initialItem = { description: '', unit: '', quantity: 1, unit_price: 0, price_reference: '' };
    
    const [title, setTitle] = useState('');
    const [items, setItems] = useState<(Omit<PengajuanItem, 'id'> & { key: number })[]>([]);
    const [proposalFile, setProposalFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        if (isOpen) {
            setIsSubmitting(false);
            setProposalFile(null);
            if (isEditing && pengajuanToEdit) {
                setTitle(pengajuanToEdit.title);
                setItems(pengajuanToEdit.items.map((item, index) => ({ 
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total_price: item.total_price,
                    unit: item.unit || '',
                    price_reference: item.price_reference || '',
                    key: Date.now() + index 
                })));
            } else {
                setTitle('');
                setItems([{ ...initialItem, total_price: 0, key: Date.now() }]);
            }
        }
    }, [isOpen, isEditing, pengajuanToEdit]);
    
    const handleItemChange = (key: number, field: keyof typeof initialItem, value: string | number) => {
        setItems(prevItems => prevItems.map(item => {
            if (item.key === key) {
                const updatedItem = { ...item, [field]: value };
                updatedItem.total_price = Number(updatedItem.quantity) * Number(updatedItem.unit_price);
                return updatedItem;
            }
            return item;
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProposalFile(e.target.files[0]);
        } else {
            setProposalFile(null);
        }
    };

    const addItem = () => {
        setItems(prev => [...prev, { ...initialItem, total_price: 0, key: Date.now() }]);
    };

    const removeItem = (key: number) => {
        if(items.length > 1) {
            setItems(prev => prev.filter(item => item.key !== key));
        }
    };
    
    const totalAmount = useMemo(() => items.reduce((sum, item) => sum + (item.total_price || 0), 0), [items]);

    const handleSubmit = async (status: 'DRAFT' | 'SUBMITTED') => {
        if (!title || items.some(i => !i.description || !i.unit || i.quantity <= 0 || i.unit_price < 0)) {
            addNotification('Harap isi semua field yang wajib diisi (*).', 'error');
            return;
        }
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('status', status);
        formData.append('total_amount', String(totalAmount));
        formData.append('account_id', '1');

        if (proposalFile) {
            formData.append('file_proposal', proposalFile);
        }

        items.forEach((item, index) => {
            formData.append(`items[${index}][name]`, item.description);
            formData.append(`items[${index}][unit]`, item.unit || '');
            formData.append(`items[${index}][quantity]`, String(item.quantity));
            formData.append(`items[${index}][unit_price]`, String(item.unit_price));
            formData.append(`items[${index}][price_reference]`, item.price_reference || '');
        });
        
        const url = isEditing ? `${API_ENDPOINT}/${pengajuanToEdit.id}` : API_ENDPOINT;
        if (isEditing) {
            formData.append('_method', 'PUT');
        }
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: formData,
            });
            const result = await response.json();
            if (!response.ok) {
                const errorMessages = result.errors ? Object.values(result.errors).flat().join(' ') : result.message;
                throw new Error(errorMessages || 'Gagal menyimpan data');
            }
            
            addNotification(`Pengajuan berhasil ${isEditing ? 'diperbarui' : 'dibuat'}.`, 'success');
            onSave();
            onClose();
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;
    
    const modalTitle = isEditing ? `Ubah Pengajuan: ${pengajuanToEdit.submission_code}` : 'Buat Pengajuan RAB Baru';
    const isReadOnly = isEditing && pengajuanToEdit.status !== 'DRAFT' && pengajuanToEdit.status !== null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl my-8 p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 text-slate-800">{modalTitle}</h2>
                <div className="space-y-6">
                    {/* --- Informasi Dasar --- */}
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold text-lg text-slate-700 mb-4">Informasi Dasar</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600">Judul Pengajuan *</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} disabled={isReadOnly || isSubmitting} required className="input"/>
                            </div>
                             {isEditing && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-600">Status</label>
                                    <p className={`mt-2 font-semibold text-sm px-2 py-1 rounded-full inline-block ${statusStyles[pengajuanToEdit.status || 'DRAFT']}`}>
                                      {statusDisplayMap[pengajuanToEdit.status || 'DRAFT']}
                                    </p>
                                </div>
                            )}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-600">File Proposal (PDF, Word, Excel)</label>
                                <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx,.xls,.xlsx" disabled={isReadOnly || isSubmitting} className="input mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                            </div>
                        </div>
                    </div>
                    {/* --- Rincian Item --- */}
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold text-lg text-slate-700 mb-4">Rincian Anggaran</h3>
                        <div className="space-y-4">
                           {items.map((item, index) => (
                               <div key={item.key} className="p-4 border rounded-md bg-slate-50/50 relative space-y-4">
                                   {!isReadOnly && items.length > 1 && (
                                       <button type="button" onClick={() => removeItem(item.key)} disabled={isSubmitting} className="absolute top-3 right-3 text-red-500 hover:text-red-700 disabled:opacity-50 p-1 rounded-full hover:bg-red-100">
                                           <TrashIcon className="w-5 h-5"/>
                                       </button>
                                   )}

                                   <div>
                                       <label htmlFor={`description-${item.key}`} className="block text-sm font-medium text-slate-600">Deskripsi Item *</label>
                                       <input id={`description-${item.key}`} type="text" value={item.description} onChange={e => handleItemChange(item.key, 'description', e.target.value)} disabled={isReadOnly || isSubmitting} className="input" required/>
                                   </div>

                                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                       <div>
                                           <label htmlFor={`unit-${item.key}`} className="block text-sm font-medium text-slate-600">Satuan *</label>
                                           <input id={`unit-${item.key}`} type="text" placeholder="box, lusin, dll" value={item.unit} onChange={e => handleItemChange(item.key, 'unit', e.target.value)} disabled={isReadOnly || isSubmitting} className="input" required/>
                                       </div>
                                       <div>
                                           <label htmlFor={`quantity-${item.key}`} className="block text-sm font-medium text-slate-600">Qty *</label>
                                           <input id={`quantity-${item.key}`} type="number" value={item.quantity} onChange={e => handleItemChange(item.key, 'quantity', e.target.value)} disabled={isReadOnly || isSubmitting} className="input" min="1" required/>
                                       </div>
                                       <div>
                                           <label htmlFor={`unit_price-${item.key}`} className="block text-sm font-medium text-slate-600">Harga Satuan *</label>
                                           <input id={`unit_price-${item.key}`} type="number" value={item.unit_price} onChange={e => handleItemChange(item.key, 'unit_price', e.target.value)} disabled={isReadOnly || isSubmitting} className="input" min="0" required/>
                                       </div>
                                       <div>
                                           <label htmlFor={`total-${item.key}`} className="block text-sm font-medium text-slate-600">Total</label>
                                           <input id={`total-${item.key}`} type="text" value={`Rp${(item.total_price || 0).toLocaleString('id-ID')}`} readOnly className="input bg-slate-100 border-none"/>
                                       </div>
                                   </div>
                                   
                                   <div>
                                       <label htmlFor={`price_reference-${item.key}`} className="block text-sm font-medium text-slate-600">Referensi Harga</label>
                                       <input id={`price_reference-${item.key}`} type="text" value={item.price_reference} onChange={e => handleItemChange(item.key, 'price_reference', e.target.value)} disabled={isReadOnly || isSubmitting} className="input"/>
                                   </div>
                               </div>
                           ))}
                        </div>
                         {!isReadOnly && <button type="button" onClick={addItem} disabled={isSubmitting} className="btn-secondary text-sm mt-4 disabled:opacity-50">+ Tambah Item</button>}
                         <div className="mt-4 flex justify-end">
                            <div className="text-right">
                                <p className="text-sm text-slate-500">Total Keseluruhan</p>
                                <p className="text-2xl font-bold text-slate-800">Rp{totalAmount.toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                    </div>
                     {/* --- Aksi --- */}
                    <div className="flex justify-end space-x-3 mt-8">
                        <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>Tutup</button>
                        {!isReadOnly && (
                            <>
                                <button type="button" onClick={() => handleSubmit('DRAFT')} className="btn-secondary" disabled={isSubmitting}>Simpan sebagai Draft</button>
                                <button type="button" onClick={() => handleSubmit('SUBMITTED')} className="btn-primary w-32" disabled={isSubmitting}>
                                    {isSubmitting ? 'Mengajukan...' : 'Ajukan'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
             <style>{`.input { margin-top: 0.25rem; display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; transition: all 0.2s; } .input:disabled { background-color: #f1f5f9; cursor: not-allowed; } .btn-primary { padding: 0.5rem 1rem; background-color: #4f46e5; color: white; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; } .btn-primary:hover { background-color: #4338ca; } .btn-primary:disabled { background-color: #a5b4fc; cursor: not-allowed;} .btn-secondary { padding: 0.5rem 1rem; background-color: #e2e8f0; color: #1e293b; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; } .btn-secondary:hover { background-color: #cbd5e1; } .btn-secondary:disabled { background-color: #f1f5f9; cursor: not-allowed;}`}</style>
        </div>
    );
};

export default PengajuanModal;