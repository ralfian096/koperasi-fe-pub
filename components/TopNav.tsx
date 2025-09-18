
import React, { useState, useEffect, useRef } from 'react';
import type { MainView } from '../App';
import { BusinessUnit } from '../types';
import { LogoutIcon, UserCircleIcon, Cog6ToothIcon, KeyIcon } from './icons/Icons';

interface TopNavProps {
  currentMainView: MainView;
  setMainView: (view: MainView) => void;
  setSelectedBusinessUnit: (unit: BusinessUnit | null) => void;
  onLogout: () => void;
}

const NavItem: React.FC<{
    view: MainView;
    label: string;
    current: MainView;
    onClick: (view: MainView) => void;
}> = ({ view, label, current, onClick }) => (
    <button 
        onClick={() => onClick(view)}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            current === view 
                ? 'bg-slate-900/10 text-white'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
        }`}
    >
        {label}
    </button>
);


const TopNav: React.FC<TopNavProps> = ({ currentMainView, setMainView, setSelectedBusinessUnit, onLogout }) => {
    
    // State for the user dropdown menu
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleNavClick = (view: MainView) => {
        setMainView(view);
        setSelectedBusinessUnit(null); // Reset context when switching main sections
    };

    const navItems: {id: MainView, label: string}[] = [
        { id: 'dashboard', label: 'Dasbor' },
        { id: 'usaha', label: 'Usaha' },
        { id: 'pengajuan', label: 'Pengajuan' },
        { id: 'koperasi', label: 'Koperasi' },
        { id: 'keuangan', label: 'Keuangan' },
        { id: 'pengaturan', label: 'Pengaturan' },
    ];
    
    const handleLogoutClick = () => {
        setIsDropdownOpen(false);
        onLogout();
    };

    // Effect to handle clicks outside the dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="bg-indigo-700 shadow-md z-20">
            <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center gap-2">
                             <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                            </svg>
                            <span className="text-white text-xl font-bold">ControlMap</span>
                        </div>
                        <nav className="hidden md:block ml-10">
                            <div className="flex items-baseline space-x-4">
                               {navItems.map(item => (
                                   <NavItem 
                                     key={item.id}
                                     view={item.id}
                                     label={item.label}
                                     current={currentMainView}
                                     onClick={handleNavClick}
                                   />
                               ))}
                            </div>
                        </nav>
                    </div>
                    <div className="flex items-center">
                        {/* Profile dropdown */}
                        <div className="relative ml-3" ref={dropdownRef}>
                            <div>
                                <button 
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    type="button"
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-800 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600" id="user-menu-button" aria-expanded="false" aria-haspopup="true"
                                >
                                    <span className="sr-only">Open user menu</span>
                                    DF
                                </button>
                            </div>

                            {isDropdownOpen && (
                                <div 
                                    className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none" 
                                    role="menu" 
                                    aria-orientation="vertical" 
                                    aria-labelledby="user-menu-button"
                                >
                                    <div className="px-4 py-3 border-b border-slate-200">
                                        <p className="text-sm text-slate-800 font-semibold">Administrator</p>
                                        <p className="text-xs text-slate-500 truncate">admin@example.com</p>
                                    </div>
                                    <div className="py-1">
                                        <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem">
                                            <UserCircleIcon className="w-5 h-5 text-slate-500"/>
                                            Profil Saya
                                        </a>
                                        <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem">
                                            <Cog6ToothIcon className="w-5 h-5 text-slate-500"/>
                                            Pengaturan Akun
                                        </a>
                                        <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem">
                                            <KeyIcon className="w-5 h-5 text-slate-500"/>
                                            Hak Akses
                                        </a>
                                    </div>
                                    <div className="py-1 border-t border-slate-200">
                                        <button 
                                            onClick={handleLogoutClick}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50" role="menuitem"
                                        >
                                            <LogoutIcon className="w-5 h-5"/>
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopNav;
