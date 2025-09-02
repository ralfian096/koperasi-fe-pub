
import React, { useState } from 'react';
import type { View } from '../App';
import { 
    DashboardIcon, ProductIcon, TransactionIcon, LogoIcon,
    CooperativeIcon, EmployeeIcon, ReportIcon, SettingsIcon, ChevronDownIcon,
    CashIcon, LogoutIcon
} from './icons/Icons';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  onLogout: () => void;
}

const NavLink: React.FC<{
    view: View;
    label: string;
    currentView: View;
    setCurrentView: (view: View) => void;
    Icon: React.ElementType;
    isSubItem?: boolean;
}> = ({ view, label, currentView, setCurrentView, Icon, isSubItem = false }) => (
    <li>
        <button
            onClick={() => setCurrentView(view)}
            className={`w-full flex items-center ${isSubItem ? 'pl-12 pr-4' : 'px-4'} py-3 my-1 text-left rounded-lg transition-colors duration-200 ease-in-out ${
                currentView === view
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-red-50 hover:text-red-600'
            }`}
        >
            {Icon && <Icon className="w-5 h-5 mr-4 flex-shrink-0" />}
            <span className="font-medium text-sm">{label}</span>
        </button>
    </li>
);

const NavGroup: React.FC<{
    label: string;
    Icon: React.ElementType;
    children: React.ReactNode;
    id: string;
    openMenu: string | null;
    setOpenMenu: (id: string | null) => void;
}> = ({ label, Icon, children, id, openMenu, setOpenMenu }) => {
    const isOpen = openMenu === id;
    return (
        <li>
            <button
                onClick={() => setOpenMenu(isOpen ? null : id)}
                className="w-full flex items-center justify-between px-4 py-3 my-1 text-left text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors duration-200"
            >
                <div className="flex items-center">
                    <Icon className="w-5 h-5 mr-4" />
                    <span className="font-medium text-sm">{label}</span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <ul className="pt-1 pb-2">{children}</ul>}
        </li>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, onLogout }) => {
    const [openMenu, setOpenMenu] = useState<string | null>('business');

    return (
        <aside className="w-64 bg-white text-slate-700 flex flex-col hidden md:flex border-r border-slate-200">
            <div className="flex items-center justify-center h-20 border-b border-slate-200">
                <LogoIcon className="w-8 h-8 text-red-500" />
                <h1 className="text-xl font-bold ml-3 text-slate-800">Admin Panel</h1>
            </div>
            <nav className="flex-1 px-4 py-6 overflow-y-auto">
                <ul>
                    <NavLink Icon={DashboardIcon} view="dashboard" label="Dasbor" {...{ currentView, setCurrentView }} />

                    <NavGroup label="Manajemen Koperasi" Icon={CooperativeIcon} id="cooperative" {...{ openMenu, setOpenMenu }}>
                        <NavLink Icon={() => <span className="w-5 mr-4" />} view="cooperative-management" label="Anggota" isSubItem {...{ currentView, setCurrentView }} />
                        <NavLink Icon={() => <span className="w-5 mr-4" />} view="cooperative-others" label="Lainnya" isSubItem {...{ currentView, setCurrentView }} />
                    </NavGroup>

                    <NavGroup label="Manajemen Usaha" Icon={ProductIcon} id="business" {...{ openMenu, setOpenMenu }}>
                        <NavLink Icon={() => <span className="w-5 mr-4" />} view="business-units" label="Unit Usaha" isSubItem {...{ currentView, setCurrentView }} />
                        <NavLink Icon={() => <span className="w-5 mr-4" />} view="outlets" label="Outlet" isSubItem {...{ currentView, setCurrentView }} />
                        <NavLink Icon={() => <span className="w-5 mr-4" />} view="products" label="Produk" isSubItem {...{ currentView, setCurrentView }} />
                        <NavLink Icon={() => <span className="w-5 mr-4" />} view="product-categories" label="Kategori Produk" isSubItem {...{ currentView, setCurrentView }} />
                        <NavLink Icon={() => <span className="w-5 mr-4" />} view="transactions" label="Transaksi" isSubItem {...{ currentView, setCurrentView }} />
                        <NavLink Icon={() => <span className="w-5 mr-4" />} view="employees" label="Karyawan" isSubItem {...{ currentView, setCurrentView }} />
                        <NavLink Icon={() => <span className="w-5 mr-4" />} view="customers" label="Customer" isSubItem {...{ currentView, setCurrentView }} />
                        <NavLink Icon={() => <span className="w-5 mr-4" />} view="customer-categories" label="Kategori Customer" isSubItem {...{ currentView, setCurrentView }} />
                        <NavLink Icon={() => <span className="w-5 mr-4" />} view="taxes" label="Pajak" isSubItem {...{ currentView, setCurrentView }} />

                       {/*
                        <NavLink Icon={() => <span className="w-5 mr-4" />} view="operational-costs" label="Biaya Operasional" isSubItem {...{ currentView, setCurrentView }} />
                        <NavLink Icon={() => <span className="w-5 mr-4" />} view="operational-cost-categories" label="Kategori Biaya" isSubItem {...{ currentView, setCurrentView }} />
                        */}
                    </NavGroup>

                    <NavGroup label="Laporan" Icon={ReportIcon} id="reports" {...{ openMenu, setOpenMenu }}>
                         <NavLink Icon={() => <span className="w-5 mr-4" />} view="profit-loss-report" label="Laporan Laba Rugi" isSubItem {...{ currentView, setCurrentView }} />
                         <NavLink Icon={() => <span className="w-5 mr-4" />} view="sales-turnover-report" label="Laporan Omzet" isSubItem {...{ currentView, setCurrentView }} />
                    </NavGroup>

                    <NavGroup label="Pengaturan" Icon={SettingsIcon} id="settings" {...{ openMenu, setOpenMenu }}>
                        <NavLink Icon={() => <span className="w-5 mr-4" />} view="user-management" label="Manajemen Akun" isSubItem {...{ currentView, setCurrentView }} />
                    </NavGroup>
                </ul>
            </nav>
            <div className="p-4 border-t border-slate-200">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center px-4 py-3 text-left text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors duration-200"
                >
                    <LogoutIcon className="w-5 h-5 mr-4" />
                    <span className="font-medium text-sm">Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
