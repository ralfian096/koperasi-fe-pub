
import React, { useState } from 'react';
import type { MainView, SubView } from '../App';
import { BusinessUnit } from '../types';
import { 
    ArrowLeftIcon,
    ChevronDownIcon,
    BuildingStorefrontIcon,
    TagIcon,
    TransactionIcon,
    EmployeeIcon,
    BanknotesIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
    ScaleIcon,
    ReportIcon,
    DashboardIcon,
} from './icons/Icons';

interface SidebarProps {
  mainView: MainView;
  subView: SubView | null;
  setSubView: (view: SubView) => void;
  selectedBusinessUnit: BusinessUnit | null;
  onSwitchBusinessUnit: () => void;
}

const NavLink: React.FC<{
    view: SubView;
    label: string;
    icon: React.ElementType;
    currentView: SubView | null;
    setCurrentView: (view: SubView) => void;
    isSubItem?: boolean;
}> = ({ view, label, icon: Icon, currentView, setCurrentView, isSubItem = false }) => (
    <li>
        <button
            onClick={() => setCurrentView(view)}
            className={`w-full flex items-center gap-3 ${isSubItem ? 'pl-11 pr-4' : 'px-4'} py-3 my-1 text-left rounded-lg transition-colors duration-200 ease-in-out text-sm ${
                currentView === view
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-primary-50 hover:text-primary-700'
            }`}
        >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{label}</span>
        </button>
    </li>
);

const CollapsibleNavGroup: React.FC<{
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
    groupId: string;
    openGroupId: string | null;
    setOpenGroupId: (id: string | null) => void;
}> = ({ title, icon: Icon, children, groupId, openGroupId, setOpenGroupId }) => {
    const isOpen = openGroupId === groupId;
    
    const handleClick = () => {
        setOpenGroupId(isOpen ? null : groupId);
    };

    return (
        <div>
            <button
                onClick={handleClick}
                className="w-full flex items-center justify-between px-4 py-3 my-1 text-left rounded-lg transition-colors duration-200 ease-in-out text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-700"
            >
                <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{title}</span>
                </div>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                {isOpen && <ul className="pt-1">{children}</ul>}
            </div>
        </div>
    );
};


const UsahaSidebar: React.FC<{
    currentView: SubView | null;
    setCurrentView: (view: SubView) => void;
}> = ({ currentView, setCurrentView }) => {
    
    const [openGroupId, setOpenGroupId] = useState<string | null>('customer');

    return (
        <ul>
            <NavLink view="dashboard" label="Dasbor" icon={DashboardIcon} currentView={currentView} setCurrentView={setCurrentView} />
            <NavLink view="outlets" label="Outlet" icon={BuildingStorefrontIcon} currentView={currentView} setCurrentView={setCurrentView} />
            
            <CollapsibleNavGroup title="Customer" icon={UserGroupIcon} groupId="customer" openGroupId={openGroupId} setOpenGroupId={setOpenGroupId}>
                <NavLink view="customers" label="Daftar Customer" icon={UserGroupIcon} currentView={currentView} setCurrentView={setCurrentView} isSubItem />
                <NavLink view="customer-categories" label="Kategori Customer" icon={UserGroupIcon} currentView={currentView} setCurrentView={setCurrentView} isSubItem />
            </CollapsibleNavGroup>

            <CollapsibleNavGroup title="Produk" icon={TagIcon} groupId="produk" openGroupId={openGroupId} setOpenGroupId={setOpenGroupId}>
                <NavLink view="products-goods" label="Barang" icon={TagIcon} currentView={currentView} setCurrentView={setCurrentView} isSubItem />
                <NavLink view="products-rentals" label="Sewa" icon={TagIcon} currentView={currentView} setCurrentView={setCurrentView} isSubItem />
                <NavLink view="product-categories" label="Kategori Produk" icon={TagIcon} currentView={currentView} setCurrentView={setCurrentView} isSubItem />
            </CollapsibleNavGroup>
            
            <NavLink view="transactions" label="Transaksi" icon={TransactionIcon} currentView={currentView} setCurrentView={setCurrentView} />
            <NavLink view="promotions" label="Promo" icon={TagIcon} currentView={currentView} setCurrentView={setCurrentView} />
            <NavLink view="employees" label="Karyawan" icon={EmployeeIcon} currentView={currentView} setCurrentView={setCurrentView} />
            <NavLink view="taxes" label="Pajak" icon={BanknotesIcon} currentView={currentView} setCurrentView={setCurrentView} />
            
             <CollapsibleNavGroup title="Keuangan" icon={CurrencyDollarIcon} groupId="keuangan" openGroupId={openGroupId} setOpenGroupId={setOpenGroupId}>
                <NavLink view="chart-of-accounts" label="Bagan Akun" icon={ReportIcon} currentView={currentView} setCurrentView={setCurrentView} isSubItem />
                <NavLink view="jurnal" label="Jurnal" icon={ReportIcon} currentView={currentView} setCurrentView={setCurrentView} isSubItem />
                <NavLink view="profit-loss-report" label="Laporan PHU" icon={ReportIcon} currentView={currentView} setCurrentView={setCurrentView} isSubItem />
                <NavLink view="balance-sheet-report" label="Laporan Neraca" icon={ReportIcon} currentView={currentView} setCurrentView={setCurrentView} isSubItem />
                <NavLink view="cash-flow-report" label="Laporan Arus Kas" icon={ReportIcon} currentView={currentView} setCurrentView={setCurrentView} isSubItem />
                <NavLink view="equity-change-report" label="Laporan Perubahan Modal" icon={ReportIcon} currentView={currentView} setCurrentView={setCurrentView} isSubItem />
                <NavLink view="financial-ratio-report" label="Rasio Keuangan" icon={ScaleIcon} currentView={currentView} setCurrentView={setCurrentView} isSubItem />
            </CollapsibleNavGroup>
        </ul>
    );
}

const UsahaGeneralSidebar: React.FC<{
    currentView: SubView | null;
    setCurrentView: (view: SubView) => void;
}> = ({ currentView, setCurrentView }) => {
    return (
        <ul>
            <NavLink view="business-unit-management" label="Manajemen Usaha" icon={BuildingStorefrontIcon} currentView={currentView} setCurrentView={setCurrentView} />
            <NavLink view="payment-methods" label="Metode Pembayaran" icon={BanknotesIcon} currentView={currentView} setCurrentView={setCurrentView} />
            <NavLink view="units" label="Unit Satuan" icon={ScaleIcon} currentView={currentView} setCurrentView={setCurrentView} />
        </ul>
    );
};

const KeuanganSidebar: React.FC<{
    currentView: SubView | null;
    setCurrentView: (view: SubView) => void;
}> = ({ currentView, setCurrentView }) => {
    return (
        <ul>
            <NavLink view="jurnal-umum" label="Jurnal Umum" icon={ReportIcon} currentView={currentView} setCurrentView={setCurrentView} />
            <NavLink view="laporan-phu" label="Laporan PHU" icon={ReportIcon} currentView={currentView} setCurrentView={setCurrentView} />
            <NavLink view="laporan-neraca" label="Laporan Neraca" icon={ReportIcon} currentView={currentView} setCurrentView={setCurrentView} />
            <NavLink view="cash-flow-report" label="Laporan Arus Kas" icon={ReportIcon} currentView={currentView} setCurrentView={setCurrentView} />
            <NavLink view="equity-change-report" label="Laporan Perubahan Modal" icon={ReportIcon} currentView={currentView} setCurrentView={setCurrentView} />
            <NavLink view="rasio-keuangan" label="Rasio Keuangan" icon={ScaleIcon} currentView={currentView} setCurrentView={setCurrentView} />
        </ul>
    );
};


const Sidebar: React.FC<SidebarProps> = ({ mainView, subView, setSubView, selectedBusinessUnit, onSwitchBusinessUnit }) => {
    
    if (mainView === 'dashboard') {
        return <aside className="w-0 md:w-16 bg-white border-r border-slate-200 transition-all duration-300"></aside>; // Collapsed sidebar for main dashboard
    }

    const renderSidebarContent = () => {
        switch(mainView) {
            case 'usaha':
                if (selectedBusinessUnit) {
                    return <UsahaSidebar currentView={subView} setCurrentView={setSubView} />;
                }
                return <UsahaGeneralSidebar currentView={subView} setCurrentView={setSubView} />;
            case 'keuangan':
                return <KeuanganSidebar currentView={subView} setCurrentView={setSubView} />;
            case 'koperasi':
                 return (
                    <ul>
                       <NavLink view="cooperative-management" label="Anggota Koperasi" icon={UserGroupIcon} currentView={subView} setCurrentView={setSubView} />
                    </ul>
                 );
            case 'pengaturan':
                return (
                     <ul>
                       <NavLink view="user-management" label="Manajemen Akun" icon={EmployeeIcon} currentView={subView} setCurrentView={setSubView} />
                    </ul>
                );
            default:
                return null;
        }
    }

    return (
        <aside className="w-64 bg-white text-slate-700 flex flex-col hidden md:flex border-r border-slate-200 transition-all duration-300">
            {mainView === 'usaha' && selectedBusinessUnit && (
                <div className="h-16 flex items-center justify-between border-b border-slate-200 px-4">
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-slate-800 truncate">{selectedBusinessUnit.name}</p>
                        <p className="text-xs text-slate-500">Portal Usaha</p>
                    </div>
                    <button 
                        onClick={onSwitchBusinessUnit} 
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                        title="Kembali ke Daftar Usaha"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                </div>
            )}
             {mainView !== 'usaha' && (
                <div className="h-16 flex items-center border-b border-slate-200 px-4">
                     <p className="text-lg font-bold text-slate-800 capitalize">{mainView}</p>
                </div>
             )}
             {mainView === 'usaha' && !selectedBusinessUnit && (
                 <div className="h-16 flex items-center border-b border-slate-200 px-4">
                     <p className="text-lg font-bold text-slate-800 capitalize">Portal Usaha</p>
                </div>
             )}
            
            <nav className="flex-1 px-2 py-4 overflow-y-auto">
               {renderSidebarContent()}
            </nav>
        </aside>
    );
};

export default Sidebar;
