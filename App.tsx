
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProductManagement from './components/ProductManagement';
import TransactionHistory from './components/TransactionHistory';
import EmployeeManagement from './components/placeholders/EmployeeManagement';
import OperationalCosts from './components/placeholders/OperationalCosts';
import UserManagement from './components/placeholders/UserManagement';
import ProductCategoryManagement from './components/ProductCategoryManagement';
import OperationalCostCategoryManagement from './components/OperationalCostCategoryManagement';
import ProfitLossReport from './components/ProfitLossReport';
import SalesTurnoverReport from './components/SalesTurnoverReport';
import CooperativeManagement from './components/CooperativeManagement';
import CooperativeOthers from './components/placeholders/CooperativeOthers';
import BusinessUnitManagement from './components/BusinessUnitManagement';
import OutletManagement from './components/OutletManagement';
import LoginPage from './components/LoginPage';
import { User } from './types';
import CustomerManagement from './components/CustomerManagement';
import CustomerCategoryManagement from './components/CustomerCategoryManagement';
import { NotificationProvider } from './contexts/NotificationContext';

export type View = 
  | 'dashboard' 
  | 'products' 
  | 'product-categories'
  | 'transactions' 
  | 'employees'
  | 'operational-costs'
  | 'operational-cost-categories'
  | 'cooperative-management'
  | 'cooperative-others'
  | 'profit-loss-report'
  | 'sales-turnover-report'
  | 'user-management'
  | 'business-units'
  | 'outlets'
  | 'customers'
  | 'customer-categories';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCurrentView('dashboard'); // Reset view on logout
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return <ProductManagement />;
      case 'product-categories':
        return <ProductCategoryManagement />;
      case 'transactions':
        return <TransactionHistory />;
      case 'employees':
        return <EmployeeManagement />;
      case 'operational-costs':
        return <OperationalCosts />;
      case 'operational-cost-categories':
        return <OperationalCostCategoryManagement />;
      case 'cooperative-management':
        return <CooperativeManagement />;
      case 'cooperative-others':
        return <CooperativeOthers />;
      case 'profit-loss-report':
        return <ProfitLossReport />;
      case 'sales-turnover-report':
        return <SalesTurnoverReport />;
      case 'user-management':
        return <UserManagement />;
      case 'business-units':
        return <BusinessUnitManagement />;
      case 'outlets':
        return <OutletManagement />;
      case 'customers':
        return <CustomerManagement />;
      case 'customer-categories':
        return <CustomerCategoryManagement />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <NotificationProvider>
      <div className="flex h-screen bg-slate-100 font-sans">
        <Sidebar 
          currentView={currentView} 
          setCurrentView={setCurrentView}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {renderView()}
        </main>
      </div>
    </NotificationProvider>
  );
};

export default App;
