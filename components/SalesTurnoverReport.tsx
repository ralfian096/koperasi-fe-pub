
import React, { useState, useMemo, useEffect } from 'react';
import usePosData from '../hooks/usePosData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Transaction } from '../types';

// Helper to get years for dropdowns
const generateYears = (transactions: Transaction[]): number[] => {
    const years = transactions.map(t => new Date(t.date).getFullYear());
    return Array.from(new Set(years)).sort((a, b) => b - a);
};


const SalesTurnoverReport: React.FC = () => {
    const { businessUnits, outlets, transactions } = usePosData();

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
        return outlets.filter(o => o.businessUnitId === Number(selectedUnit));
    }, [selectedUnit, outlets]);
    
    useEffect(() => {
        setSelectedOutlet('all');
    }, [selectedUnit]);
    
    const availableYears = useMemo(() => generateYears(transactions), [transactions]);

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
        
        let relevantOutletIds: number[];
        if (selectedUnit === 'all') {
            relevantOutletIds = outlets.map(o => o.id);
        } else if (selectedOutlet === 'all') {
            relevantOutletIds = availableOutlets.map(o => o.id);
        } else {
            relevantOutletIds = [Number(selectedOutlet)];
        }

        const filteredTransactions = transactions.filter(t => {
            if (!relevantOutletIds.includes(t.outletId)) return false;
            const transactionDate = new Date(t.date);
            if (start && transactionDate < start) return false;
            if (end && transactionDate > end) return false;
            return t.status === 'Selesai';
        });

        const totalTurnover = filteredTransactions.reduce((sum, t) => sum + t.total, 0);

        const dailyTurnover = filteredTransactions.reduce((acc, t) => {
            const dateStr = new Date(t.date).toISOString().split('T')[0];
            acc[dateStr] = (acc[dateStr] || 0) + t.total;
            return acc;
        }, {} as Record<string, number>);
        
        const sortedChartData = Object.entries(dailyTurnover)
            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
            .map(([date, omzet]) => ({
                 name: new Date(date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
                 omzet,
            }));


        return { totalTurnover, chartData: sortedChartData };
    }, [transactions, selectedUnit, selectedOutlet, timeFilterMode, dailyFilter, monthlyFilter, yearlyFilter, outlets, availableOutlets]);

    const formatCurrency = (amount: number) => `Rp${amount.toLocaleString('id-ID')}`;
    
    const months = [
        { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
        { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
        { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
        { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' }
    ];

    const timeFilterModeOpt = [
      {value: "all", title: "Semua Waktu"},
      {value: "daily", title: "Harian"},
      {value: "monthly", title: "Bulanan"},
      {value: "yearly", title: "Tahunan"},
    ];

    const renderTimeFilterInputs = () => {
        switch (timeFilterMode) {
            case 'daily':
                return (
                    <>
                        <input type="date" value={dailyFilter.startDate} onChange={(e) => setDailyFilter(p => ({...p, startDate: e.target.value}))} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"/>
                        <input type="date" value={dailyFilter.endDate} onChange={(e) => setDailyFilter(p => ({...p, endDate: e.target.value}))} min={dailyFilter.startDate} disabled={!dailyFilter.startDate} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 disabled:bg-slate-100"/>
                    </>
                );
            case 'monthly':
                 return (
                    <>
                        <select value={monthlyFilter.month} onChange={(e) => setMonthlyFilter(p => ({...p, month: parseInt(e.target.value)}))} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500">
                             {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                        <select value={monthlyFilter.year} onChange={(e) => setMonthlyFilter(p => ({...p, year: parseInt(e.target.value)}))} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500">
                             {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </>
                );
            case 'yearly':
                return (
                     <select value={yearlyFilter.year} onChange={(e) => setYearlyFilter(p => ({...p, year: parseInt(e.target.value)}))} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500">
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
            <h2 className="text-3xl font-bold text-slate-800">Laporan Omzet Penjualan</h2>

            {/* Filters */}
            <div className="p-4 bg-white rounded-lg shadow-md space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500">
                        <option value="all">Semua Unit Usaha</option>
                        {businessUnits.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                    </select>
                    <select value={selectedOutlet} onChange={(e) => setSelectedOutlet(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" disabled={selectedUnit === 'all'}>
                        <option value="all">Semua Outlet</option>
                        {availableOutlets.map(outlet => <option key={outlet.id} value={outlet.id}>{outlet.name}</option>)}
                    </select>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="text-sm font-medium text-slate-600 block mb-1">Mode Waktu</label>
                        <select value={timeFilterMode} onChange={(e) => setTimeFilterMode(e.target.value as any)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500">
                            {timeFilterModeOpt.map((item, key) => (
                              <option value={item.value} key={key}>{item.title}</option>
                            ))}
                        </select>
                    </div>
                    {renderTimeFilterInputs()}
                </div>
            </div>

            {/* Summary */}
             <div className="bg-white p-6 rounded-lg shadow-md">
                <p className="text-sm text-slate-500 font-medium">Total Omzet (Periode Terpilih)</p>
                <p className="text-3xl font-bold text-red-600">{formatCurrency(reportData.totalTurnover)}</p>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Tren Omzet {timeFilterModeOpt.find(item => item.value === timeFilterMode).title}</h3>
                 <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={reportData.chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" tickFormatter={(value) => formatCurrency(Number(value))} />
                        <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Omzet']} contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}/>
                        <Legend />
                        <Line type="monotone" dataKey="omzet" stroke="#dc2626" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Omzet Penjualan"/>
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
export default SalesTurnoverReport;