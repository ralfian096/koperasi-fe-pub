import React, { useState, useEffect, useCallback } from 'react';
import { BusinessUnit, Promotion } from '../types';
import { useNotification } from '../contexts/NotificationContext';
import { TrashIcon, PlusIcon } from './icons/Icons';

const API_BASE_URL = 'https://api.majukoperasiku.my.id/manage';

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  promoToEdit: Promotion | null;
  selectedBusinessUnit: BusinessUnit;
}

// Local types for form state
type RewardItem = { key: number; reward_type: string; value: string; target_id: string; quantity: string; unit_id: string };
type ConditionItem = { key: number; condition_type: string; min_value: string; target_id: string; min_quantity: string };
type ScheduleItem = { key: number; day_of_week: number; start_time: string; end_time: string };
type DependencyData = { outlets: any[]; products: any[]; productCategories: any[]; units: any[] };

const daysOfWeek = [
    { value: 0, label: 'Minggu' }, { value: 1, label: 'Senin' }, { value: 2, label: 'Selasa' },
    { value: 3, label: 'Rabu' }, { value: 4, label: 'Kamis' }, { value: 5, label: 'Jumat' },
    { value: 6, label: 'Sabtu' }
];

const PromotionModal: React.FC<PromotionModalProps> = ({ isOpen, onClose, onSave, promoToEdit, selectedBusinessUnit }) => {
    const { addNotification } = useNotification();
    const isEditing = !!promoToEdit;
    
    const getInitialState = useCallback(() => ({
        name: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        is_cumulative: false,
        is_active: 1, // Default to active
        outlet_ids: [] as number[],
        rewards: [{ key: Date.now(), reward_type: 'DISCOUNT_PERCENTAGE', value: '', target_id: '', quantity: '1', unit_id: '' }] as RewardItem[],
        conditions: [{ key: Date.now(), condition_type: 'TOTAL_PURCHASE', min_value: '', target_id: '', min_quantity: '' }] as ConditionItem[],
        schedules: [] as ScheduleItem[],
    }), []);

    const [formState, setFormState] = useState(getInitialState());
    const [dependencies, setDependencies] = useState<DependencyData>({ outlets: [], products: [], productCategories: [], units: [] });
    const [isLoading, setIsLoading] = useState({ deps: false, submit: false });
    const [mainRewardType, setMainRewardType] = useState<'DISCOUNT' | 'FREE_ITEM'>('DISCOUNT');

    useEffect(() => {
        if (!isOpen) return;

        const fetchDependencies = async () => {
            setIsLoading(p => ({ ...p, deps: true }));
            try {
                const [outletsRes, productsRes, categoriesRes, unitsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/outlets?business_id=${selectedBusinessUnit.id}`),
                    fetch(`${API_BASE_URL}/products?business_id=${selectedBusinessUnit.id}&product_type=CONSUMPTION`),
                    fetch(`${API_BASE_URL}/product-categories?business_id=${selectedBusinessUnit.id}`),
                    fetch(`${API_BASE_URL}/units`),
                ]);
                const outlets = await outletsRes.json();
                const products = await productsRes.json();
                const productCategories = await categoriesRes.json();
                const units = await unitsRes.json();

                setDependencies({
                    outlets: outlets.data?.data || [],
                    products: products.data?.data || [],
                    productCategories: productCategories.data?.data || [],
                    units: units.data?.data || [],
                });

                if (isEditing && promoToEdit) {
                    const firstRewardType = promoToEdit.rewards[0]?.reward_type;
                    const rewardCategory = ['DISCOUNT_FIXED', 'DISCOUNT_PERCENTAGE'].includes(firstRewardType) ? 'DISCOUNT' : 'FREE_ITEM';
                    setMainRewardType(rewardCategory);

                    setFormState({
                        name: promoToEdit.name,
                        description: promoToEdit.description || '',
                        start_date: promoToEdit.start_date,
                        end_date: promoToEdit.end_date,
                        is_cumulative: !!Number(promoToEdit.is_cumulative),
                        is_active: Number(promoToEdit.is_active),
                        outlet_ids: promoToEdit.outlets?.map(o => o.id) || [],
                        rewards: promoToEdit.rewards.map((r, i) => ({ ...r, key: Date.now() + i, value: r.value || '', target_id: r.target_id || '', quantity: r.quantity || '1', unit_id: r.unit_id || '' })),
                        conditions: promoToEdit.conditions.map((c, i) => ({ ...c, key: Date.now() + i, min_value: c.min_value || '', target_id: c.target_id || '', min_quantity: c.min_quantity || '' })),
                        schedules: promoToEdit.schedules.length > 0 ? promoToEdit.schedules.map((s, i) => ({ ...s, day_of_week: Number(s.day_of_week), key: Date.now() + i })) : [],
                    });
                } else {
                    setFormState(getInitialState());
                    setMainRewardType('DISCOUNT');
                }

            } catch (err: any) {
                addNotification(`Gagal memuat data pendukung: ${err.message}`, 'error');
                onClose();
            } finally {
                setIsLoading(p => ({ ...p, deps: false }));
            }
        };
        fetchDependencies();
    }, [isOpen, selectedBusinessUnit, isEditing, promoToEdit, addNotification, onClose, getInitialState]);
    
    // --- Generic Handlers ---
    const handleFormChange = (field: keyof typeof formState, value: any) => setFormState(p => ({ ...p, [field]: value }));
    const handleDynamicChange = <T,>(key: 'rewards' | 'conditions' | 'schedules', itemKey: number, field: keyof T, value: any) => {
        setFormState(p => ({
            ...p,
            [key]: p[key].map(item => item.key === itemKey ? { ...item, [field]: value } : item)
        }));
    };
    const addDynamicItem = (key: 'rewards' | 'conditions' | 'schedules') => {
        const newItem = key === 'rewards' ? { key: Date.now(), reward_type: 'FREE_VARIANT', value: '', target_id: '', quantity: '1', unit_id: '' }
                    : key === 'conditions' ? { key: Date.now(), condition_type: 'TOTAL_PURCHASE', min_value: '', target_id: '', min_quantity: '' }
                    : { key: Date.now(), day_of_week: 1, start_time: '00:00', end_time: '23:59' };
        setFormState(p => ({ ...p, [key]: [...p[key], newItem as any] }));
    };
    const removeDynamicItem = (key: 'rewards' | 'conditions' | 'schedules', itemKey: number) => {
        setFormState(p => ({ ...p, [key]: p[key].filter(item => item.key !== itemKey) }));
    };
    const handleOutletToggle = (outletId: number) => {
        handleFormChange('outlet_ids', 
            formState.outlet_ids.includes(outletId)
                ? formState.outlet_ids.filter(id => id !== outletId)
                : [...formState.outlet_ids, outletId]
        );
    };

    const handleMainRewardTypeChange = (type: 'DISCOUNT' | 'FREE_ITEM') => {
        setMainRewardType(type);
        if (type === 'DISCOUNT') {
            setFormState(p => ({ ...p, rewards: [{ key: Date.now(), reward_type: 'DISCOUNT_PERCENTAGE', value: '', target_id: '', quantity: '1', unit_id: '' }] }));
        } else {
            setFormState(p => ({ ...p, rewards: [{ key: Date.now(), reward_type: 'FREE_VARIANT', value: '', target_id: '', quantity: '1', unit_id: '' }] }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(p => ({ ...p, submit: true }));
        try {
            const payload = {
                business_id: selectedBusinessUnit.id,
                name: formState.name,
                description: formState.description || null,
                start_date: formState.start_date,
                end_date: formState.end_date,
                is_cumulative: formState.is_cumulative,
                is_active: formState.is_active,
                outlet_ids: formState.outlet_ids,
                rewards: formState.rewards.map(({ key, ...r }) => ({ 
                    ...r, 
                    value: ['DISCOUNT_PERCENTAGE', 'DISCOUNT_FIXED'].includes(r.reward_type) ? r.value : null,
                    target_id: ['FREE_VARIANT', 'FREE_RESOURCE'].includes(r.reward_type) ? r.target_id : null,
                    quantity: ['FREE_VARIANT', 'FREE_RESOURCE'].includes(r.reward_type) ? r.quantity : null,
                    unit_id: r.reward_type === 'FREE_RESOURCE' ? r.unit_id : null
                })),
                conditions: formState.conditions.map(({ key, ...c }) => ({
                    ...c,
                    min_value: c.condition_type === 'TOTAL_PURCHASE' ? c.min_value : null,
                    target_id: ['PRODUCT_VARIANT', 'PRODUCT_CATEGORY', 'PACKAGE'].includes(c.condition_type) ? c.target_id : null,
                    min_quantity: ['PRODUCT_VARIANT', 'PRODUCT_CATEGORY'].includes(c.condition_type) ? c.min_quantity : null,
                })),
                schedules: formState.schedules.map(({ key, ...s }) => s),
            };

            const url = isEditing ? `${API_BASE_URL}/promos/${promoToEdit.id}` : `${API_BASE_URL}/promos`;
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();

            if (!response.ok) {
                const errorMessages = result.errors ? Object.values(result.errors).flat().join(' ') : result.message;
                throw new Error(errorMessages || 'Gagal menyimpan promo');
            }
            
            addNotification(`Promo "${payload.name}" berhasil ${isEditing ? 'diperbarui' : 'dibuat'}.`, 'success');
            onSave();
            onClose();

        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setIsLoading(p => ({ ...p, submit: false }));
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl my-8 p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-6 text-slate-800 flex-shrink-0">{isEditing ? 'Ubah Promo' : 'Buat Promo Baru'}</h2>
                
                {isLoading.deps ? <div className="text-center py-10">Memuat data...</div> : (
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2 space-y-6">
                    {/* 1. Basic Info */}
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold text-lg text-slate-700 mb-4">Informasi Dasar</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="Nama Promo *" value={formState.name} onChange={e => handleFormChange('name', e.target.value)} className="input md:col-span-2" required />
                            <input type="text" placeholder="Deskripsi (Opsional)" value={formState.description} onChange={e => handleFormChange('description', e.target.value)} className="input md:col-span-2" />
                            <div><label className="text-sm">Tanggal Mulai *</label><input type="date" value={formState.start_date} onChange={e => handleFormChange('start_date', e.target.value)} className="input" required /></div>
                            <div><label className="text-sm">Tanggal Selesai *</label><input type="date" value={formState.end_date} onChange={e => handleFormChange('end_date', e.target.value)} className="input" min={formState.start_date} required /></div>
                             <div>
                                <label className="text-sm">Status Promo</label>
                                <select name="is_active" value={formState.is_active} onChange={e => handleFormChange('is_active', Number(e.target.value))} className="input">
                                    <option value={1}>Aktif</option>
                                    <option value={0}>Tidak Aktif</option>
                                </select>
                            </div>
                            <label className="flex items-center space-x-2 self-end mb-1"><input type="checkbox" checked={formState.is_cumulative} onChange={e => handleFormChange('is_cumulative', e.target.checked)} className="h-4 w-4 rounded" /><span>Promo bersifat kumulatif</span></label>
                        </div>
                    </div>
                    
                    {/* 2. Outlets */}
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold text-lg text-slate-700 mb-2">Outlet Berlaku *</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                            {dependencies.outlets.map(o => (<label key={o.id} className="flex items-center space-x-2"><input type="checkbox" checked={formState.outlet_ids.includes(o.id)} onChange={() => handleOutletToggle(o.id)} /><span>{o.name}</span></label>))}
                        </div>
                    </div>

                    {/* 3. Conditions */}
                    <div className="p-4 border rounded-lg space-y-3">
                        <h3 className="font-semibold text-lg text-slate-700">Syarat Promo *</h3>
                        {formState.conditions.map(c => (
                            <div key={c.key} className="p-3 border rounded-md bg-slate-50 grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                                <select value={c.condition_type} onChange={e => handleDynamicChange('conditions', c.key, 'condition_type', e.target.value)} className="input"><option value="TOTAL_PURCHASE">Min. Pembelian</option><option value="PRODUCT_VARIANT">Beli Produk</option><option value="PRODUCT_CATEGORY">Beli Kategori</option></select>
                                {c.condition_type === 'TOTAL_PURCHASE' && <input type="number" placeholder="Min. nilai Rp" value={c.min_value} onChange={e => handleDynamicChange('conditions', c.key, 'min_value', e.target.value)} className="input" />}
                                {c.condition_type === 'PRODUCT_VARIANT' && <><select value={c.target_id} onChange={e => handleDynamicChange('conditions', c.key, 'target_id', e.target.value)} className="input"><option value="">Pilih Produk</option>{dependencies.products.map(p => <option key={p.product_id} value={p.product_id}>{p.name}</option>)}</select><input type="number" placeholder="Min. Qty" value={c.min_quantity} onChange={e => handleDynamicChange('conditions', c.key, 'min_quantity', e.target.value)} className="input" /></>}
                                {c.condition_type === 'PRODUCT_CATEGORY' && <><select value={c.target_id} onChange={e => handleDynamicChange('conditions', c.key, 'target_id', e.target.value)} className="input"><option value="">Pilih Kategori</option>{dependencies.productCategories.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><input type="number" placeholder="Min. Qty" value={c.min_quantity} onChange={e => handleDynamicChange('conditions', c.key, 'min_quantity', e.target.value)} className="input" /></>}
                                <button type="button" onClick={() => removeDynamicItem('conditions', c.key)} className="text-red-500 justify-self-end"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        ))}
                        <button type="button" onClick={() => addDynamicItem('conditions')} className="btn-secondary text-sm">+ Tambah Syarat</button>
                    </div>

                    {/* 4. Rewards */}
                    <div className="p-4 border rounded-lg space-y-3">
                        <h3 className="font-semibold text-lg text-slate-700">Hadiah Promo *</h3>
                        <div className="flex border-b">
                            <button type="button" onClick={() => handleMainRewardTypeChange('DISCOUNT')} className={`px-4 py-2 text-sm font-semibold ${mainRewardType === 'DISCOUNT' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-500'}`}>Potongan Harga</button>
                            <button type="button" onClick={() => handleMainRewardTypeChange('FREE_ITEM')} className={`px-4 py-2 text-sm font-semibold ${mainRewardType === 'FREE_ITEM' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-500'}`}>Gratis Produk</button>
                        </div>
                        <div className="pt-2">
                        {mainRewardType === 'DISCOUNT' && (
                            <div className="p-3 border rounded-md bg-slate-50 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                <input type="number" placeholder="Nilai" value={formState.rewards[0]?.value || ''} onChange={e => handleDynamicChange('rewards', formState.rewards[0].key, 'value', e.target.value)} className="input" required />
                                <select value={formState.rewards[0]?.reward_type || 'DISCOUNT_PERCENTAGE'} onChange={e => handleDynamicChange('rewards', formState.rewards[0].key, 'reward_type', e.target.value)} className="input">
                                    <option value="DISCOUNT_PERCENTAGE">Persen (%)</option>
                                    <option value="DISCOUNT_FIXED">Rupiah (Fix)</option>
                                </select>
                            </div>
                        )}
                        {mainRewardType === 'FREE_ITEM' && formState.rewards.map(r => (
                            <div key={r.key} className="p-3 border rounded-md bg-slate-50 grid grid-cols-1 md:grid-cols-3 gap-2 items-end mb-2">
                                <select value={r.target_id} onChange={e => handleDynamicChange('rewards', r.key, 'target_id', e.target.value)} className="input" required><option value="">Pilih Produk</option>{dependencies.products.map(p => <option key={p.product_id} value={p.product_id}>{p.name}</option>)}</select>
                                <input type="number" placeholder="Jumlah" value={r.quantity} onChange={e => handleDynamicChange('rewards', r.key, 'quantity', e.target.value)} className="input" required min="1" />
                                <button type="button" onClick={() => removeDynamicItem('rewards', r.key)} className="text-red-500 justify-self-end"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        ))}
                         {mainRewardType === 'FREE_ITEM' && <button type="button" onClick={() => addDynamicItem('rewards')} className="btn-secondary text-sm mt-2">+ Tambah Hadiah</button>}
                        </div>
                    </div>
                    
                    {/* 5. Schedules */}
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold text-lg text-slate-700 mb-4">Jadwal Berlaku</h3>
                        <div className="space-y-2">
                        {formState.schedules.map(s => (
                            <div key={s.key} className="grid grid-cols-1 md:grid-cols-4 items-center gap-2">
                                <select value={s.day_of_week} onChange={e => handleDynamicChange('schedules', s.key, 'day_of_week', Number(e.target.value))} className="input md:col-span-2">
                                    {daysOfWeek.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                </select>
                                <input type="time" value={s.start_time} onChange={e => handleDynamicChange('schedules', s.key, 'start_time', e.target.value)} className="input"/>
                                <div className="flex items-center gap-2">
                                    <input type="time" value={s.end_time} onChange={e => handleDynamicChange('schedules', s.key, 'end_time', e.target.value)} className="input"/>
                                    <button type="button" onClick={() => removeDynamicItem('schedules', s.key)} className="text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            </div>
                        ))}
                        </div>
                        <button type="button" onClick={() => addDynamicItem('schedules')} className="btn-secondary text-sm mt-4">+ Tambah Jadwal</button>
                    </div>
                    
                    {/* --- Actions --- */}
                    <div className="flex-shrink-0 pt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} disabled={isLoading.submit} className="btn-secondary">Batal</button>
                        <button type="submit" disabled={isLoading.submit} className="btn-primary w-40">{isLoading.submit ? 'Menyimpan...' : 'Simpan Promo'}</button>
                    </div>
                </form>
                )}
            </div>
            <style>{`.input { display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; } .btn-primary { padding: 0.5rem 1rem; background-color: #e7000b; color: white; border-radius: 0.5rem; font-weight: 600; } .btn-primary:disabled { background-color: #fca5a5; cursor: not-allowed;} .btn-secondary { padding: 0.5rem 1rem; background-color: #e2e8f0; color: #1e293b; border-radius: 0.5rem; font-weight: 600; }`}</style>
        </div>
    );
};

export default PromotionModal;