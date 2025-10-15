import React, { useMemo, useState, useEffect, useCallback } from 'react';
import usePosData from '../hooks/usePosData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CashIcon, ShoppingCartIcon, TagIcon } from './icons/Icons';
import { Product, Variant, BusinessUnit } from '../types';

const formatNumberCompact = (num: number): string => {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace('.', ',')} Juta`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace('.', ',')} Ribu`;
  }
  return num.toLocaleString('id-ID');
};

const formatCurrency = (amount: number) => `Rp${amount.toLocaleString('id-ID')}`;

const MetricCard: React.FC<{ title: string; value: string; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
        <div className="bg-primary-100 p-3 rounded-full">
            <Icon className="h-6 w-6 text-primary-600" />
        </div>
        <div className="ml-4">
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

const LowStockListItem: React.FC<{ product: Product; variant: Variant; categoryName: string; }> = ({ product, variant, categoryName }) => (
    <li className="flex items-center justify-between py-3">
        <div className="flex items-center">
            <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-full object-cover mr-4" />
            <div>
                <p className="font-semibold text-slate-700">{product.name} - <span className="text-primary-600">{variant.name}</span></p>
                <p className="text-sm text-slate-500">{categoryName}</p>
            </div>
        </div>
        <p className="font-bold text-red-600">{variant.stock} tersisa</p>
    </li>
);

interface DashboardProps {
    selectedBusinessUnit?: BusinessUnit | null;
}

const Dashboard: React.FC<DashboardProps> = ({ selectedBusinessUnit = null }) => {
    const { businessUnits, outlets, products, transactions, categories, variants } = usePosData();
    
    // --- State for API-driven summary report ---
    const [summaryReport, setSummaryReport] = useState<any[]>([]);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [summaryDatePeriod, setSummaryDatePeriod] = useState('');

    const {
        filteredTransactions,
        filteredProducts,
        filteredVariants,
        title
    } = useMemo(() => {
        if (selectedBusinessUnit) {
            const outletIdsInUnit = outlets
                .filter(o => o.businessUnitId === selectedBusinessUnit.id)
                .map(o => o.id);

            const filteredTransactions = transactions.filter(t => outletIdsInUnit.includes(t.outletId));
            const filteredProducts = products.filter(p => outletIdsInUnit.includes(p.outletId));
            const productIds = filteredProducts.map(p => p.id);
            const filteredVariants = variants.filter(v => productIds.includes(v.productId));
            
            return {
                filteredTransactions,
                filteredProducts,
                filteredVariants,
                title: `Dasbor: ${selectedBusinessUnit.name}`
            };
        }
        
        return {
            filteredTransactions: transactions,
            filteredProducts: products,
            filteredVariants: variants,
            title: 'Dasbor Keseluruhan'
        };
    }, [selectedBusinessUnit, outlets, products, transactions, variants]);

    // --- Fetch summary report from income statement API ---
    useEffect(() => {
        // Only run on the overall dashboard and when business units are loaded
        if (selectedBusinessUnit || businessUnits.length === 0) {
            setSummaryReport([]);
            return;
        }

        const fetchSummaryData = async () => {
            setIsSummaryLoading(true);
            
            const today = new Date();
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const startDate = firstDayOfMonth.toISOString().split('T')[0];
            const endDate = today.toISOString().split('T')[0];

            setSummaryDatePeriod(`Periode: ${firstDayOfMonth.toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})} - ${today.toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}`);

            try {
                const promises = businessUnits.map(unit =>
                    fetch(`https://api.majukoperasiku.my.id/manage/finance/reports/income-statement?business_id=${unit.id}&start_date=${startDate}&end_date=${endDate}`)
                        .then(res => res.ok ? res.json() : Promise.resolve(null)) // Continue even if one fails
                );

                const results = await Promise.all(promises);

                const newSummaryData = results
                    .map((result, index) => {
                        if (result && result.code === 200 && result.data) {
                            return {
                                unitId: businessUnits[index].id,
                                unitName: businessUnits[index].name,
                                pendapatan: result.data.revenues.total,
                                pengeluaran: result.data.expenses.total,
                                netProfit: result.data.net_profit,
                            };
                        }
                        // Handle cases where an API call for a unit might fail
                        console.warn(`Gagal mengambil ringkasan untuk unit: ${businessUnits[index].name}`);
                        return {
                            unitId: businessUnits[index].id,
                            unitName: businessUnits[index].name,
                            pendapatan: 0,
                            pengeluaran: 0,
                            netProfit: 0,
                            error: true
                        };
                    });

                setSummaryReport(newSummaryData);

            } catch (error) {
                console.error("Gagal mengambil data laporan ringkas:", error);
                setSummaryReport([]); // Clear on major failure
            } finally {
                setIsSummaryLoading(false);
            }
        };

        fetchSummaryData();

    }, [selectedBusinessUnit, businessUnits]);


    const categoryMap = useMemo(() => 
        categories.reduce((acc, cat) => {
            acc[cat.id] = cat.name;
            return acc;
        }, {} as Record<string, string>),
    [categories]);
    
    const productMap = useMemo(() =>
        filteredProducts.reduce((acc, prod) => {
            acc[prod.id] = prod;
            return acc;
        }, {} as Record<string, Product>),
    [filteredProducts]);

    const totalRevenue = filteredTransactions.filter(t => t.status === 'Selesai').reduce((sum, t) => sum + t.total, 0);
    const totalSales = filteredTransactions.length;
    
    const salesData = filteredTransactions
        .filter(t => t.status === 'Selesai')
        .sort((a,b) => a.date.getTime() - b.date.getTime())
        .reduce((acc, t) => {
            const dateStr = t.date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
            const existing = acc.find(d => d.name === dateStr);
            if (existing) {
                existing.penjualan += t.total;
            } else {
                acc.push({ name: dateStr, penjualan: t.total });
            }
            return acc;
        }, [] as { name: string; penjualan: number }[]);

    // Calculate totals from the new API-driven summary report
    const { totalPendapatan, totalPengeluaran, totalNetProfit } = useMemo(() => {
        return summaryReport.reduce((acc, report) => {
            acc.totalPendapatan += report.pendapatan || 0;
            acc.totalPengeluaran += report.pengeluaran || 0;
            acc.totalNetProfit += report.netProfit || 0;
            return acc;
        }, { totalPendapatan: 0, totalPengeluaran: 0, totalNetProfit: 0 });
    }, [summaryReport]);


    const lowStockVariants = filteredVariants.filter(v => v.stock < 10).sort((a, b) => a.stock - b.stock).slice(0, 5);

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-slate-800">{title}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricCard title="Total Pendapatan" value={`Rp${formatNumberCompact(totalRevenue)}`} icon={CashIcon} />
                <MetricCard title="Total Penjualan" value={formatNumberCompact(totalSales)} icon={ShoppingCartIcon} />
                <MetricCard title="Total Produk Aktif" value={formatNumberCompact(filteredProducts.length)} icon={TagIcon} />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Tren Penjualan</h3>
                 <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" tickFormatter={(value) => `Rp${Number(value).toLocaleString('id-ID')}`} />
                        <Tooltip formatter={(value) => [`Rp${Number(value).toLocaleString('id-ID')}`, 'Penjualan']} contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}/>
                        <Legend />
                        <Line type="monotone" dataKey="penjualan" stroke="#e7000b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {!selectedBusinessUnit && (
                    <div className="bg-white p-6 rounded-lg shadow-md w-full">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Laporan Ringkas per Unit Usaha</h3>
                                <p className="text-sm text-slate-500">{summaryDatePeriod}</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="border-b-2 border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Unit Bisnis</th>
                                        <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Pendapatan</th>
                                        <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Pengeluaran</th>
                                        <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Net Profit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isSummaryLoading ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-6 text-slate-500">Memuat laporan ringkas...</td>
                                        </tr>
                                    ) : summaryReport.length > 0 ? (
                                        summaryReport.map(report => (
                                            <tr key={report.unitId} className="border-b border-slate-100 last:border-b-0">
                                                <td className="px-4 py-3 font-medium text-slate-800">{report.unitName}</td>
                                                <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(report.pendapatan)}</td>
                                                <td className="px-4 py-3 text-right text-red-600">{formatCurrency(report.pengeluaran)}</td>
                                                <td className={`px-4 py-3 text-right font-semibold ${report.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {formatCurrency(report.netProfit)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="text-center py-6 text-slate-500">Tidak ada data untuk ditampilkan.</td>
                                        </tr>
                                    )}
                                </tbody>
                                {!isSummaryLoading && (
                                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-bold text-slate-800">Total Keseluruhan</th>
                                        <td className="px-4 py-3 text-right text-sm font-bold text-slate-800">{formatCurrency(totalPendapatan)}</td>
                                        <td className="px-4 py-3 text-right text-sm font-bold text-red-600">{formatCurrency(totalPengeluaran)}</td>
                                        <td className={`px-4 py-3 text-right text-sm font-bold ${totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(totalNetProfit)}
                                        </td>
                                    </tr>
                                </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                )}
                <div className={`bg-white p-6 rounded-lg shadow-md w-full ${selectedBusinessUnit ? 'xl:col-span-2' : ''}`}>
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Peringatan Stok Rendah (&lt;10)</h3>
                    <ul className="divide-y divide-slate-200">
                        {lowStockVariants.length > 0 ? (
                            lowStockVariants.map(variant => {
                                const product = productMap[variant.productId];
                                if (!product) return null;
                                return (
                                    <LowStockListItem 
                                        key={variant.id} 
                                        product={product} 
                                        variant={variant} 
                                        categoryName={categoryMap[product.categoryId] || 'N/A'} 
                                    />
                                )
                            })
                        ) : (
                            <p className="text-slate-500 text-center py-4">Semua stok varian produk di atas ambang batas.</p>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;