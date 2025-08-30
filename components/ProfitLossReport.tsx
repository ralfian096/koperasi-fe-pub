import React, { useState, useMemo, useEffect } from 'react';
import usePosData from '../hooks/usePosData';
import { Transaction, OperationalCost } from '../types';

// Helper to get years for dropdowns
const generateYears = (transactions: Transaction[], costs: OperationalCost[]): number[] => {
    const transactionYears = transactions.map(t => new Date(t.date).getFullYear());
    const costYears = costs.map(c => new Date(c.date).getFullYear());
    return Array.from(new Set([...transactionYears, ...costYears])).sort((a, b) => b - a);
};

const ProfitLossReport: React.FC = () => {
    const { businessUnits, outlets, transactions, operationalCosts, operationalCostCategories } = usePosData();

    // State for filters
    const [selectedUnit, setSelectedUnit] = useState<string>('all');
    const [selectedOutlet, setSelectedOutlet] = useState<string>('all');
    
    // New time filter state
    const [timeFilterMode, setTimeFilterMode] = useState<'daily' | 'monthly' | 'yearly' | 'all'>('all');
    const [dailyFilter, setDailyFilter] = useState({ startDate: '', endDate: '' });
    const [monthlyFilter, setMonthlyFilter] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
    const [yearlyFilter, setYearlyFilter] = useState({ year: new Date().getFullYear() });

    const availableOutlets = useMemo(() => {
        if (selectedUnit === 'all') return outlets;
        return outlets.filter(o => o.businessUnitId === selectedUnit);
    }, [selectedUnit, outlets]);
    
    useEffect(() => {
        setSelectedOutlet('all');
    }, [selectedUnit]);

    const costCategoryMap = useMemo(() => 
        operationalCostCategories.reduce((acc, cat) => {
            acc[cat.id] = cat.name;
            return acc;
        }, {} as Record<string, string>),
    [operationalCostCategories]);
    
    const availableYears = useMemo(() => generateYears(transactions, operationalCosts), [transactions, operationalCosts]);

    const reportData = useMemo(() => {
        let start: Date | null = null;
        let end: Date | null = null;

        switch (timeFilterMode) {
            case 'daily':
                start = dailyFilter.startDate ? new Date(dailyFilter.startDate) : null;
                if(start) start.setHours(0, 0, 0, 0);
                end = dailyFilter.endDate ? new Date(dailyFilter.endDate) : null;
                if(end) end.setHours(23, 59, 59, 999);
                break;
            case 'monthly':
                start = new Date(monthlyFilter.year, monthlyFilter.month - 1, 1);
                end = new Date(monthlyFilter.year, monthlyFilter.month, 0, 23, 59, 59, 999);
                break;
            case 'yearly':
                start = new Date(yearlyFilter.year, 0, 1);
                end = new Date(yearlyFilter.year, 11, 31, 23, 59, 59, 999);
                break;
            case 'all':
            default:
                break;
        }

        let relevantOutletIds: string[];
        if (selectedUnit === 'all') {
            relevantOutletIds = outlets.map(o => o.id);
        } else if (selectedOutlet === 'all') {
            relevantOutletIds = availableOutlets.map(o => o.id);
        } else {
            relevantOutletIds = [selectedOutlet];
        }

        const filteredTransactions = transactions.filter(t => {
            if (!relevantOutletIds.includes(t.outletId)) return false;
            const transactionDate = new Date(t.date);
            if (start && transactionDate < start) return false;
            if (end && transactionDate > end) return false;
            return t.status === 'Selesai';
        });

        const filteredCosts = operationalCosts.filter(c => {
            if (!relevantOutletIds.includes(c.outletId)) return false;
            const costDate = new Date(c.date);
            if (start && costDate < start) return false;
            if (end && costDate > end) return false;
            return true;
        });

        const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
        const totalCosts = filteredCosts.reduce((sum, c) => sum + c.amount, 0);
        const profitLoss = totalRevenue - totalCosts;

        const costsByCategory = filteredCosts.reduce((acc, cost) => {
            const categoryName = costCategoryMap[cost.categoryId] || 'Tanpa Kategori';
            acc[categoryName] = (acc[categoryName] || 0) + cost.amount;
            return acc;
        }, {} as Record<string, number>);

        return { totalRevenue, totalCosts, profitLoss, costsByCategory };
    }, [transactions, operationalCosts, selectedUnit, selectedOutlet, timeFilterMode, dailyFilter, monthlyFilter, yearlyFilter, outlets, availableOutlets, costCategoryMap]);

    const formatCurrency = (amount: number) => `Rp${amount.toLocaleString('id-ID')}`;
    
    const months = [
        { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
        { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
        { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
        { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' }
    ];

    const renderTimeFilterInputs = () => {
        switch (timeFilterMode) {
            case 'daily':
                return (
                    <>
                        <input type="date" value={dailyFilter.startDate} onChange={(e) => setDailyFilter(p => ({...p, startDate: e.target.value}))} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                        <input type="date" value={dailyFilter.endDate} onChange={(e) => setDailyFilter(p => ({...p, endDate: e.target.value}))} min={dailyFilter.startDate} disabled={!dailyFilter.startDate} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100"/>
                    </>
                );
            case 'monthly':
                 return (
                    <>
                        <select value={monthlyFilter.month} onChange={(e) => setMonthlyFilter(p => ({...p, month: parseInt(e.target.value)}))} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                             {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                        <select value={monthlyFilter.year} onChange={(e) => setMonthlyFilter(p => ({...p, year: parseInt(e.target.value)}))} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                             {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </>
                );
            case 'yearly':
                return (
                     <select value={yearlyFilter.year} onChange={(e) => setYearlyFilter(p => ({...p, year: parseInt(e.target.value)}))} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                         {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                );
            case 'all':
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Laporan Laba Rugi</h2>
            
            {/* Filters */}
            <div className="p-4 bg-white rounded-lg shadow-md space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="all">Semua Unit Usaha</option>
                        {businessUnits.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                    </select>
                    <select value={selectedOutlet} onChange={(e) => setSelectedOutlet(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" disabled={selectedUnit === 'all'}>
                        <option value="all">Semua Outlet</option>
                        {availableOutlets.map(outlet => <option key={outlet.id} value={outlet.id}>{outlet.name}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="text-sm font-medium text-slate-600 block mb-1">Mode Waktu</label>
                        <select value={timeFilterMode} onChange={(e) => setTimeFilterMode(e.target.value as any)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="all">Semua Waktu</option>
                            <option value="daily">Harian</option>
                            <option value="monthly">Bulanan</option>
                            <option value="yearly">Tahunan</option>
                        </select>
                    </div>
                    {renderTimeFilterInputs()}
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <p className="text-sm text-slate-500 font-medium">Total Pendapatan</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.totalRevenue)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <p className="text-sm text-slate-500 font-medium">Total Biaya</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(reportData.totalCosts)}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <p className="text-sm text-slate-500 font-medium">Laba / Rugi Bersih</p>
                    <p className={`text-2xl font-bold ${reportData.profitLoss >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
                        {formatCurrency(reportData.profitLoss)}
                    </p>
                </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <h3 className="text-xl font-bold text-slate-800 p-6">Rincian Biaya Operasional</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kategori Biaya</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total Jumlah</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {Object.entries(reportData.costsByCategory).length > 0 ? (
                                Object.entries(reportData.costsByCategory).sort(([,a],[,b]) => b-a).map(([category, amount]) => (
                                    <tr key={category}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{category}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-700">{formatCurrency(amount)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} className="text-center py-10 text-slate-500">
                                        Tidak ada data biaya untuk filter ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
export default ProfitLossReport;