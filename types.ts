


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

// New type for Finance module
export interface ChartOfAccount {
  id: number;
  business_id: string;
  parent_id: number | null;
  account_code: string;
  account_name: string;
  account_type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  normal_balance: 'DEBIT' | 'CREDIT';
  is_active: string; // "1" = active, "0" = inactive
  parent?: {
      id: number;
      account_name: string;
  } | null;
  children?: ChartOfAccount[]; // For local hierarchy building
  children_recursive?: ChartOfAccount[]; // From API
}

// New types for Jurnal
export interface JournalDetail {
  id: number;
  account_chart_id: string;
  entry_type: 'DEBIT' | 'CREDIT';
  amount: string;
  account_chart: ChartOfAccount;
}

// Compatible type for both API response and local state
export interface JournalEntry {
  id: number;
  business_id: string;
  description: string;
  date: string; // Mapped from entry_date for consistency
  entry_date: string;
  created_at: string;
  updated_at: string;
  details: JournalDetail[]; // from API
  items: { // for modal compatibility
    id: number;
    chart_of_account_id: number;
    debit: number;
    credit: number;
    account?: ChartOfAccount;
  }[];
  total_debit: string;
  total_credit: string;
}

// New types for Laporan Laba Rugi (PHU) / Income Statement
export interface IncomeStatementAccount {
    account_code: string;
    account_name: string;
    total: number;
}

export interface IncomeStatementSection {
    accounts: IncomeStatementAccount[];
    total: number;
}

export interface IncomeStatementData {
    report_name: string;
    business_id: string;
    period: string;
    revenues: IncomeStatementSection;
    expenses: IncomeStatementSection;
    net_profit: number;
}

// New types for Laporan Neraca / Balance Sheet
export interface BalanceSheetAccount {
    account_code: string;
    account_name: string;
    total: number;
}

export interface BalanceSheetSection {
    accounts: BalanceSheetAccount[];
    total: number;
}

export interface BalanceSheetData {
    report_name: string;
    business_id: string;
    as_of_date: string;
    assets: BalanceSheetSection;
    liabilities: BalanceSheetSection;
    equity: BalanceSheetSection;
    check_balance: number;
}

// New types for Laporan Rasio Keuangan / Financial Ratio Analysis
export interface FinancialRatio {
    category: 'Likuiditas' | 'Profitabilitas' | 'Solvabilitas' | string;
    name: string;
    value: string; // Keep as string to handle percentages or ratios like '1.5x'
    interpretation: string;
}

export interface FinancialRatioData {
    report_name: string;
    business_id: string;
    as_of_date: string;
    ratios: FinancialRatio[];
}


// New types for Pengajuan RAB
export interface PengajuanItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Pengajuan {
  id: number;
  submission_code: string;
  title: string;
  submitted_by: string; // For simplicity, using username string
  submitted_at: Date;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | null;
  total_amount: number;
  items: PengajuanItem[];
  rejection_reason?: string | null;
}