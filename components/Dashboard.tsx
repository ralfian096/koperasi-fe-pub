
import React, { useState, useMemo } from 'react';
import usePosData from '../hooks/usePosData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CashIcon, ShoppingCartIcon, TagIcon } from './icons/Icons';
import { Product, Variant } from '../types';

// Fungsi untuk memformat angka menjadi format yang ringkas (Juta/Ribu)
const formatNumberCompact = (num: number): string => {
  if (num >= 1_000_000) {
    // Format ke satu desimal dan ganti titik dengan koma untuk lokalisasi
    return `${(num / 1_000_000).toFixed(1).replace('.', ',')} Juta`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace('.', ',')} Ribu`;
  }
  // Gunakan toLocaleString untuk angka di bawah 1000
  return num.toLocaleString('id-ID');
};

const formatCurrency = (amount: number) => `Rp${amount.toLocaleString('id-ID')}`;


const MetricCard: React.FC<{ title: string; value: string; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
        <div className="bg-indigo-100 p-3 rounded-full">
            <Icon className="h-6 w-6 text-indigo-600" />
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
                <p className="font-semibold text-slate-700">{product.name} - <span className="text-indigo-600">{variant.name}</span></p>
                <p className="text-sm text-slate-500">{categoryName}</p>
            </div>
        </div>
        <p className="font-bold text-red-600">{variant.stock} tersisa</p>
    </li>
);

const Dashboard: React.FC = () => {
    const { businessUnits, outlets, products, transactions, categories, operationalCosts, variants } = usePosData();
    const [selectedUnit, setSelectedUnit] = useState<string>('all');
    const [selectedOutlet, setSelectedOutlet] = useState<string>('all');

    const categoryMap = useMemo(() => 
        categories.reduce((acc, cat) => {
            acc[cat.id] = cat.name;
            return acc;
        }, {} as Record<string, string>),
    [categories]);
    
    const productMap = useMemo(() =>
        products.reduce((acc, prod) => {
            acc[prod.id] = prod;
            return acc;
        }, {} as Record<string, Product>),
    [products]);

    const availableOutlets = useMemo(() => {
        if (selectedUnit === 'all') return outlets;
        return outlets.filter(o => o.businessUnitId === selectedUnit);
    }, [selectedUnit, outlets]);
    
    React.useEffect(() => {
        setSelectedOutlet('all');
    }, [selectedUnit]);
    
    const filteredData = useMemo(() => {
        let filteredTransactions = transactions;
        let filteredProducts = products;
        let filteredCosts = operationalCosts;
        let filteredVariants = variants;

        const outletIdsInSelectedUnit = availableOutlets.map(o => o.id);

        if (selectedUnit !== 'all') {
            const productIdsInUnit = products.filter(p => outletIdsInSelectedUnit.includes(p.outletId)).map(p => p.id);
            filteredTransactions = filteredTransactions.filter(t => outletIdsInSelectedUnit.includes(t.outletId));
            filteredProducts = filteredProducts.filter(p => outletIdsInSelectedUnit.includes(p.outletId));
            filteredCosts = filteredCosts.filter(c => outletIdsInSelectedUnit.includes(c.outletId));
            filteredVariants = filteredVariants.filter(v => productIdsInUnit.includes(v.productId));
        }
        
        if (selectedOutlet !== 'all') {
            const productIdsInOutlet = products.filter(p => p.outletId === selectedOutlet).map(p => p.id);
            filteredTransactions = filteredTransactions.filter(t => t.outletId === selectedOutlet);
            filteredProducts = filteredProducts.filter(p => p.outletId === selectedOutlet);
            filteredCosts = filteredCosts.filter(c => c.outletId === selectedOutlet);
            filteredVariants = filteredVariants.filter(v => productIdsInOutlet.includes(v.productId));
        }

        return { filteredTransactions, filteredProducts, filteredCosts, filteredVariants };
    }, [transactions, products, operationalCosts, variants, selectedUnit, selectedOutlet, availableOutlets]);

    const { filteredTransactions, filteredProducts, filteredCosts, filteredVariants } = filteredData;
    
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

    const summaryReport = useMemo(() => {
        const unitsToShow = selectedUnit === 'all' 
            ? businessUnits 
            : businessUnits.filter(bu => bu.id === selectedUnit);

        return unitsToShow.map(unit => {
            const outletsInUnit = outlets.filter(o => o.businessUnitId === unit.id);
            const outletIdsInUnit = outletsInUnit.map(o => o.id);

            const unitTransactions = filteredTransactions.filter(t => outletIdsInUnit.includes(t.outletId));
            const unitCosts = filteredCosts.filter(c => outletIdsInUnit.includes(c.outletId));

            const omzet = unitTransactions
                .filter(t => t.status === 'Selesai')
                .reduce((sum, t) => sum + t.total, 0);
                
            const totalCost = unitCosts.reduce((sum, c) => sum + c.amount, 0);
            
            const profitLoss = omzet - totalCost;

            return {
                unitId: unit.id,
                unitName: unit.name,
                omzet,
                totalCost,
                profitLoss
            };
        });
    }, [businessUnits, outlets, selectedUnit, filteredTransactions, filteredCosts]);
    
    const totalOverallOmzet = summaryReport.reduce((sum, report) => sum + report.omzet, 0);
    const totalOverallCost = summaryReport.reduce((sum, report) => sum + report.totalCost, 0);
    const totalOverallProfitLoss = totalOverallOmzet - totalOverallCost;

    const datePeriod = useMemo(() => {
        if (filteredTransactions.length === 0) {
            return "Tidak ada data transaksi";
        }
        const dates = filteredTransactions.map(t => t.date.getTime());
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
        if (minDate.toDateString() === maxDate.toDateString()) {
            return minDate.toLocaleDateString('id-ID', options);
        }
        return `${minDate.toLocaleDateString('id-ID', options)} - ${maxDate.toLocaleDateString('id-ID', options)}`;
    }, [filteredTransactions]);


    const lowStockVariants = filteredVariants.filter(v => v.stock < 10).sort((a, b) => a.stock - b.stock).slice(0, 5);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <h2 className="text-3xl font-bold text-slate-800">Dasbor</h2>
                 <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <select
                      value={selectedUnit}
                      onChange={(e) => setSelectedUnit(e.target.value)}
                      className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="all">Semua Unit Usaha</option>
                      {businessUnits.map(unit => (
                        <option key={unit.id} value={unit.id}>{unit.name}</option>
                      ))}
                    </select>
                    <select
                       value={selectedOutlet}
                       onChange={(e) => setSelectedOutlet(e.target.value)}
                       className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                       disabled={selectedUnit === 'all'}
                    >
                      <option value="all">Semua Outlet</option>
                       {availableOutlets.map(outlet => (
                        <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
                      ))}
                    </select>
                 </div>
            </div>
            
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
                        <Line type="monotone" dataKey="penjualan" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-md w-full">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Laporan Ringkas</h3>
                            <p className="text-sm text-slate-500">Periode: {datePeriod}</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="border-b-2 border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Unit Bisnis</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Omzet</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Biaya Operasional</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 uppercase">Laba/Rugi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summaryReport.length > 0 ? (
                                    summaryReport.map(report => (
                                        <tr key={report.unitId} className="border-b border-slate-100 last:border-b-0">
                                            <td className="px-4 py-3 font-medium text-slate-800">{report.unitName}</td>
                                            <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(report.omzet)}</td>
                                            <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(report.totalCost)}</td>
                                            <td className={`px-4 py-3 text-right font-semibold ${report.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(report.profitLoss)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-6 text-slate-500">Tidak ada data untuk ditampilkan.</td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-bold text-slate-800">Total Keseluruhan</th>
                                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-800">{formatCurrency(totalOverallOmzet)}</td>
                                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-800">{formatCurrency(totalOverallCost)}</td>
                                    <td className={`px-4 py-3 text-right text-sm font-bold ${totalOverallProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(totalOverallProfitLoss)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md w-full">
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
