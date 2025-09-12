import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { EditIcon, TrashIcon, PlusIcon } from './icons/Icons';
import { useNotification } from '../contexts/NotificationContext';
import ConfirmationModal from './ConfirmationModal';

// --- API Endpoints ---
const API_BASE_URL = 'https://api.majukoperasiku.my.id/manage';
const API_BUSINESS_SUMMARY_ENDPOINT = `${API_BASE_URL}/business/summary`;
const API_OUTLETS_ENDPOINT = `${API_BASE_URL}/outlets`;
const API_PRODUCTS_ENDPOINT = `${API_BASE_URL}/products`;
const API_PRODUCT_CATEGORIES_ENDPOINT = `${API_BASE_URL}/product-categories`;
const API_CUSTOMER_CATEGORIES_ENDPOINT = `${API_BASE_URL}/customer-category`;
const API_UNITS_ENDPOINT = `${API_BASE_URL}/units`;


// --- Type Definitions for API data ---
interface ApiBusinessUnit {
    id: number;
    name: string;
    outlets: { id: number; name: string }[];
}

interface ApiProductCategory { id: number; name: string; }
interface ApiCustomerCategory { id: number; name: string; }
interface ApiUnit { unit_id: number; name: string; type: string; }
interface ApiOutlet { id: number; name: string; }

interface ApiProduct {
    id: number;
    name: string;
    product_type: 'CONSUMPTION' | 'RENTAL';
    category: { id: number; name: string; } | null;
    variants: any[]; // Simplified for list view
    resources: any[]; // Simplified for list view
    outlet?: { id: number; name: string }; // Optional for list view
}

// --- Local State Types for Form ---
type PricingRule = { key: number; customer_category_id: string; price: string; unit_id: string };
type AvailabilityRule = { key: number; day_of_week: string; start_time: string; end_time: string };
type Variant = { key: number; name: string; sku: string; stock_quantity: string; pricing: PricingRule[]; };
type Resource = { key: number; name: string; availability: AvailabilityRule[]; pricing: PricingRule[]; };

const initialFormState = {
    business_id: '',
    name: '',
    description: '',
    product_type: 'CONSUMPTION' as 'CONSUMPTION' | 'RENTAL',
    category_id: '',
    variants: [{ key: Date.now(), name: '', sku: '', stock_quantity: '', pricing: [{ key: Date.now(), customer_category_id: '', unit_id: '', price: '' }] }],
    resources: [],
};


const ProductModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    businessUnitId: string;
}> = ({ isOpen, onClose, onSave, businessUnitId }) => {
    
    const { addNotification } = useNotification();
    const [isLoading, setIsLoading] = useState(false);
    const [formState, setFormState] = useState(() => ({...initialFormState, business_id: businessUnitId}));
    
    // Dropdown data states
    const [productCategories, setProductCategories] = useState<ApiProductCategory[]>([]);
    const [customerCategories, setCustomerCategories] = useState<ApiCustomerCategory[]>([]);
    const [units, setUnits] = useState<ApiUnit[]>([]);
    const [outletsForBusiness, setOutletsForBusiness] = useState<ApiOutlet[]>([]);
    const [outletForCategory, setOutletForCategory] = useState('');

    const daysOfWeek = [
        { value: '1', label: 'Senin' }, { value: '2', label: 'Selasa' }, { value: '3', label: 'Rabu' },
        { value: '4', label: 'Kamis' }, { value: '5', label: 'Jumat' }, { value: '6', label: 'Sabtu' },
        { value: '0', label: 'Minggu' },
    ];

    // Fetch dependent data on modal open
    useEffect(() => {
        if (!isOpen || !businessUnitId) return;

        const fetchDependencies = async () => {
             setIsLoading(true);
            try {
                const [custCatRes, unitRes, outletsRes] = await Promise.all([
                    fetch(`${API_CUSTOMER_CATEGORIES_ENDPOINT}?business_id=${businessUnitId}`),
                    fetch(API_UNITS_ENDPOINT),
                    fetch(`${API_OUTLETS_ENDPOINT}?business_id=${businessUnitId}`),
                ]);

                const custCatResult = await custCatRes.json();
                setCustomerCategories(custCatResult.data?.data || []);

                const unitResult = await unitRes.json();
                setUnits(unitResult.data?.data || []);
                
                const outletsResult = await outletsRes.json();
                const fetchedOutlets = outletsResult.data?.data || [];
                setOutletsForBusiness(fetchedOutlets);
                if (fetchedOutlets.length > 0) {
                    setOutletForCategory(String(fetchedOutlets[0].id));
                }

            } catch (err: any) {
                addNotification(`Gagal memuat data pendukung: ${err.message}`, 'error');
                onClose();
            } finally {
                setIsLoading(false);
            }
        };
        fetchDependencies();
    }, [isOpen, businessUnitId, addNotification, onClose]);

    // Fetch product categories when the selected outlet for categories changes
    useEffect(() => {
        if (!outletForCategory) {
            setProductCategories([]);
            return;
        }
        const fetchCategories = async () => {
            try {
                const catRes = await fetch(`${API_PRODUCT_CATEGORIES_ENDPOINT}?outlet_id=${outletForCategory}`);
                const catResult = await catRes.json();
                setProductCategories(catResult.data?.data || []);
            } catch (err: any) {
                addNotification(`Gagal memuat kategori produk: ${err.message}`, 'error');
            }
        }
        fetchCategories();
    }, [outletForCategory, addNotification]);

    const resetState = useCallback(() => {
        setFormState({...initialFormState, business_id: businessUnitId});
        setOutletForCategory('');
    }, [businessUnitId]);

    const handleClose = () => {
        resetState();
        onClose();
    };
    
    // --- Form Handlers ---
    const handleFormChange = (field: keyof typeof formState, value: any) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleProductTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const type = e.target.value as 'CONSUMPTION' | 'RENTAL';
        setFormState(prev => ({
            ...prev,
            product_type: type,
            variants: type === 'CONSUMPTION' ? [{ key: Date.now(), name: '', sku: '', stock_quantity: '', pricing: [{ key: Date.now(), customer_category_id: '', unit_id: '', price: '' }] }] : [],
            resources: type === 'RENTAL' ? [{ key: Date.now(), name: '', availability: [{ key: Date.now(), day_of_week: '1', start_time: '08:00', end_time: '22:00' }], pricing: [{ key: Date.now(), customer_category_id: '', unit_id: '', price: '' }] }] : [],
        }));
    };

    // --- Dynamic Handlers for Nested Arrays ---
    const addVariant = () => setFormState(s => ({ ...s, variants: [...s.variants, { key: Date.now(), name: '', sku: '', stock_quantity: '', pricing: [{ key: Date.now(), customer_category_id: '', unit_id: '', price: '' }] }] }));
    const removeVariant = (key: number) => setFormState(s => ({ ...s, variants: s.variants.filter(i => i.key !== key) }));
    const handleVariantChange = (key: number, field: keyof Variant, value: any) => setFormState(s => ({ ...s, variants: s.variants.map(i => i.key === key ? { ...i, [field]: value } : i) }));
    const addVariantPricing = (vKey: number) => setFormState(s => ({ ...s, variants: s.variants.map(i => i.key === vKey ? { ...i, pricing: [...i.pricing, { key: Date.now(), customer_category_id: '', unit_id: '', price: '' }] } : i)}));
    const removeVariantPricing = (vKey: number, pKey: number) => setFormState(s => ({...s, variants: s.variants.map(i => i.key === vKey ? { ...i, pricing: i.pricing.filter(p => p.key !== pKey) } : i)}));
    const handleVariantPricingChange = (vKey: number, pKey: number, field: keyof PricingRule, value: any) => setFormState(s => ({ ...s, variants: s.variants.map(i => i.key === vKey ? { ...i, pricing: i.pricing.map(p => p.key === pKey ? { ...p, [field]: value } : p) } : i) }));

    const addResource = () => setFormState(s => ({ ...s, resources: [...s.resources, { key: Date.now(), name: '', availability: [{ key: Date.now(), day_of_week: '1', start_time: '08:00', end_time: '22:00' }], pricing: [{ key: Date.now(), customer_category_id: '', unit_id: '', price: '' }] }] }));
    const removeResource = (key: number) => setFormState(s => ({ ...s, resources: s.resources.filter(i => i.key !== key) }));
    const handleResourceChange = (key: number, field: keyof Resource, value: any) => setFormState(s => ({ ...s, resources: s.resources.map(i => i.key === key ? { ...i, [field]: value } : i)}));
    const addResourceAvailability = (rKey: number) => setFormState(s => ({...s, resources: s.resources.map(i => i.key === rKey ? { ...i, availability: [...i.availability, { key: Date.now(), day_of_week: '1', start_time: '08:00', end_time: '22:00' }] } : i)}));
    const removeResourceAvailability = (rKey: number, aKey: number) => setFormState(s => ({...s, resources: s.resources.map(i => i.key === rKey ? { ...i, availability: i.availability.filter(a => a.key !== aKey) } : i)}));
    const handleResourceAvailabilityChange = (rKey: number, aKey: number, field: keyof AvailabilityRule, value: any) => setFormState(s => ({...s, resources: s.resources.map(i => i.key === rKey ? { ...i, availability: i.availability.map(a => a.key === aKey ? { ...a, [field]: value } : a) } : i)}));
    const addResourcePricing = (rKey: number) => setFormState(s => ({...s, resources: s.resources.map(i => i.key === rKey ? { ...i, pricing: [...i.pricing, { key: Date.now(), customer_category_id: '', unit_id: '', price: '' }] } : i)}));
    const removeResourcePricing = (rKey: number, pKey: number) => setFormState(s => ({...s, resources: s.resources.map(i => i.key === rKey ? { ...i, pricing: i.pricing.filter(p => p.key !== pKey) } : i)}));
    const handleResourcePricingChange = (rKey: number, pKey: number, field: keyof PricingRule, value: any) => setFormState(s => ({...s, resources: s.resources.map(i => i.key === rKey ? { ...i, pricing: i.pricing.map(p => p.key === pKey ? { ...p, [field]: value } : p) } : i)}));


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const payload: any = {
                business_id: Number(formState.business_id),
                category_id: formState.category_id ? Number(formState.category_id) : null,
                name: formState.name,
                product_type: formState.product_type,
                description: formState.description || null,
            };

            if (formState.product_type === 'CONSUMPTION') {
                payload.variants = formState.variants.map(v => ({
                    name: v.name,
                    sku: v.sku || null,
                    stock_quantity: v.stock_quantity ? Number(v.stock_quantity) : null,
                    pricing: v.pricing.map(p => ({
                        customer_category_id: Number(p.customer_category_id),
                        price: Number(p.price),
                    })),
                }));
            } else { // RENTAL
                payload.resources = formState.resources.map(r => ({
                    name: r.name,
                    availability: r.availability.map(a => ({
                        day_of_week: Number(a.day_of_week),
                        start_time: a.start_time,
                        end_time: a.end_time,
                    })),
                    pricing: r.pricing.map(p => ({
                        customer_category_id: Number(p.customer_category_id),
                        unit_id: Number(p.unit_id),
                        price: Number(p.price),
                    })),
                }));
            }
            
            const res = await fetch(API_PRODUCTS_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await res.json();
            if (!res.ok) {
                const errorMessages = result.errors ? Object.values(result.errors).flat().join(' ') : result.message;
                throw new Error(errorMessages || 'Gagal membuat produk');
            }

            addNotification('Produk baru berhasil dibuat!', 'success');
            onSave();
            handleClose();
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl my-8 p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Tambah Produk Baru</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Bagian 1: Informasi Dasar */}
                <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg text-slate-700 mb-4">Informasi Dasar Produk</h3>
                    <div className="space-y-4">
                        <input type="hidden" value={formState.business_id} />
                        <div>
                            <label className="block text-sm font-medium text-slate-600">Nama Produk *</label>
                            <input type="text" value={formState.name} onChange={e => handleFormChange('name', e.target.value)} required className="input" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600">Deskripsi</label>
                            <textarea value={formState.description} onChange={e => handleFormChange('description', e.target.value)} rows={2} className="input" />
                        </div>
                        <fieldset>
                            <legend className="block text-sm font-medium text-slate-600 mb-1">Jenis Produk *</legend>
                            <div className="flex gap-4">
                                <label className="flex items-center"><input type="radio" name="product_type" value="CONSUMPTION" checked={formState.product_type === 'CONSUMPTION'} onChange={handleProductTypeChange} className="radio" /> <span className="ml-2">Barang (Consumption)</span></label>
                                <label className="flex items-center"><input type="radio" name="product_type" value="RENTAL" checked={formState.product_type === 'RENTAL'} onChange={handleProductTypeChange} className="radio" /> <span className="ml-2">Sewa (Rental)</span></label>
                            </div>
                        </fieldset>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600">Outlet (untuk Kategori)</label>
                                <select value={outletForCategory} onChange={e => setOutletForCategory(e.target.value)} className="input" disabled={outletsForBusiness.length === 0}>
                                    {outletsForBusiness.length > 0 ? outletsForBusiness.map(o => <option key={o.id} value={o.id}>{o.name}</option>) : <option>Tidak ada outlet</option>}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600">Kategori Produk</label>
                                <select value={formState.category_id} onChange={e => handleFormChange('category_id', e.target.value)} className="input" disabled={!outletForCategory}>
                                    <option value="">Tanpa Kategori</option>
                                    {productCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bagian 2A: Detail Produk CONSUMPTION */}
                {formState.product_type === 'CONSUMPTION' && (
                    <div className="p-4 border rounded-lg space-y-4">
                        <h3 className="font-semibold text-lg text-slate-700">Varian Produk</h3>
                        {formState.variants.map((variant, vIndex) => (
                            <div key={variant.key} className="p-4 border rounded-md space-y-4 bg-slate-50/50">
                                <div className="flex justify-between items-center"><p className="font-medium text-slate-800">Varian #{vIndex + 1}</p>{formState.variants.length > 1 && <button type="button" onClick={() => removeVariant(variant.key)} className="text-red-500"><TrashIcon className="w-5 h-5"/></button>}</div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <input type="text" placeholder="Nama Varian *" value={variant.name} onChange={e => handleVariantChange(variant.key, 'name', e.target.value)} className="input" required/>
                                    <input type="text" placeholder="SKU" value={variant.sku} onChange={e => handleVariantChange(variant.key, 'sku', e.target.value)} className="input" />
                                    <input type="number" placeholder="Jumlah Stok" value={variant.stock_quantity} onChange={e => handleVariantChange(variant.key, 'stock_quantity', e.target.value)} className="input" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-slate-700 mb-2">Aturan Harga Varian</h4>
                                    {variant.pricing.map(price => (
                                        <div key={price.key} className="grid grid-cols-3 gap-2 items-center mb-2">
                                            <select value={price.customer_category_id} onChange={e => handleVariantPricingChange(variant.key, price.key, 'customer_category_id', e.target.value)} className="input" required><option value="">Pilih Kategori Customer</option>{customerCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                                            <input type="number" placeholder="Harga *" value={price.price} onChange={e => handleVariantPricingChange(variant.key, price.key, 'price', e.target.value)} className="input" required />
                                            <button type="button" onClick={() => removeVariantPricing(variant.key, price.key)} className="text-red-500 justify-self-end"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => addVariantPricing(variant.key)} className="btn-secondary text-xs">+ Tambah Aturan Harga</button>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addVariant} className="btn-secondary text-sm">Tambah Varian</button>
                    </div>
                )}
                
                {/* Bagian 2B: Detail Produk RENTAL */}
                {formState.product_type === 'RENTAL' && (
                    <div className="p-4 border rounded-lg space-y-4">
                        <h3 className="font-semibold text-lg text-slate-700">Aset (Resources)</h3>
                        {formState.resources.map((res, rIndex) => (
                            <div key={res.key} className="p-4 border rounded-md space-y-4 bg-slate-50/50">
                                <div className="flex justify-between items-center"><p className="font-medium text-slate-800">Resource #{rIndex + 1}</p>{formState.resources.length > 1 && <button type="button" onClick={() => removeResource(res.key)} className="text-red-500"><TrashIcon className="w-5 h-5"/></button>}</div>
                                <input type="text" placeholder="Nama Resource *" value={res.name} onChange={e => handleResourceChange(res.key, 'name', e.target.value)} className="input" required/>
                                
                                <div>
                                    <h4 className="text-sm font-medium text-slate-700 mb-2">Jadwal Operasional</h4>
                                    {res.availability.map(avail => (
                                        <div key={avail.key} className="grid grid-cols-4 gap-2 items-center mb-2">
                                            <select value={avail.day_of_week} onChange={e => handleResourceAvailabilityChange(res.key, avail.key, 'day_of_week', e.target.value)} className="input"><option value="">Pilih Hari</option>{daysOfWeek.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select>
                                            <input type="time" value={avail.start_time} onChange={e => handleResourceAvailabilityChange(res.key, avail.key, 'start_time', e.target.value)} className="input" required/>
                                            <input type="time" value={avail.end_time} onChange={e => handleResourceAvailabilityChange(res.key, avail.key, 'end_time', e.target.value)} className="input" required/>
                                            <button type="button" onClick={() => removeResourceAvailability(res.key, avail.key)} className="text-red-500 justify-self-end"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => addResourceAvailability(res.key)} className="btn-secondary text-xs">+ Tambah Jadwal</button>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-slate-700 mb-2">Harga Sewa</h4>
                                    {res.pricing.map(price => (
                                        <div key={price.key} className="grid grid-cols-4 gap-2 items-center mb-2">
                                            <select value={price.customer_category_id} onChange={e => handleResourcePricingChange(res.key, price.key, 'customer_category_id', e.target.value)} className="input" required><option value="">Pilih Kategori Customer</option>{customerCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                                            <select value={price.unit_id} onChange={e => handleResourcePricingChange(res.key, price.key, 'unit_id', e.target.value)} className="input" required><option value="">Pilih Satuan</option>{units.filter(u=>u.type === 'TIME').map(u => <option key={u.unit_id} value={u.unit_id}>{u.name}</option>)}</select>
                                            <input type="number" placeholder="Harga *" value={price.price} onChange={e => handleResourcePricingChange(res.key, price.key, 'price', e.target.value)} className="input" required />
                                            <button type="button" onClick={() => removeResourcePricing(res.key, price.key)} className="text-red-500 justify-self-end"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => addResourcePricing(res.key)} className="btn-secondary text-xs">+ Tambah Aturan Harga</button>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addResource} className="btn-secondary text-sm">Tambah Resource</button>
                    </div>
                )}
                
                <div className="mt-8 flex justify-end space-x-3">
                    <button type="button" onClick={handleClose} disabled={isLoading} className="btn-secondary">Batal</button>
                    <button type="submit" disabled={isLoading} className="btn-primary w-40">{isLoading ? 'Menyimpan...' : 'Simpan Produk'}</button>
                </div>
            </form>
             <style>{`.input { margin-top: 0.25rem; display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; } .radio { color: #dc2626; } .btn-primary { padding: 0.5rem 1rem; background-color: #dc2626; color: white; border-radius: 0.5rem; transition: background-color 0.2s; } .btn-primary:hover { background-color: #b91c1c; } .btn-primary:disabled { background-color: #fca5a5; cursor: not-allowed; } .btn-secondary { padding: 0.5rem 1rem; background-color: #e2e8f0; color: #1e293b; border-radius: 0.5rem; transition: background-color 0.2s; } .btn-secondary:hover { background-color: #cbd5e1; } .btn-secondary:disabled { background-color: #f1f5f9; cursor: not-allowed; } `}</style>
        </div>
        </div>
    );
};


const ProductManagement: React.FC = () => {
    const { addNotification } = useNotification();
    
    // Data state
    const [businessUnits, setBusinessUnits] = useState<ApiBusinessUnit[]>([]);
    const [products, setProducts] = useState<ApiProduct[]>([]);
    
    // UI state
    const [isLoading, setIsLoading] = useState({ units: true, products: false });
    const [selectedUnit, setSelectedUnit] = useState<string>('');
    const [selectedOutlet, setSelectedOutlet] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [deletingProduct, setDeletingProduct] = useState<ApiProduct | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const availableOutlets = useMemo(() => {
        if (!selectedUnit) return [];
        const unit = businessUnits.find(u => u.id === Number(selectedUnit));
        return unit?.outlets || [];
    }, [selectedUnit, businessUnits]);

    // Fetch Business Units for filter
    useEffect(() => {
        const fetchBusinessUnits = async () => {
            setIsLoading(prev => ({ ...prev, units: true }));
            try {
                const response = await fetch(API_BUSINESS_SUMMARY_ENDPOINT);
                if (!response.ok) throw new Error('Gagal memuat unit bisnis');
                const result = await response.json();
                if (result.code === 200 && result.data?.data) {
                    setBusinessUnits(result.data.data);
                    if (result.data.data.length > 0) {
                        const firstUnitId = String(result.data.data[0].id);
                         if (!selectedUnit) {
                            setSelectedUnit(firstUnitId);
                         }
                    }
                } else {
                    throw new Error(result.message || 'Format data tidak valid');
                }
            } catch (err: any) {
                addNotification(err.message, 'error');
            } finally {
                setIsLoading(prev => ({ ...prev, units: false }));
            }
        };
        fetchBusinessUnits();
    }, [addNotification, selectedUnit]);

    useEffect(() => {
        if (availableOutlets.length > 0) {
            const currentOutletExists = availableOutlets.some(o => o.id === Number(selectedOutlet));
            if (!currentOutletExists) {
                setSelectedOutlet(String(availableOutlets[0].id));
            }
        } else {
            setSelectedOutlet('');
        }
    }, [availableOutlets, selectedOutlet]);
    
    const fetchProducts = useCallback(async () => {
        if (!selectedOutlet) {
            setProducts([]);
            return;
        }
        setIsLoading(prev => ({ ...prev, products: true }));
        try {
            const response = await fetch(`${API_PRODUCTS_ENDPOINT}?outlet_id=${selectedOutlet}`);
            if (!response.ok) throw new Error('Gagal memuat produk');
            const result = await response.json();
            setProducts(result.data?.data || []);
        } catch (err: any) {
            addNotification(err.message, 'error');
            setProducts([]);
        } finally {
            setIsLoading(prev => ({ ...prev, products: false }));
        }
    }, [selectedOutlet, addNotification]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleDelete = (product: ApiProduct) => {
        setDeletingProduct(product);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingProduct) return;
        setIsDeleting(true);
        try {
            const response = await fetch(`${API_PRODUCTS_ENDPOINT}/${deletingProduct.id}`, { method: 'DELETE' });
            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.message || 'Gagal menghapus produk');
            }
            addNotification(`Produk "${deletingProduct.name}" berhasil dihapus.`, 'success');
            await fetchProducts();
        } catch (error: any) {
            addNotification(error.message, 'error');
        } finally {
            setIsDeleting(false);
            setIsConfirmModalOpen(false);
            setDeletingProduct(null);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-bold text-slate-800">Manajemen Produk</h2>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                     <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} disabled={isLoading.units} className="input">
                      {isLoading.units ? <option>Memuat...</option> : businessUnits.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                    </select>
                    <select value={selectedOutlet} onChange={(e) => setSelectedOutlet(e.target.value)} disabled={!selectedUnit || availableOutlets.length === 0} className="input">
                       {availableOutlets.length > 0 ? availableOutlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>) : <option>Pilih Unit Usaha</option>}
                    </select>
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={() => handleOpenModal()} disabled={!selectedUnit} className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition disabled:opacity-50">
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    Tambah Produk
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Produk</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipe</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kategori</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Outlet</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isLoading.products ? (
                                <tr><td colSpan={5} className="text-center py-10 text-slate-500">Memuat produk...</td></tr>
                            ) : products.length > 0 ? (
                                products.map((product) => (
                                <tr key={product.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{product.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 capitalize">{product.product_type.toLowerCase()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{product.category?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{
                                        availableOutlets.find(o => o.id === Number(selectedOutlet))?.name || 'N/A'
                                    }</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button disabled title="Fitur ubah belum tersedia" className="text-slate-400 mr-4 cursor-not-allowed"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDelete(product)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))
                            ) : (
                                <tr><td colSpan={5} className="text-center py-10 text-slate-500">Tidak ada produk untuk outlet ini.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {isModalOpen && <ProductModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                onSave={fetchProducts} 
                businessUnitId={selectedUnit}
            />}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Konfirmasi Hapus"
                message={`Anda yakin ingin menghapus produk "${deletingProduct?.name}"? Aksi ini akan menghapus semua varian/resource dan harga terkait. Aksi ini tidak bisa dibatalkan.`}
                isLoading={isDeleting}
            />
            <style>{`.input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; }`}</style>
        </div>
    );
};

export default ProductManagement;