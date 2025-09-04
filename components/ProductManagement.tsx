
import React, { useState, useMemo, useEffect } from 'react';
import usePosData from '../hooks/usePosData';
import { Product, Outlet, ProductCategory, Variant, RentalResource, ResourceAvailability, CustomerCategory, CategoryPrice } from '../types';
import { EditIcon, TrashIcon, PlusIcon } from './icons/Icons';

// Form Data Types
type CategoryPriceFormData = Omit<CategoryPrice, ''>;
type ProductFormData = Omit<Product, 'id' | 'imageUrl'>;
type VariantFormData = Omit<Variant, 'id' | 'productId'>;
type AvailabilityFormData = Omit<ResourceAvailability, 'id' | 'resourceId'>;
type ResourceFormData = Omit<RentalResource, 'id' | 'productId'> & { availabilities: AvailabilityFormData[] };

const ProductModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: ProductFormData | Product, variants: VariantFormData[], resources: ResourceFormData[]) => void;
  product: Product | null;
  // Pass all data from hook
  allData: {
    outlets: Outlet[];
    categories: ProductCategory[];
    variants: Variant[];
    rentalResources: RentalResource[];
    resourceAvailabilities: ResourceAvailability[];
    customerCategories: CustomerCategory[];
  };
  outletForNewProduct: number | '';
}> = ({ isOpen, onClose, onSave, product, allData, outletForNewProduct }) => {
  
  // State for the form
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    categoryId: 0,
    type: 'barang',
    outletId: 0,
    generalPrice: 0,
    categoryPrices: []
  });
  const [variants, setVariants] = useState<VariantFormData[]>([{ name: '', sku: '', generalPrice: 0, categoryPrices: [], stock: 0 }]);
  const [resources, setResources] = useState<ResourceFormData[]>([{ name: '', code: '', availabilities: [] }]);

  const weekDays: ResourceAvailability['dayOfWeek'][] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  // Memoized data for performance
  const relevantCategories = useMemo(() => {
    return allData.categories.filter(c => c.outlet_id === formData.outletId);
  }, [allData.categories, formData.outletId]);

  // Effect to populate form when editing
  useEffect(() => {
    if (isOpen) {
      const currentOutletId = product?.outletId || outletForNewProduct;
      if (!currentOutletId) return;

      const initialCategories = allData.categories.filter(c => c.outlet_id === currentOutletId);
      
      const baseData: ProductFormData = {
        name: product?.name || '',
        description: product?.description || '',
        categoryId: product?.categoryId || (initialCategories[0]?.id || 0),
        type: product?.type || 'barang',
        outletId: currentOutletId,
        generalPrice: product?.generalPrice || 0,
        categoryPrices: product?.categoryPrices || [],
      };
      setFormData(baseData);
      
      if (product) {
        if (product.type === 'barang') {
          const productVariants = allData.variants.filter(v => v.productId === product.id)
            .map(({ id, productId, ...rest }) => rest);
          setVariants(productVariants.length > 0 ? productVariants : [{ name: '', sku: '', generalPrice: 0, categoryPrices: [], stock: 0 }]);
        } else if (product.type === 'sewa') {
          const productResources = allData.rentalResources.filter(r => r.productId === product.id);
          const productResourcesData = productResources.map(res => {
            const availabilities = allData.resourceAvailabilities.filter(a => a.resourceId === res.id)
                .map(({id, resourceId, ...rest}) => rest);
            return { name: res.name, code: res.code, availabilities };
          });
          setResources(productResourcesData.length > 0 ? productResourcesData : [{ name: '', code: '', availabilities: [] }]);
        }
      } else {
        // Reset for new product
        setVariants([{ name: '', sku: '', generalPrice: 0, categoryPrices: [], stock: 0 }]);
        setResources([{ name: '', code: '', availabilities: [] }]);
      }
    }
  }, [product, allData, isOpen, outletForNewProduct]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalProductData = { ...formData };
    if(finalProductData.type === 'barang') {
        delete finalProductData.generalPrice;
        delete finalProductData.categoryPrices;
    }

    if (product) {
      onSave({ ...product, ...finalProductData }, variants, resources);
    } else {
      onSave(finalProductData, variants, resources);
    }
    onClose();
  };
  
  // --- Variant Handlers ---
  const handleVariantChange = (index: number, field: keyof VariantFormData, value: any) => {
    const newVariants = [...variants];
    (newVariants[index] as any)[field] = value;
    setVariants(newVariants);
  };
  const addVariant = () => setVariants([...variants, { name: '', sku: '', generalPrice: 0, categoryPrices: [], stock: 0 }]);
  const removeVariant = (index: number) => setVariants(variants.filter((_, i) => i !== index));

  // --- Category Price Handlers (for Variant) ---
  const handleVariantCategoryPriceChange = (vIndex: number, pIndex: number, field: 'categoryId' | 'price', value: string | number) => {
      const newVariants = [...variants];
      // FIX: The underlying type mismatch is resolved in `types.ts`, so the `as any` cast is no longer necessary for type safety.
      newVariants[vIndex].categoryPrices[pIndex][field] = value as any;
      setVariants(newVariants);
  };
  const addVariantCategoryPrice = (vIndex: number) => {
      const newVariants = [...variants];
      const availableCats = allData.customerCategories.filter(
          c => !newVariants[vIndex].categoryPrices.some(p => p.categoryId === c.id)
      );
      if (availableCats.length > 0) {
          newVariants[vIndex].categoryPrices.push({ categoryId: availableCats[0].id, price: 0 });
          setVariants(newVariants);
      }
  };
  const removeVariantCategoryPrice = (vIndex: number, pIndex: number) => {
      const newVariants = [...variants];
      newVariants[vIndex].categoryPrices.splice(pIndex, 1);
      setVariants(newVariants);
  };

  // --- Category Price Handlers (for Product 'sewa') ---
    const handleProductCategoryPriceChange = (pIndex: number, field: 'categoryId' | 'price', value: string | number) => {
      const newPrices = [...(formData.categoryPrices || [])];
      // FIX: The underlying type mismatch is resolved in `types.ts`, so the `as any` cast is no longer necessary for type safety.
      newPrices[pIndex][field] = value as any;
      setFormData(f => ({...f, categoryPrices: newPrices}));
  };
  const addProductCategoryPrice = () => {
      const newPrices = [...(formData.categoryPrices || [])];
      const availableCats = allData.customerCategories.filter(
          c => !newPrices.some(p => p.categoryId === c.id)
      );
      if (availableCats.length > 0) {
          newPrices.push({ categoryId: availableCats[0].id, price: 0 });
          setFormData(f => ({...f, categoryPrices: newPrices}));
      }
  };
  const removeProductCategoryPrice = (pIndex: number) => {
      const newPrices = [...(formData.categoryPrices || [])];
      newPrices.splice(pIndex, 1);
      setFormData(f => ({...f, categoryPrices: newPrices}));
  };

  // --- Resource Handlers ---
  const handleResourceChange = (index: number, field: 'name' | 'code', value: string) => {
    const newResources = [...resources];
    newResources[index] = { ...newResources[index], [field]: value };
    setResources(newResources);
  };
  const addResource = () => setResources([...resources, { name: '', code: '', availabilities: [] }]);
  const removeResource = (index: number) => setResources(resources.filter((_, i) => i !== index));
  const handleAvailabilityToggle = (resIndex: number, day: ResourceAvailability['dayOfWeek']) => {
    const newResources = [...resources];
    const resource = newResources[resIndex];
    const existingAvail = resource.availabilities.find(a => a.dayOfWeek === day);

    if (existingAvail) {
        resource.availabilities = resource.availabilities.filter(a => a.dayOfWeek !== day);
    } else {
        resource.availabilities.push({ dayOfWeek: day, startTime: '09:00', endTime: '17:00' });
        resource.availabilities.sort((a,b) => weekDays.indexOf(a.dayOfWeek) - weekDays.indexOf(b.dayOfWeek));
    }
    setResources(newResources);
  };
  const handleTimeChange = (resIndex: number, day: ResourceAvailability['dayOfWeek'], type: 'startTime' | 'endTime', value: string) => {
      const newResources = [...resources];
      const avail = newResources[resIndex].availabilities.find(a => a.dayOfWeek === day);
      if (avail) {
          avail[type] = value;
          setResources(newResources);
      }
  };

  const getAvailableCustomerCategories = (existingPrices: CategoryPriceFormData[] = []) => {
      const usedCategoryIds = new Set(existingPrices.map(p => p.categoryId));
      return allData.customerCategories.filter(c => !usedCategoryIds.has(c.id));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto py-10">
      <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 w-full max-w-3xl max-h-full overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">{product ? 'Ubah Produk' : 'Tambah Produk Baru'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Core Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} placeholder="Nama Produk" required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"/>
            <select name="categoryId" value={formData.categoryId} onChange={e => setFormData(p => ({...p, categoryId: Number(e.target.value)}))} required disabled={relevantCategories.length === 0} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 disabled:bg-slate-100">
                {relevantCategories.length > 0 ? relevantCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>) : <option>Pilih Outlet dulu</option>}
            </select>
          </div>
          <textarea value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} placeholder="Deskripsi Produk" required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" rows={2}/>
          
          {/* Type Selector */}
          <div className="flex rounded-md shadow-sm">
              <button type="button" onClick={() => setFormData(p=>({...p, type: 'barang'}))} disabled={!!product} className={`px-4 py-2 border rounded-l-md w-1/2 ${formData.type === 'barang' ? 'bg-red-600 text-white' : 'bg-white hover:bg-slate-50'} disabled:opacity-50`}>Produk Barang</button>
              <button type="button" onClick={() => setFormData(p=>({...p, type: 'sewa'}))} disabled={!!product} className={`px-4 py-2 border rounded-r-md w-1/2 ${formData.type === 'sewa' ? 'bg-red-600 text-white' : 'bg-white hover:bg-slate-50'} disabled:opacity-50`}>Produk Sewa</button>
          </div>

          {/* Dynamic Section */}
          {formData.type === 'barang' ? (
            <div className="space-y-4 p-4 border rounded-md">
                <h3 className="font-semibold text-slate-700">Varian, Harga & Stok</h3>
                <div className="space-y-3">
                  {variants.map((variant, vIndex) => (
                      <div key={vIndex} className="p-3 border rounded bg-slate-50 space-y-3">
                          <div className="flex items-center gap-2">
                              <input type="text" placeholder="Nama Varian (e.g. Merah, XL)" value={variant.name} onChange={e => handleVariantChange(vIndex, 'name', e.target.value)} required className="w-full px-2 py-1 border border-slate-300 rounded-md text-sm"/>
                              <input type="text" placeholder="SKU" value={variant.sku} onChange={e => handleVariantChange(vIndex, 'sku', e.target.value)} required className="w-1/2 px-2 py-1 border border-slate-300 rounded-md text-sm"/>
                              <input type="number" placeholder="Stok" value={variant.stock} onChange={e => handleVariantChange(vIndex, 'stock', Number(e.target.value))} required className="w-1/4 px-2 py-1 border border-slate-300 rounded-md text-sm"/>
                              <button type="button" onClick={() => removeVariant(vIndex)} className="text-red-500 hover:text-red-700 disabled:opacity-50" disabled={variants.length <= 1}><TrashIcon className="w-5 h-5"/></button>
                          </div>
                          <div>
                              <label className="text-xs font-medium text-slate-600">Harga Umum (Rp)</label>
                              <input type="number" placeholder="Harga Umum" value={variant.generalPrice} onChange={e => handleVariantChange(vIndex, 'generalPrice', Number(e.target.value))} required className="w-full px-2 py-1 border border-slate-300 rounded-md text-sm"/>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-600 mb-1">Harga Khusus per Kategori</p>
                            {variant.categoryPrices.map((p, pIndex) => (
                                <div key={pIndex} className="flex items-center gap-2 mb-1">
                                    <select value={String(p.categoryId)} onChange={e => handleVariantCategoryPriceChange(vIndex, pIndex, 'categoryId', e.target.value)} className="w-full px-2 py-1 border border-slate-300 rounded-md text-sm">
                                        <option value={p.categoryId}>{allData.customerCategories.find(c => c.id === p.categoryId)?.name}</option>
                                        {getAvailableCustomerCategories(variant.categoryPrices).map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                                    </select>
                                    <input type="number" placeholder="Harga" value={p.price} onChange={e => handleVariantCategoryPriceChange(vIndex, pIndex, 'price', Number(e.target.value))} required className="w-full px-2 py-1 border border-slate-300 rounded-md text-sm"/>
                                    <button type="button" onClick={() => removeVariantCategoryPrice(vIndex, pIndex)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            ))}
                            <button type="button" onClick={() => addVariantCategoryPrice(vIndex)} className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 mt-1" disabled={getAvailableCustomerCategories(variant.categoryPrices).length === 0}><PlusIcon className="w-3 h-3"/> Tambah Harga Kategori</button>
                          </div>
                      </div>
                  ))}
                </div>
                <button type="button" onClick={addVariant} className="text-sm text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"><PlusIcon className="w-4 h-4"/> Tambah Varian</button>
            </div>
          ) : ( // SEWA
            <div className="space-y-4 p-4 border rounded-md">
                <h3 className="font-semibold text-slate-700">Harga & Sumber Daya Sewa</h3>
                <div>
                    <label className="text-sm font-medium text-slate-600">Harga Umum / Jam (Rp)</label>
                    <input type="number" value={formData.generalPrice} onChange={e => setFormData(p => ({...p, generalPrice: Number(e.target.value)}))} placeholder="Harga Umum / jam" required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"/>
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">Harga Khusus per Kategori</p>
                    {formData.categoryPrices?.map((p, pIndex) => (
                        <div key={pIndex} className="flex items-center gap-2 mb-2">
                            <select value={String(p.categoryId)} onChange={e => handleProductCategoryPriceChange(pIndex, 'categoryId', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
                                <option value={p.categoryId}>{allData.customerCategories.find(c => c.id === p.categoryId)?.name}</option>
                                {getAvailableCustomerCategories(formData.categoryPrices).map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                            </select>
                            <input type="number" placeholder="Harga" value={p.price} onChange={e => handleProductCategoryPriceChange(pIndex, 'price', Number(e.target.value))} required className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"/>
                            <button type="button" onClick={() => removeProductCategoryPrice(pIndex)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    ))}
                    <button type="button" onClick={addProductCategoryPrice} className="text-sm text-red-600 hover:text-red-800 font-semibold flex items-center gap-1" disabled={getAvailableCustomerCategories(formData.categoryPrices).length === 0}><PlusIcon className="w-4 h-4"/> Tambah Harga Kategori</button>
                </div>
                <hr/>
                <h3 className="font-semibold text-slate-700 pt-2">Sumber Daya</h3>
                <div className="space-y-3">
                  {resources.map((res, resIndex) => (
                      <div key={resIndex} className="p-3 border rounded bg-slate-50 space-y-2">
                        <div className="flex items-center gap-2">
                            <input type="text" placeholder="Nama Resource (e.g. Meja 1)" value={res.name} onChange={e => handleResourceChange(resIndex, 'name', e.target.value)} required className="w-full px-2 py-1 border border-slate-300 rounded-md text-sm"/>
                            <input type="text" placeholder="Kode Resource" value={res.code} onChange={e => handleResourceChange(resIndex, 'code', e.target.value)} required className="w-1/2 px-2 py-1 border border-slate-300 rounded-md text-sm"/>
                            <button type="button" onClick={() => removeResource(resIndex)} className="text-red-500 hover:text-red-700 disabled:opacity-50" disabled={resources.length <= 1}><TrashIcon className="w-5 h-5"/></button>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-slate-600 mb-2">Ketersediaan Waktu:</p>
                            <div className="flex flex-wrap gap-1 mb-2">
                                {weekDays.map(day => (
                                    <button type="button" key={day} onClick={() => handleAvailabilityToggle(resIndex, day)} className={`px-2 py-0.5 text-xs border rounded-full ${res.availabilities.some(a => a.dayOfWeek === day) ? 'bg-red-600 text-white border-red-600' : 'bg-white hover:bg-slate-100'}`}>{day}</button>
                                ))}
                            </div>
                            {res.availabilities.map(avail => (
                                <div key={avail.dayOfWeek} className="flex items-center gap-2 mt-1">
                                    <span className="w-12 text-xs font-semibold">{avail.dayOfWeek}</span>
                                    <input type="time" value={avail.startTime} onChange={e => handleTimeChange(resIndex, avail.dayOfWeek, 'startTime', e.target.value)} className="w-full px-2 py-1 border border-slate-300 rounded-md text-sm"/>
                                    <input type="time" value={avail.endTime} onChange={e => handleTimeChange(resIndex, avail.dayOfWeek, 'endTime', e.target.value)} className="w-full px-2 py-1 border border-slate-300 rounded-md text-sm"/>
                                </div>
                            ))}
                        </div>
                      </div>
                  ))}
                </div>
                <button type="button" onClick={addResource} className="text-sm text-red-600 hover:text-red-800 font-semibold flex items-center gap-1"><PlusIcon className="w-4 h-4"/> Tambah Resource</button>
            </div>
          )}

          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Batal</button>
            <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProductManagement: React.FC = () => {
    const data = usePosData();
    const { businessUnits, products, outlets, categories, variants, rentalResources, resourceAvailabilities, customerCategories, addProduct, updateProduct, deleteProduct } = data;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    
    const [selectedUnit, setSelectedUnit] = useState<string>(String(businessUnits[0]?.id || ''));
    const [selectedOutlet, setSelectedOutlet] = useState<string>('');

    const availableOutlets = useMemo(() => {
        return outlets.filter(o => o.businessUnitId === Number(selectedUnit));
    }, [selectedUnit, outlets]);
    
    useEffect(() => {
        if (availableOutlets.length > 0) {
            const currentOutletExists = availableOutlets.some(o => o.id === Number(selectedOutlet));
            if (!currentOutletExists) setSelectedOutlet(String(availableOutlets[0].id));
        } else {
            setSelectedOutlet('');
        }
    }, [selectedUnit, availableOutlets, selectedOutlet]);

    const filteredProducts = useMemo(() => {
        if (!selectedOutlet) return [];
        return products.filter(p => p.outletId === Number(selectedOutlet));
    }, [products, selectedOutlet]);

    const categoryMap = React.useMemo(() => 
        categories.reduce((acc, cat) => {
            acc[cat.id] = cat.name;
            return acc;
        }, {} as Record<string, string>),
    [categories]);

    const handleOpenModal = (product: Product | null = null) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };
    const handleCloseModal = () => setIsModalOpen(false);

    const handleSaveProduct = (productData: ProductFormData | Product, productVariants: VariantFormData[], productResources: ResourceFormData[]) => {
        if ('id' in productData) {
            updateProduct(productData, productVariants, productResources);
        } else {
            addProduct(productData, productVariants, productResources);
        }
    };
    
    const getPriceDisplayString = (product: Product) => {
        if (product.type === 'sewa') {
            return `Rp${(product.generalPrice || 0).toLocaleString('id-ID')}`;
        }
        const productVariants = variants.filter(v => v.productId === product.id);
        if (productVariants.length === 0) return 'N/A';
        const prices = productVariants.map(v => v.generalPrice);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        if (minPrice === maxPrice) return `Rp${minPrice.toLocaleString('id-ID')}`;
        return `Rp${minPrice.toLocaleString('id-ID')} - ${maxPrice.toLocaleString('id-ID')}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-bold text-slate-800">Manajemen Produk</h2>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500">
                      {businessUnits.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                    </select>
                    <select value={selectedOutlet} onChange={(e) => setSelectedOutlet(e.target.value)} className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" disabled={availableOutlets.length === 0}>
                       {availableOutlets.map(outlet => <option key={outlet.id} value={outlet.id}>{outlet.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={() => handleOpenModal()} className={`flex items-center px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition ${!selectedOutlet ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={!selectedOutlet}>
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
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kategori</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Harga Umum</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Stok</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredProducts.map((product) => {
                                const totalStock = product.type === 'barang' 
                                    ? variants.filter(v => v.productId === product.id).reduce((sum, v) => sum + v.stock, 0)
                                    : 'N/A';
                                return (
                                <tr key={product.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <img className="h-10 w-10 rounded-full object-cover" src={product.imageUrl} alt={product.name} />
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-slate-900">{product.name}</div>
                                                <div className="text-xs text-slate-500 capitalize">{product.type}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{categoryMap[product.categoryId] || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{getPriceDisplayString(product)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            typeof totalStock === 'number' ? (totalStock > 50 ? 'bg-green-100 text-green-800' : totalStock > 10 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800') : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {totalStock}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(product)} className="text-red-600 hover:text-red-900 mr-4"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => deleteProduct(product.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            )})}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-slate-500">
                                        {selectedOutlet ? 'Tidak ada produk untuk outlet ini.' : 'Silakan pilih unit usaha dan outlet.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {isModalOpen && <ProductModal 
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                onSave={handleSaveProduct} 
                product={editingProduct}
                allData={{ outlets, categories, variants, rentalResources, resourceAvailabilities, customerCategories }}
                outletForNewProduct={Number(selectedOutlet)}
            />}
        </div>
    );
};

export default ProductManagement;