
import { useState, useEffect } from 'react';
import { Product, Transaction, TransactionItem, BusinessUnit, Outlet, Member, Employee, OperationalCost, User, ProductCategory, OperationalCostCategory, Variant, RentalResource, ResourceAvailability, Customer, CustomerCategory } from '../types';

// Mock Data Generators
const generateInitialBusinessUnits = (): BusinessUnit[] => [
  { id: 'unit-1', name: 'Kopi Kenangan' },
  { id: 'unit-2', name: 'Penyewaan Biliar & Pesta' },
];

const generateInitialOutlets = (units: BusinessUnit[]): Outlet[] => [
  { id: 'outlet-1', name: 'KK - Grand Indonesia', businessUnitId: 'unit-1' },
  { id: 'outlet-2', name: 'KK - Senayan City', businessUnitId: 'unit-1' },
  { id: 'outlet-3', name: 'Sewa Cepat - Jakarta Pusat', businessUnitId: 'unit-2' },
  { id: 'outlet-4', name: 'Sewa Mudah - Jakarta Selatan', businessUnitId: 'unit-2' },
];

const generateInitialCategories = (outlets: Outlet[]): ProductCategory[] => [
    { id: 'cat-1', name: 'Kopi Panas', outletId: 'outlet-1' },
    { id: 'cat-2', name: 'Kopi Dingin', outletId: 'outlet-1' },
    { id: 'cat-3', name: 'Minuman Non-Kopi', outletId: 'outlet-2' },
    { id: 'cat-4', name: 'Meja Biliar', outletId: 'outlet-3' },
    { id: 'cat-5', name: 'Peralatan Makan', outletId: 'outlet-3' },
    { id: 'cat-6', name: 'Tenda & Dekorasi', outletId: 'outlet-4' },
];

const generateInitialProducts = (): Product[] => [
  // Barang Products (price is on variant)
  { id: 'prod-1', name: 'Latte', description: 'Kopi susu klasik dengan foam lembut.', categoryId: 'cat-1', type: 'barang', imageUrl: 'https://picsum.photos/seed/latte/400', outletId: 'outlet-1' },
  { id: 'prod-2', name: 'Americano', description: 'Espresso shot dengan tambahan air panas.', categoryId: 'cat-1', type: 'barang', imageUrl: 'https://picsum.photos/seed/americano/400', outletId: 'outlet-1' },
  { id: 'prod-3', name: 'Thai Tea', description: 'Teh susu Thailand otentik.', categoryId: 'cat-3', type: 'barang', imageUrl: 'https://picsum.photos/seed/thaitea/400', outletId: 'outlet-2' },
  // Sewa Products (price is on product)
  { id: 'prod-4', name: 'Sewa Meja Biliar', description: 'Sewa meja biliar standar internasional per jam.', categoryId: 'cat-4', generalPrice: 50000, categoryPrices: [{ categoryId: 'cust-cat-2', price: 45000 }], type: 'sewa', imageUrl: 'https://picsum.photos/seed/billiard/400', outletId: 'outlet-3' },
  { id: 'prod-5', name: 'Tenda Roder', description: 'Sewa tenda roder untuk acara besar, harga per hari.', categoryId: 'cat-6', generalPrice: 1500000, categoryPrices: [{ categoryId: 'cust-cat-3', price: 1350000 }], type: 'sewa', imageUrl: 'https://picsum.photos/seed/tent/400', outletId: 'outlet-4' },
];

const generateInitialVariants = (): Variant[] => [
    // Variants for Latte (prod-1)
    { id: 'var-1', productId: 'prod-1', name: 'Panas', sku: 'LAT-HOT', generalPrice: 35000, categoryPrices: [{ categoryId: 'cust-cat-2', price: 32000 }], stock: 50 },
    { id: 'var-2', productId: 'prod-1', name: 'Dingin', sku: 'LAT-ICE', generalPrice: 38000, categoryPrices: [{ categoryId: 'cust-cat-2', price: 35000 }], stock: 80 },
    // Variants for Americano (prod-2)
    { id: 'var-3', productId: 'prod-2', name: 'Panas', sku: 'AME-HOT', generalPrice: 30000, categoryPrices: [], stock: 60 },
    // Variants for Thai Tea (prod-3)
    { id: 'var-5', productId: 'prod-3', name: 'Original', sku: 'THA-ORI', generalPrice: 25000, categoryPrices: [{ categoryId: 'cust-cat-3', price: 22000 }], stock: 120 },
    { id: 'var-6', productId: 'prod-3', name: 'Dengan Boba', sku: 'THA-BOBA', generalPrice: 28000, categoryPrices: [{ categoryId: 'cust-cat-3', price: 25000 }], stock: 5 }, // Low stock example
];

const generateInitialRentalResources = (): RentalResource[] => [
    { id: 'res-1', productId: 'prod-4', name: 'Meja 1', code: 'MB-01' },
    { id: 'res-2', productId: 'prod-4', name: 'Meja 2', code: 'MB-02' },
    { id: 'res-3', productId: 'prod-4', name: 'Meja VIP', code: 'MB-VIP' },
    { id: 'res-4', productId: 'prod-5', name: 'Tenda 5x10m', code: 'TR-510' },
];

const generateInitialResourceAvailabilities = (): ResourceAvailability[] => [
    // Availability for Meja 1 & 2
    { id: 'avail-1', resourceId: 'res-1', dayOfWeek: 'Senin', startTime: '10:00', endTime: '22:00' },
    { id: 'avail-2', resourceId: 'res-1', dayOfWeek: 'Selasa', startTime: '10:00', endTime: '22:00' },
    // ... all week for res-1, res-2
    { id: 'avail-3', resourceId: 'res-2', dayOfWeek: 'Senin', startTime: '10:00', endTime: '22:00' },
    // Availability for Meja VIP
    { id: 'avail-4', resourceId: 'res-3', dayOfWeek: 'Jumat', startTime: '18:00', endTime: '02:00' },
    { id: 'avail-5', resourceId: 'res-3', dayOfWeek: 'Sabtu', startTime: '18:00', endTime: '02:00' },
     // Availability for Tenda
    { id: 'avail-6', resourceId: 'res-4', dayOfWeek: 'Sabtu', startTime: '08:00', endTime: '20:00' },
    { id: 'avail-7', resourceId: 'res-4', dayOfWeek: 'Minggu', startTime: '08:00', endTime: '20:00' },
];


const generateInitialTransactions = (products: Product[], variants: Variant[], outlets: Outlet[], customers: Customer[]): Transaction[] => {
    const transactions: Transaction[] = [];
    if (products.length === 0 || outlets.length === 0) return [];
    const paymentMethods: Transaction['paymentMethod'][] = ['Tunai', 'Kartu Kredit', 'QRIS'];
    const barangProducts = products.filter(p => p.type === 'barang');

    for (let i = 0; i < 50; i++) {
        const outlet = outlets[Math.floor(Math.random() * outlets.length)];
        const productsInOutlet = barangProducts.filter(p => p.outletId === outlet.id);
        if (productsInOutlet.length === 0) continue;

        const hasCustomer = Math.random() > 0.5 && customers.length > 0;
        const customer = hasCustomer ? customers[Math.floor(Math.random() * customers.length)] : null;
        const customerId = customer?.id;

        const numItems = Math.floor(Math.random() * 3) + 1;
        const items: TransactionItem[] = [];
        let total = 0;

        for (let j = 0; j < numItems; j++) {
            const product = productsInOutlet[Math.floor(Math.random() * productsInOutlet.length)];
            const productVariants = variants.filter(v => v.productId === product.id);
            if(productVariants.length === 0) continue;

            const variant = productVariants[Math.floor(Math.random() * productVariants.length)];
            const quantity = Math.floor(Math.random() * 2) + 1;
            
            let priceAtTransaction = variant.generalPrice;
            if (customer) {
                const categoryPrice = variant.categoryPrices.find(p => p.categoryId === customer.categoryId);
                if (categoryPrice) {
                    priceAtTransaction = categoryPrice.price;
                }
            }
            
            items.push({
                productId: product.id,
                productName: product.name,
                variantName: variant.name,
                quantity,
                priceAtTransaction,
            });
            total += priceAtTransaction * quantity;
        }

        if(items.length === 0) continue;

        transactions.push({
            id: `trans-${Date.now()}-${i}`,
            items,
            total,
            date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            outletId: outlet.id,
            status: Math.random() > 0.1 ? 'Selesai' : 'Refund',
            paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            customerId: customerId,
        });
    }
    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
};

// Other generators remain the same...
const generateInitialMembers = (): Member[] => [
    { id: 'mem-1', name: 'Budi Santoso', memberId: 'KOP-001', joinDate: new Date('2022-01-15'), status: 'Aktif' },
    { id: 'mem-2', name: 'Citra Lestari', memberId: 'KOP-002', joinDate: new Date('2022-03-20'), status: 'Aktif' },
    { id: 'mem-3', name: 'Dewi Anggraini', memberId: 'KOP-003', joinDate: new Date('2021-11-10'), status: 'Tidak Aktif' },
];
const generateInitialEmployees = (outlets: Outlet[]): Employee[] => [
    { id: 'emp-1', name: 'Adi Nugroho', position: 'Barista', outletId: 'outlet-1' },
    { id: 'emp-2', name: 'Eka Putri', position: 'Kasir', outletId: 'outlet-1' },
    { id: 'emp-3', name: 'Fajar Maulana', position: 'Staf Sewa', outletId: 'outlet-3' },
    { id: 'emp-4', name: 'Gita Permata', position: 'Manajer Outlet', outletId: 'outlet-4' },
];
const generateInitialOperationalCostCategories = (): OperationalCostCategory[] => [
    { id: 'opcat-1', name: 'Gaji Karyawan' },
    { id: 'opcat-2', name: 'Sewa Tempat' },
    { id: 'opcat-3', name: 'Listrik & Air' },
    { id: 'opcat-4', name: 'Bahan Baku' },
    { id: 'opcat-5', name: 'Lain-lain' },
];
const generateInitialOperationalCosts = (outlets: Outlet[], categories: OperationalCostCategory[]): OperationalCost[] => [
    { id: 'cost-1', description: 'Sewa Kios Bulan Juli', amount: 5000000, date: new Date(), outletId: 'outlet-1', categoryId: 'opcat-2' },
    { id: 'cost-2', description: 'Tagihan Listrik', amount: 1500000, date: new Date(), outletId: 'outlet-3', categoryId: 'opcat-3' },
];
const generateInitialUsers = (): User[] => [
    { id: 'user-1', username: 'admin', password: 'admin', role: 'Admin' },
    { id: 'user-2', username: 'manajer.kk', password: 'password', role: 'Manajer' },
    { id: 'user-3', username: 'staf.rb', password: 'password', role: 'Staf' },
];

const generateInitialCustomerCategories = (): CustomerCategory[] => [
    { id: 'cust-cat-1', name: 'Umum' },
    { id: 'cust-cat-2', name: 'VIP' },
    { id: 'cust-cat-3', name: 'Reseller' },
];

const generateInitialCustomers = (businessUnits: BusinessUnit[], categories: CustomerCategory[]): Customer[] => [
    { id: 'cust-1', name: 'Rina Marlina', phone: '081234567890', categoryId: 'cust-cat-1', businessUnitId: 'unit-1' },
    { id: 'cust-2', name: 'Joko Widodo', phone: '081298765432', categoryId: 'cust-cat-2', businessUnitId: 'unit-1' },
    { id: 'cust-3', name: 'Siti Aminah', phone: '085611223344', categoryId: 'cust-cat-1', businessUnitId: 'unit-2' },
    { id: 'cust-4', name: 'Bambang Pamungkas', phone: '087755667788', categoryId: 'cust-cat-3', businessUnitId: 'unit-2' },
];


function useLocalStorageState<T>(key: string, generator: () => T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        try {
            const savedItem = localStorage.getItem(key);
            if (savedItem) {
                 const parsed = JSON.parse(savedItem);
                 if (key === 'pos-transactions' || key === 'pos-members' || key === 'pos-operationalCosts') {
                     return parsed.map((item: any) => ({ ...item, date: new Date(item.date), joinDate: item.joinDate ? new Date(item.joinDate) : undefined }));
                 }
                 return parsed;
            }
        } catch (error) {
            console.error(`Error reading from localStorage key "${key}":`, error);
        }
        const initialValue = generator();
        try {
            localStorage.setItem(key, JSON.stringify(initialValue));
        } catch (e) {
            // handle error if any
        }
        return initialValue;
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error writing to localStorage key "${key}":`, error);
        }
    }, [key, state]);

    return [state, setState];
}


const usePosData = () => {
    const [businessUnits, setBusinessUnits] = useLocalStorageState('pos-businessUnits', generateInitialBusinessUnits);
    const [outlets, setOutlets] = useLocalStorageState('pos-outlets', () => generateInitialOutlets(businessUnits));
    const [categories, setCategories] = useLocalStorageState('pos-categories', () => generateInitialCategories(outlets));
    const [products, setProducts] = useLocalStorageState('pos-products', generateInitialProducts);
    
    // New states for complex products
    const [variants, setVariants] = useLocalStorageState('pos-variants', generateInitialVariants);
    const [rentalResources, setRentalResources] = useLocalStorageState('pos-rentalResources', generateInitialRentalResources);
    const [resourceAvailabilities, setResourceAvailabilities] = useLocalStorageState('pos-resourceAvailabilities', generateInitialResourceAvailabilities);
    
    
    // Existing states
    const [members, setMembers] = useLocalStorageState('pos-members', generateInitialMembers);
    const [employees, setEmployees] = useLocalStorageState('pos-employees', () => generateInitialEmployees(outlets));
    const [operationalCostCategories, setOperationalCostCategories] = useLocalStorageState('pos-operationalCostCategories', generateInitialOperationalCostCategories);
    const [operationalCosts, setOperationalCosts] = useLocalStorageState('pos-operationalCosts', () => generateInitialOperationalCosts(outlets, operationalCostCategories));
    const [users, setUsers] = useLocalStorageState('pos-users', generateInitialUsers);

    // New states for customers
    const [customerCategories, setCustomerCategories] = useLocalStorageState('pos-customerCategories', generateInitialCustomerCategories);
    const [customers, setCustomers] = useLocalStorageState('pos-customers', () => generateInitialCustomers(businessUnits, customerCategories));

    const [transactions, setTransactions] = useLocalStorageState('pos-transactions', () => generateInitialTransactions(products, variants, outlets, customers));

    // Business Unit CRUD
    const addBusinessUnit = (unit: Omit<BusinessUnit, 'id'>) => {
        const newUnit: BusinessUnit = { ...unit, id: `unit-${Date.now()}` };
        setBusinessUnits(prev => [...prev, newUnit]);
    };
    const updateBusinessUnit = (updatedUnit: BusinessUnit) => {
        setBusinessUnits(prev => prev.map(u => u.id === updatedUnit.id ? updatedUnit : u));
    };
    const deleteBusinessUnit = (unitId: string) => {
        const outletsToDelete = outlets.filter(o => o.businessUnitId === unitId);
        outletsToDelete.forEach(outlet => deleteOutlet(outlet.id));
        setBusinessUnits(prev => prev.filter(u => u.id !== unitId));
    };

    // Outlet CRUD
    const addOutlet = (outlet: Omit<Outlet, 'id'>) => {
        const newOutlet: Outlet = { ...outlet, id: `outlet-${Date.now()}` };
        setOutlets(prev => [...prev, newOutlet]);
    };
    const updateOutlet = (updatedOutlet: Outlet) => {
        setOutlets(prev => prev.map(o => o.id === updatedOutlet.id ? updatedOutlet : o));
    };
    const deleteOutlet = (outletId: string) => {
        const productsToDelete = products.filter(p => p.outletId === outletId);
        productsToDelete.forEach(p => deleteProduct(p.id)); // Cascading delete for products
        
        setCategories(prev => prev.filter(c => c.outletId !== outletId));
        setTransactions(prev => prev.filter(t => t.outletId !== outletId));
        setOperationalCosts(prev => prev.filter(c => c.outletId !== outletId));
        setEmployees(prev => prev.filter(e => e.outletId !== outletId));
        setOutlets(prev => prev.filter(o => o.id !== outletId));
    };

    // Heavily Updated Product CRUD
    type VariantData = Omit<Variant, 'id' | 'productId'>;
    type ResourceData = Omit<RentalResource, 'id' | 'productId'> & { availabilities: Omit<ResourceAvailability, 'id' | 'resourceId'>[] };

    const addProduct = (productData: Omit<Product, 'id' | 'imageUrl'>, variantsData: VariantData[], resourcesData: ResourceData[]) => {
        const newProductId = `prod-${Date.now()}`;
        const newProduct: Product = {
            ...productData,
            id: newProductId,
            imageUrl: `https://picsum.photos/seed/${productData.name.replace(/\s/g, '')}/400`
        };
        setProducts(prev => [...prev, newProduct]);

        if (productData.type === 'barang') {
            const newVariants = variantsData.map(v => ({...v, id: `var-${Date.now()}-${Math.random()}`, productId: newProductId}));
            setVariants(prev => [...prev, ...newVariants]);
        } else if (productData.type === 'sewa') {
            const newResources: RentalResource[] = [];
            const newAvailabilities: ResourceAvailability[] = [];
            resourcesData.forEach(resData => {
                const newResourceId = `res-${Date.now()}-${Math.random()}`;
                newResources.push({ id: newResourceId, productId: newProductId, name: resData.name, code: resData.code });
                resData.availabilities.forEach(avail => {
                    newAvailabilities.push({ ...avail, id: `avail-${Date.now()}-${Math.random()}`, resourceId: newResourceId });
                });
            });
            setRentalResources(prev => [...prev, ...newResources]);
            setResourceAvailabilities(prev => [...prev, ...newAvailabilities]);
        }
    };

    const updateProduct = (updatedProduct: Product, variantsData: VariantData[], resourcesData: ResourceData[]) => {
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));

        // Delete old related items
        setVariants(prev => prev.filter(v => v.productId !== updatedProduct.id));
        const resourcesToDelete = rentalResources.filter(r => r.productId === updatedProduct.id);
        const resourceIdsToDelete = resourcesToDelete.map(r => r.id);
        setRentalResources(prev => prev.filter(r => r.productId !== updatedProduct.id));
        setResourceAvailabilities(prev => prev.filter(a => !resourceIdsToDelete.includes(a.resourceId)));

        // Add new ones (same logic as addProduct)
        if (updatedProduct.type === 'barang') {
            const newVariants = variantsData.map(v => ({...v, id: `var-${Date.now()}-${Math.random()}`, productId: updatedProduct.id}));
            setVariants(prev => [...prev, ...newVariants]);
        } else if (updatedProduct.type === 'sewa') {
            const newResources: RentalResource[] = [];
            const newAvailabilities: ResourceAvailability[] = [];
            resourcesData.forEach(resData => {
                const newResourceId = `res-${Date.now()}-${Math.random()}`;
                newResources.push({ id: newResourceId, productId: updatedProduct.id, name: resData.name, code: resData.code });
                resData.availabilities.forEach(avail => {
                    newAvailabilities.push({ ...avail, id: `avail-${Date.now()}-${Math.random()}`, resourceId: newResourceId });
                });
            });
            setRentalResources(prev => [...prev, ...newResources]);
            setResourceAvailabilities(prev => [...prev, ...newAvailabilities]);
        }
    };
    
    const deleteProduct = (productId: string) => {
        // Cascading delete
        setVariants(prev => prev.filter(v => v.productId !== productId));
        const resourcesToDelete = rentalResources.filter(r => r.productId === productId);
        const resourceIdsToDelete = resourcesToDelete.map(r => r.id);
        setRentalResources(prev => prev.filter(r => r.productId !== productId));
        setResourceAvailabilities(prev => prev.filter(a => !resourceIdsToDelete.includes(a.resourceId)));
        
        setProducts(prev => prev.filter(p => p.id !== productId));
    };
    
    // Other CRUDs...
    const addCategory = (category: Omit<ProductCategory, 'id'>) => {
        const newCategory: ProductCategory = { ...category, id: `cat-${Date.now()}` };
        setCategories(prev => [...prev, newCategory]);
    };
    const updateCategory = (updatedCategory: ProductCategory) => {
        setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
    };
    const deleteCategory = (categoryId: string) => {
        setCategories(prev => prev.filter(c => c.id !== categoryId));
    };
    const addOperationalCost = (cost: Omit<OperationalCost, 'id'>) => {
        const newCost: OperationalCost = { ...cost, id: `cost-${Date.now()}` };
        setOperationalCosts(prev => [...prev, newCost]);
    };
    const updateOperationalCost = (updatedCost: OperationalCost) => {
        setOperationalCosts(prev => prev.map(c => c.id === updatedCost.id ? updatedCost : c));
    };
    const deleteOperationalCost = (costId: string) => {
        setOperationalCosts(prev => prev.filter(c => c.id !== costId));
    };
    const addOperationalCostCategory = (category: Omit<OperationalCostCategory, 'id'>) => {
        const newCategory: OperationalCostCategory = { ...category, id: `opcat-${Date.now()}` };
        setOperationalCostCategories(prev => [...prev, newCategory]);
    };
    const updateOperationalCostCategory = (updatedCategory: OperationalCostCategory) => {
        setOperationalCostCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
    };
    const deleteOperationalCostCategory = (categoryId: string) => {
        setOperationalCostCategories(prev => prev.filter(c => c.id !== categoryId));
    };
    const addMember = (member: Omit<Member, 'id'>) => {
        const newMember: Member = { ...member, id: `mem-${Date.now()}` };
        setMembers(prev => [...prev, newMember]);
    };
    const updateMember = (updatedMember: Member) => {
        setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
    };
    const deleteMember = (memberId: string) => {
        setMembers(prev => prev.filter(m => m.id !== memberId));
    };

    // Customer Category CRUD
    const addCustomerCategory = (category: Omit<CustomerCategory, 'id'>) => {
        const newCategory: CustomerCategory = { ...category, id: `cust-cat-${Date.now()}` };
        setCustomerCategories(prev => [...prev, newCategory]);
    };
    const updateCustomerCategory = (updatedCategory: CustomerCategory) => {
        setCustomerCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
    };
    const deleteCustomerCategory = (categoryId: string) => {
        setCustomerCategories(prev => prev.filter(c => c.id !== categoryId));
    };

    // Customer CRUD
    const addCustomer = (customer: Omit<Customer, 'id'>) => {
        const newCustomer: Customer = { ...customer, id: `cust-${Date.now()}` };
        setCustomers(prev => [...prev, newCustomer]);
    };
    const updateCustomer = (updatedCustomer: Customer) => {
        setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    };
    const deleteCustomer = (customerId: string) => {
        setCustomers(prev => prev.filter(c => c.id !== customerId));
    };

    return { 
        businessUnits, outlets, products, transactions, members, employees, operationalCostCategories, operationalCosts, users, categories, 
        variants, rentalResources, resourceAvailabilities,
        customerCategories, customers,
        addBusinessUnit, updateBusinessUnit, deleteBusinessUnit,
        addOutlet, updateOutlet, deleteOutlet,
        addProduct, updateProduct, deleteProduct, 
        addCategory, updateCategory, deleteCategory,
        addOperationalCost, updateOperationalCost, deleteOperationalCost,
        addOperationalCostCategory, updateOperationalCostCategory, deleteOperationalCostCategory,
        addMember, updateMember, deleteMember,
        addCustomerCategory, updateCustomerCategory, deleteCustomerCategory,
        addCustomer, updateCustomer, deleteCustomer
    };
};

export default usePosData;