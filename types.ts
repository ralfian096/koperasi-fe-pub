
export interface BusinessUnit {
  id: string;
  name: string;
}

export interface Outlet {
  id: string;
  name: string;
  businessUnitId: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  outletId: string;
}

// New Product-related interfaces for advanced features

export interface Variant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: {
    general: number;
    member: number;
  };
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
  categoryId: string;
  // Price is now optional at the top level. For 'sewa' it's required. For 'barang' it's on the variant.
  price?: {
    general: number;
    member: number;
  };
  type: 'barang' | 'sewa';
  imageUrl: string;
  outletId: string;
}

export interface TransactionItem {
  productId: string;
  productName: string;
  variantName?: string; // Optional: for barang type
  quantity: number;
  priceAtTransaction: number;
  priceType: 'general' | 'member';
}

export interface Transaction {
  id: string;
  items: TransactionItem[];
  total: number;
  date: Date;
  outletId: string;
  status: 'Selesai' | 'Refund';
  paymentMethod: 'Tunai' | 'Kartu Kredit' | 'QRIS';
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
    outletId: string;
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
    outletId: string;
    categoryId: string;
}

export interface User {
    id: string;
    username: string;
    // FIX: Corrected a typo in the password property definition from `password; string;` to `password: string;`.
    password: string;
    role: 'Admin' | 'Manajer' | 'Staf';
}
