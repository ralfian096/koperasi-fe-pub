import React, { useState, useEffect, useRef } from 'react';
import type { MainView } from '../App';
import { BusinessUnit } from '../types';
import { 
    LogoutIcon, 
    UserCircleIcon, 
    Cog6ToothIcon, 
    KeyIcon, 
    DashboardIcon,
    BuildingStorefrontIcon,
    DocumentTextIcon,
    EllipsisHorizontalIcon,
    XMarkIcon,
    BanknotesIcon,
    CooperativeIcon,
    SettingsIcon
} from './icons/Icons';

interface TopNavProps {
  currentMainView: MainView;
  setMainView: (view: MainView) => void;
  setSelectedBusinessUnit: (unit: BusinessUnit | null) => void;
  onLogout: () => void;
}

const NavItemDesktop: React.FC<{
    view: MainView;
    label: string;
    current: MainView;
    onClick: (view: MainView) => void;
}> = ({ view, label, current, onClick }) => (
    <button 
        onClick={() => onClick(view)}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            current === view 
                ? 'bg-primary-900/50 text-white'
                : 'text-primary-200 hover:bg-primary-700/50 hover:text-white'
        }`}
    >
        {label}
    </button>
);

const NavItemMobile: React.FC<{
    view?: MainView;
    label: string;
    icon: React.ElementType;
    current?: MainView;
    onClick: (view?: MainView) => void;
    isActive?: boolean;
}> = ({ view, label, icon: Icon, current, onClick, isActive }) => (
    <button
        onClick={() => onClick(view)}
        className={`flex flex-col items-center justify-center space-y-1 w-full pt-2 pb-1 transition-colors duration-200 ${
            isActive || current === view
                ? 'text-primary-600'
                : 'text-slate-500 hover:text-primary-600'
        }`}
    >
        <Icon className="w-6 h-6" />
        <span className="text-xs font-medium">{label}</span>
    </button>
);


const BottomSheet: React.FC<{
    title: string;
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}> = ({ title, isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
            
            {/* Sheet Content */}
            <div className="fixed bottom-0 left-0 right-0">
                <div className="bg-white rounded-t-2xl shadow-lg pt-4 pb-6 animate-slide-up">
                    <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
                            <XMarkIcon className="w-6 h-6 text-slate-500" />
                        </button>
                    </div>
                    <div className="mt-4 px-4">
                        {children}
                    </div>
                </div>
            </div>
             <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};


const TopNav: React.FC<TopNavProps> = ({ currentMainView, setMainView, setSelectedBusinessUnit, onLogout }) => {
    
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [activeSheet, setActiveSheet] = useState<'none' | 'lainnya' | 'profil'>('none');

    const handleNavClick = (view: MainView) => {
        setMainView(view);
        setSelectedBusinessUnit(null);
        setActiveSheet('none');
    };
    
    const handleLogoutClick = () => {
        setIsDropdownOpen(false);
        setActiveSheet('none');
        onLogout();
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isLainnyaActive = ['keuangan', 'koperasi', 'pengaturan'].includes(currentMainView);

    return (
        <>
            {/* --- Desktop Navigation --- */}
            <header className="bg-primary-700 shadow-md z-20 hidden md:block">
                <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 flex items-center gap-2">
                                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9l-9 5.25" />
                                </svg>
                                <span className="text-white font-bold text-xl">Back Office</span>
                            </div>
                            <nav className="ml-10 flex items-baseline space-x-4">
                                <NavItemDesktop view="dashboard" label="Dasbor" current={currentMainView} onClick={handleNavClick} />
                                <NavItemDesktop view="usaha" label="Usaha" current={currentMainView} onClick={handleNavClick} />
                                <NavItemDesktop view="pengajuan" label="Pengajuan" current={currentMainView} onClick={handleNavClick} />
                                <NavItemDesktop view="keuangan" label="Keuangan" current={currentMainView} onClick={handleNavClick} />
                                <NavItemDesktop view="koperasi" label="Koperasi" current={currentMainView} onClick={handleNavClick} />
                                <NavItemDesktop view="pengaturan" label="Pengaturan" current={currentMainView} onClick={handleNavClick} />
                            </nav>
                        </div>
                        <div className="relative" ref={dropdownRef}>
                            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="p-2 bg-primary-800 text-primary-200 rounded-full hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-800">
                                <span className="font-semibold px-2">DF</span>
                            </button>
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <div className="py-1" role="menu" aria-orientation="vertical">
                                        <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"><UserCircleIcon className="w-5 h-5"/>Profil Saya</a>
                                        <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"><Cog6ToothIcon className="w-5 h-5"/>Pengaturan Akun</a>
                                        <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"><KeyIcon className="w-5 h-5"/>Hak Akses</a>
                                        <button onClick={handleLogoutClick} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                            <LogoutIcon className="w-5 h-5"/>
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* --- Mobile Navigation --- */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-30 flex justify-around">
                <NavItemMobile view="dashboard" label="Dasbor" icon={DashboardIcon} current={currentMainView} onClick={(v) => handleNavClick(v!)} />
                <NavItemMobile view="usaha" label="Usaha" icon={BuildingStorefrontIcon} current={currentMainView} onClick={(v) => handleNavClick(v!)} />
                <NavItemMobile view="pengajuan" label="Pengajuan" icon={DocumentTextIcon} current={currentMainView} onClick={(v) => handleNavClick(v!)} />
                <NavItemMobile label="Profil" icon={UserCircleIcon} onClick={() => setActiveSheet('profil')} />
                <NavItemMobile label="Lainnya" icon={EllipsisHorizontalIcon} onClick={() => setActiveSheet('lainnya')} isActive={isLainnyaActive} />
            </nav>

            {/* --- Bottom Sheets for Mobile --- */}
            <BottomSheet title="Menu Lainnya" isOpen={activeSheet === 'lainnya'} onClose={() => setActiveSheet('none')}>
                <div className="space-y-2">
                    <a onClick={() => handleNavClick('keuangan')} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-100 text-slate-700">
                        <BanknotesIcon className="w-6 h-6 text-slate-500" />
                        <span className="font-semibold">Keuangan</span>
                    </a>
                    <a onClick={() => handleNavClick('koperasi')} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-100 text-slate-700">
                        <CooperativeIcon className="w-6 h-6 text-slate-500" />
                        <span className="font-semibold">Koperasi</span>
                    </a>
                    <a onClick={() => handleNavClick('pengaturan')} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-100 text-slate-700">
                        <SettingsIcon className="w-6 h-6 text-slate-500" />
                        <span className="font-semibold">Pengaturan</span>
                    </a>
                </div>
            </BottomSheet>
            <BottomSheet title="Profil & Akun" isOpen={activeSheet === 'profil'} onClose={() => setActiveSheet('none')}>
                 <div className="space-y-2">
                    <a href="#" className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-100 text-slate-700">
                        <UserCircleIcon className="w-6 h-6 text-slate-500" />
                        <span className="font-semibold">Profil Saya</span>
                    </a>
                     <a href="#" className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-100 text-slate-700">
                        <Cog6ToothIcon className="w-6 h-6 text-slate-500" />
                        <span className="font-semibold">Pengaturan Akun</span>
                    </a>
                     <a href="#" className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-100 text-slate-700">
                        <KeyIcon className="w-6 h-6 text-slate-500" />
                        <span className="font-semibold">Hak Akses</span>
                    </a>
                    <button onClick={handleLogoutClick} className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-red-50 text-red-600">
                        <LogoutIcon className="w-6 h-6" />
                        <span className="font-semibold">Logout</span>
                    </button>
                </div>
            </BottomSheet>
        </>
    );
};

export default TopNav;
