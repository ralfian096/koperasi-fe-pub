

export interface BusinessUnit {
  id: number;
  logo: string | null;
  name: string;
  email: string | null;
  contact: string | null;
  description: string | null;
  website: string | null;
  instagram: string | null;
  tiktok: string | null;
  is_active: string; // "1" = active, "0" = inactive
  outlets?: any[];
}

export interface Outlet {
  id: number;
  name: string;
  businessUnitId: number;
  contact?: string | null;
  address?: string | null;
  geolocation?: string | null;
  is_active?: string; // "1" = active, "0" = inactive
}

export interface ProductCategory {
  id: number;
  business_id: number;
  outlet_id: number;
  name: string;
  products_count: number;
  business: {
      id: number;
      name: string;
  };
  outlet: {
      id: number;
      name: string;
  };
}

// New Product-related interfaces for advanced features
export interface CategoryPrice {
  // FIX: Changed categoryId from `string` to `string | number` to match the `CustomerCategory` id type.
  categoryId: string | number;
  price: number;
}

export interface Variant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  generalPrice: number;
  categoryPrices: CategoryPrice[];
  stock: number;
}

export interface ResourceAvailability {
    id: string;
    resourceId: string;
    dayOfWeek: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';
    startTime: string; // e.g., "09:00"
    endTime: string;   // e.g., "17:00"
}

export interface RentalResource {
    id: string;
    productId: string;
    name: string;
    code: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: number;
  // Price is now based on general and customer categories.
  // Optional at top level for 'barang', required for 'sewa'.
  generalPrice?: number;
  categoryPrices?: CategoryPrice[];
  type: 'barang' | 'sewa';
  imageUrl: string;
  outletId: number;
}

export interface TransactionItem {
  productId: string;
  productName: string;
  variantName?: string; // Optional: for barang type
  quantity: number;
  priceAtTransaction: number;
}

export interface Transaction {
  id: string;
  items: TransactionItem[];
  total: number;
  date: Date;
  outletId: number;
  status: 'Selesai' | 'Refund';
  paymentMethod: 'Tunai' | 'Kartu Kredit' | 'QRIS';
  customerId?: string;
}

// Existing types for other modules
export interface Member {
    id: string;
    name: string;
    memberId: string;
    joinDate: Date;
    status: 'Aktif' | 'Tidak Aktif';
}

export interface Employee {
    id: string;
    name: string;
    position: string;
    outletId: number;
}

export interface OperationalCostCategory {
  id: string;
  name: string;
}

export interface OperationalCost {
    id: string;
    description: string;
    amount: number;
    date: Date;
    outletId: number;
    categoryId: string;
}

export interface User {
    id: string;
    username: string;
    // FIX: Corrected a typo in the password property definition from `password; string;` to `password: string;`.
    password: string;
    role: 'Admin' | 'Manajer' | 'Staf';
}

export interface CustomerCategory {
  id: string | number;
  name: string;
}

export interface Customer {
  id: string;
  name: string;
  phone_number: string;
  email?: string | null;
  address?: string | null;
  categoryId: string;
  businessUnitId: number;
}