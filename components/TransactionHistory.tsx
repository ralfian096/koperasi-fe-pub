import React, { useState, useMemo, useEffect } from 'react';
import usePosData from '../hooks/usePosData';
import { Transaction } from '../types';

const TransactionRow: React.FC<{ transaction: Transaction; customerName: string; }> = ({ transaction, customerName }) => {
    // Cari nama outlet berdasarkan outletId
    const { outlets } = usePosData();
    const outletName = outlets.find(o => o.id === transaction.outletId)?.name || 'N/A';
    
    return (
        <tr className="hover:bg-slate-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{transaction.id.slice(-8)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{transaction.date.toLocaleString('id-ID')}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{outletName}</td>
             <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{customerName}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                <ul className="list-disc list-inside">
                    {transaction.items.map((item, index) => (
                        <li key={`${item.productId}-${index}`}>{item.productName} (x{item.quantity})</li>
                    ))}
                </ul>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    transaction.status === 'Selesai' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                    {transaction.status}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{transaction.paymentMethod}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">Rp{transaction.total.toLocaleString('id-ID')}</td>
        </tr>
    );
};

const TransactionHistory: React.FC = () => {
    const { businessUnits, outlets, transactions, customers } = usePosData();
    
    const [selectedUnit, setSelectedUnit] = useState<string>(businessUnits[0]?.id || '');
    const [selectedOutlet, setSelectedOutlet] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Selesai' | 'Refund'>('all');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState<'all' | 'Tunai' | 'Kartu Kredit' | 'QRIS'>('all');

    const customerMap = useMemo(() => 
        customers.reduce((acc, customer) => {
            acc[customer.id] = customer.name;
            return acc;
        }, {} as Record<string, string>),
    [customers]);

    useEffect(() => {
        if (endDate && startDate > endDate) {
            setStartDate(endDate);
        }
    }, [endDate, startDate]);
    
    const availableOutlets = useMemo(() => {
        return outlets.filter(o => o.businessUnitId === selectedUnit);
    }, [selectedUnit, outlets]);
    
    useEffect(() => {
        if (availableOutlets.length > 0) {
            const currentOutletExists = availableOutlets.some(o => o.id === selectedOutlet);
            if (!currentOutletExists) {
                setSelectedOutlet(availableOutlets[0].id);
            }
        } else {
            setSelectedOutlet('');
        }
    }, [selectedUnit, availableOutlets, selectedOutlet]);

    const filteredTransactions = useMemo(() => {
        if (!selectedOutlet) return [];
        
        const start = startDate ? new Date(startDate) : null;
        if(start) start.setHours(0, 0, 0, 0);

        const end = endDate ? new Date(endDate) : null;
        if(end) end.setHours(23, 59, 59, 999);

        return transactions
            .filter(t => {
                // Filter Outlet
                if (t.outletId !== selectedOutlet) return false;
                
                // Filter Tanggal
                const transactionDate = new Date(t.date);
                if (start && transactionDate < start) return false;
                if (end && transactionDate > end) return false;

                // Filter Status
                if (statusFilter !== 'all' && t.status !== statusFilter) return false;

                // Filter Metode Pembayaran
                if (paymentMethodFilter !== 'all' && t.paymentMethod !== paymentMethodFilter) return false;

                return true;
            })
            .sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [transactions, selectedOutlet, startDate, endDate, statusFilter, paymentMethodFilter]);
    
    const summary = useMemo(() => {
        const initialSummary = {
            totalTransactions: 0,
            totalSales: 0,
            totalRefunds: 0,
            salesByPaymentMethod: {
                'Tunai': 0,
                'Kartu Kredit': 0,
                'QRIS': 0,
            } as Record<'Tunai' | 'Kartu Kredit' | 'QRIS', number>
        };

        return filteredTransactions.reduce((acc, t) => {
            acc.totalTransactions += 1;
            if (t.status === 'Selesai') {
                acc.totalSales += t.total;
                if (acc.salesByPaymentMethod[t.paymentMethod] !== undefined) {
                    acc.salesByPaymentMethod[t.paymentMethod] += t.total;
                }
            } else if (t.status === 'Refund') {
                acc.totalRefunds += t.total;
            }
            return acc;
        }, initialSummary);

    }, [filteredTransactions]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <h2 className="text-3xl font-bold text-slate-800">Riwayat Transaksi</h2>
                 <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
                    {/* Baris 1: Filter Unit & Outlet */}
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <select
                          value={selectedUnit}
                          onChange={(e) => setSelectedUnit(e.target.value)}
                          className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                        >
                          {businessUnits.map(unit => (
                            <option key={unit.id} value={unit.id}>{unit.name}</option>
                          ))}
                        </select>
                        <select
                           value={selectedOutlet}
                           onChange={(e) => setSelectedOutlet(e.target.value)}
                           className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                           disabled={availableOutlets.length === 0}
                        >
                           {availableOutlets.map(outlet => (
                            <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
                          ))}
                        </select>
                    </div>
                    {/* Baris 2: Filter Tanggal & Status & Metode Pembayaran */}
                    <div className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => {
                                const newStartDate = e.target.value;
                                setStartDate(newStartDate);
                                if (endDate && newStartDate > endDate) {
                                    setEndDate(newStartDate);
                                }
                            }}
                            className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                        />
                        <span className="text-slate-500 hidden sm:inline">-</span>
                         <input
                            type="date"
                            value={endDate}
                            min={startDate}
                            disabled={!startDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 disabled:bg-slate-100"
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'Selesai' | 'Refund')}
                            className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                        >
                            <option value="all">Semua Status</option>
                            <option value="Selesai">Selesai</option>
                            <option value="Refund">Refund</option>
                        </select>
                         <select
                            value={paymentMethodFilter}
                            onChange={(e) => setPaymentMethodFilter(e.target.value as any)}
                            className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                        >
                            <option value="all">Semua Metode</option>
                            <option value="Tunai">Tunai</option>
                            <option value="Kartu Kredit">Kartu Kredit</option>
                            <option value="QRIS">QRIS</option>
                        </select>
                    </div>
                 </div>
            </div>
            
             {/* Rangkuman Transaksi */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <p className="text-sm text-slate-500 font-medium">Total Transaksi</p>
                    <p className="text-2xl font-bold text-slate-800">{summary.totalTransactions.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <p className="text-sm text-slate-500 font-medium">Total Penjualan</p>
                    <p className="text-2xl font-bold text-green-600">Rp{summary.totalSales.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <p className="text-sm text-slate-500 font-medium">Total Refund</p>
                    <p className="text-2xl font-bold text-yellow-600">Rp{summary.totalRefunds.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <p className="text-sm text-slate-500 font-medium">Rincian Penjualan</p>
                    <div className="mt-1 text-sm space-y-1">
                        <div className="flex justify-between"><span className="text-slate-600">Tunai:</span> <span className="font-semibold text-black">Rp{summary.salesByPaymentMethod['Tunai'].toLocaleString('id-ID')}</span></div>
                        <div className="flex justify-between"><span className="text-slate-600">Kartu Kredit:</span> <span className="font-semibold text-black">Rp{summary.salesByPaymentMethod['Kartu Kredit'].toLocaleString('id-ID')}</span></div>
                        <div className="flex justify-between"><span className="text-slate-600">QRIS:</span> <span className="font-semibold text-black">Rp{summary.salesByPaymentMethod['QRIS'].toLocaleString('id-ID')}</span></div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID Transaksi</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tanggal</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Outlet</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Customer</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Item</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Metode Pembayaran</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredTransactions.length > 0 ? filteredTransactions.map((transaction) => (
                                <TransactionRow 
                                    key={transaction.id} 
                                    transaction={transaction} 
                                    customerName={transaction.customerId ? customerMap[transaction.customerId] || 'N/A' : '-'}
                                />
                            )) : (
                                <tr>
                                    <td colSpan={8} className="text-center py-10 text-slate-500">
                                         {selectedOutlet ? 'Tidak ada transaksi untuk filter ini.' : 'Silakan pilih unit usaha dan outlet.'}
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

export default TransactionHistory;