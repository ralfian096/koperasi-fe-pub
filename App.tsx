

import React, { useState, useEffect } from 'react';
import { User, BusinessUnit } from './types';
import { NotificationProvider } from './contexts/NotificationContext';
import LoginPage from './components/LoginPage';
import TopNav from './components/TopNav';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import BusinessUnitSelector from './components/BusinessUnitSelector';

// Placeholders for new main views
import Pengajuan from './components/Pengajuan';
import Keuangan from './components/placeholders/Keuangan';
import CooperativeManagement from './components/CooperativeManagement';
import UserManagement from './components/placeholders/UserManagement';

// Sub-view components for "Usaha"
import BusinessUnitManagement from './components/BusinessUnitManagement';
import OutletManagement from './components/OutletManagement';
import ProductManagement from './components/ProductManagement';
import ProductCategoryManagement from './components/ProductCategoryManagement';
import TransactionHistory from './components/TransactionHistory';
import EmployeeManagement from './components/placeholders/EmployeeManagement';
import CustomerManagement from './components/CustomerManagement';
import CustomerCategoryManagement from './components/CustomerCategoryManagement';
import TaxManagement from './components/TaxManagement';
import ProfitLossReport from './components/ProfitLossReport';
// Import new placeholder components
import Jurnal from './components/placeholders/Jurnal';
import LaporanNeraca from './components/placeholders/LaporanNeraca';
import RasioKeuangan from './components/placeholders/RasioKeuangan';


export type MainView = 'dashboard' | 'usaha' | 'pengajuan' | 'koperasi' | 'keuangan' | 'pengaturan';

export type SubView = 
  | 'dashboard'
  | 'business-units' 
  | 'outlets'
  | 'products-goods' // Changed
  | 'products-rentals' // Changed
  | 'product-categories'
  | 'transactions' 
  | 'employees'
  | 'customers'
  | 'customer-categories'
  | 'taxes'
  | 'profit-loss-report'
  | 'cooperative-management' // For Koperasi section
  | 'user-management' // For Pengaturan section
  // New views for Keuangan group
  | 'jurnal'
  | 'balance-sheet-report'
  | 'financial-ratio-report';


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error("Gagal mem-parsing data pengguna dari localStorage", e);
        localStorage.removeItem('currentUser');
        return null;
      }
    }
    return null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!currentUser);

  // Initialize view states from localStorage or defaults
  const [mainView, setMainView] = useState<MainView>(() => {
    return (localStorage.getItem('mainView') as MainView) || 'dashboard';
  });
  const [subView, setSubView] = useState<SubView | null>(() => {
    return (localStorage.getItem('subView') as SubView) || null;
  });
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<BusinessUnit | null>(() => {
    const savedUnit = localStorage.getItem('selectedBusinessUnit');
    try {
      return savedUnit ? JSON.parse(savedUnit) : null;
    } catch (e) {
      console.error("Failed to parse selectedBusinessUnit from localStorage", e);
      return null;
    }
  });

  // Persist view states to localStorage on change
  useEffect(() => {
    localStorage.setItem('mainView', mainView);
  }, [mainView]);

  useEffect(() => {
    if (subView) {
      localStorage.setItem('subView', subView);
    } else {
      localStorage.removeItem('subView');
    }
  }, [subView]);

  useEffect(() => {
    if (selectedBusinessUnit) {
      localStorage.setItem('selectedBusinessUnit', JSON.stringify(selectedBusinessUnit));
    } else {
      localStorage.removeItem('selectedBusinessUnit');
    }
  }, [selectedBusinessUnit]);

  const handleLoginSuccess = (user: User) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    // Clear auth state and storage
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');

    // Clear persisted view state from localStorage
    localStorage.removeItem('mainView');
    localStorage.removeItem('subView');
    localStorage.removeItem('selectedBusinessUnit');
    
    // Reset views to default
    setMainView('dashboard');
    setSubView(null);
    setSelectedBusinessUnit(null);
  };
  
  const handleSelectBusinessUnit = (unit: BusinessUnit) => {
    setSelectedBusinessUnit(unit);
    setSubView('dashboard'); // Default view after selecting a unit is now the unit's dashboard
  };

  const renderUsahaSubView = () => {
    if (!selectedBusinessUnit) return null;
    
    switch (subView) {
      case 'dashboard':
        return <Dashboard selectedBusinessUnit={selectedBusinessUnit} />;
      case 'business-units':
        return <BusinessUnitManagement />;
      case 'outlets':
        return <OutletManagement selectedBusinessUnit={selectedBusinessUnit} />;
      case 'products-goods':
        return <ProductManagement selectedBusinessUnit={selectedBusinessUnit} productType="CONSUMPTION" />;
      case 'products-rentals':
        return <ProductManagement selectedBusinessUnit={selectedBusinessUnit} productType="RENTAL" />;
      case 'product-categories':
        return <ProductCategoryManagement selectedBusinessUnit={selectedBusinessUnit} />;
      case 'transactions':
        return <TransactionHistory selectedBusinessUnit={selectedBusinessUnit} />;
      case 'employees':
        return <EmployeeManagement />;
      case 'customers':
        return <CustomerManagement selectedBusinessUnit={selectedBusinessUnit} />;
      case 'customer-categories':
        return <CustomerCategoryManagement selectedBusinessUnit={selectedBusinessUnit} />;
      case 'taxes':
        return <TaxManagement selectedBusinessUnit={selectedBusinessUnit} />;
      case 'profit-loss-report':
        return <ProfitLossReport selectedBusinessUnit={selectedBusinessUnit} />;
      // Render new Keuangan placeholders
      case 'jurnal':
        return <Jurnal />;
      case 'balance-sheet-report':
        return <LaporanNeraca />;
      case 'financial-ratio-report':
        return <RasioKeuangan />;
      default:
        return <Dashboard selectedBusinessUnit={selectedBusinessUnit} />;
    }
  };

  const renderView = () => {
    switch (mainView) {
      case 'dashboard':
        return <Dashboard />;
      case 'usaha':
        if (selectedBusinessUnit) {
          return renderUsahaSubView();
        }
        return <BusinessUnitSelector onSelectUnit={handleSelectBusinessUnit} />;
      case 'pengajuan':
        return <Pengajuan />;
      case 'koperasi':
        return <CooperativeManagement />;
      case 'keuangan':
        return <Keuangan />;
      case 'pengaturan':
        return <UserManagement />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <NotificationProvider>
      <div className="flex flex-col h-screen bg-slate-100 font-sans">
        <TopNav 
          currentMainView={mainView}
          setMainView={setMainView}
          setSelectedBusinessUnit={setSelectedBusinessUnit}
          onLogout={handleLogout}
        />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar 
            mainView={mainView}
            subView={subView}
            setSubView={setSubView}
            selectedBusinessUnit={selectedBusinessUnit}
            onSwitchBusinessUnit={() => setSelectedBusinessUnit(null)}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {renderView()}
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
};

export default App;