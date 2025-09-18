
import React from 'react';
import type { MainView } from '../App';
import { BusinessUnit } from '../types';

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
                        <div className="relative ml-3">
                            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-800 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600">
                                <span className="sr-only">Open user menu</span>
                                DF
                            </button>
                            {/* Dropdown can be added here later */}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopNav;
