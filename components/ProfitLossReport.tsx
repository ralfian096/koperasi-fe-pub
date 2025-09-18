

import React, { useState } from 'react';
import { BusinessUnit, IncomeStatementData } from '../types';
import { useNotification } from '../contexts/NotificationContext';

const API_ENDPOINT = 'https://api.majukoperasiku.my.id/manage/finance/reports/income-statement';


const formatValue = (amount: number | string | undefined, isExpense: boolean = false) => {
    if (amount === undefined || amount === null) return 'Rp 0';
    const num = parseFloat(String(amount));
    
    // For expenses, always show as (Rp ...) if positive, or Rp 0 if zero.
    if (isExpense) {
        return num > 0 ? `(Rp ${num.toLocaleString('id-ID')})` : 'Rp 0';
    }

    // For other values, show negative as (Rp ...)
    if (num < 0) {
        return `(Rp ${Math.abs(num).toLocaleString('id-ID')})`;
    }
    
    return `Rp ${num.toLocaleString('id-ID')}`;
};

const formatShu = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return 'Rp 0';
    const num = Number(amount);
     if (num < 0) {
        return `-Rp ${Math.abs(num).toLocaleString('id-ID')}`;
    }
    return `Rp ${num.toLocaleString('id-ID')}`;
};

const ReportRow: React.FC<{ label: string; amount: number; isExpense?: boolean }> = ({ label, amount, isExpense = false }) => (
    <div className="flex justify-between py-1.5">
        <p className="text-slate-600 pl-8">{label}</p>
        <p className={`${isExpense && amount > 0 ? 'text-red-600' : 'text-slate-700'}`}>{formatValue(amount, isExpense)}</p>
    </div>
);


const ProfitLossReport: React.FC<{ selectedBusinessUnit: BusinessUnit }> = ({ selectedBusinessUnit }) => {
    const { addNotification } = useNotification();
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(today);
    const [reportData, setReportData] = useState<IncomeStatementData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateReport = async () => {
        if (!startDate || !endDate) {
            addNotification('Tanggal mulai dan tanggal akhir harus diisi.', 'error');
            return;
        }
        
        setIsLoading(true);
        setReportData(null);

        try {
            const params = new URLSearchParams({
                business_id: String(selectedBusinessUnit.id),
                start_date: startDate,
                end_date: endDate,
            });
            const response = await fetch(`${API_ENDPOINT}?${params.toString()}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Gagal memuat laporan');
            }
            
            if (result.code === 200 && result.data) {
                setReportData(result.data);
            } else {
                 throw new Error(result.message || 'Format data laporan tidak valid');
            }
        } catch (err: any) {
            addNotification(err.message, 'error');
            setReportData(null);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Laporan Perhitungan Hasil Usaha (PHU)</h2>
            
            {/* Filters */}
            <div className="p-4 bg-white rounded-lg shadow-md" id="report-filters">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label htmlFor="start_date" className="block text-sm font-medium text-slate-600">Tanggal Mulai</label>
                        <input
                            type="date"
                            id="start_date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="input w-full"
                        />
                    </div>
                     <div>
                        <label htmlFor="end_date" className="block text-sm font-medium text-slate-600">Tanggal Akhir</label>
                        <input
                            type="date"
                            id="end_date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate}
                            className="input w-full"
                        />
                    </div>
                    <button
                        onClick={handleGenerateReport}
                        disabled={isLoading}
                        className="btn-primary h-10"
                    >
                        {isLoading ? 'Memuat...' : 'Tampilkan Laporan'}
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={!reportData || isLoading}
                        className="btn-secondary h-10"
                    >
                        Cetak Laporan
                    </button>
                </div>
            </div>

            {/* Report Display */}
            <div className="bg-white rounded-lg shadow-md p-6" id="printable-report">
                {isLoading && (
                    <div className="text-center py-10 text-slate-500">
                        <p>Menghasilkan laporan...</p>
                    </div>
                )}

                {!isLoading && !reportData && (
                     <div className="text-center py-10 text-slate-500">
                        <p>Pilih periode tanggal dan klik "Tampilkan Laporan" untuk memulai.</p>
                    </div>
                )}
                
                {reportData && (
                    <div className="max-w-3xl mx-auto font-sans">
                        <div className="text-center mb-8">
                            <h3 className="text-xl font-bold text-slate-900">{selectedBusinessUnit.name}</h3>
                            <h4 className="text-lg font-semibold text-slate-800">{reportData.report_name}</h4>
                            <p className="text-sm text-slate-500">Periode {reportData.period.replace(' to ', ' s/d ')}</p>
                        </div>

                        <div className="space-y-4 text-sm">
                            {/* Pendapatan */}
                            <div className="space-y-1">
                                <h4 className="font-bold text-slate-800 py-1.5 border-b-2 border-slate-200">Pendapatan</h4>
                                {reportData.revenues.accounts.length > 0 ? (
                                    reportData.revenues.accounts.map((acc) => (
                                        <ReportRow key={acc.account_code} label={acc.account_name} amount={acc.total} />
                                    ))
                                ) : (
                                    <div className="flex justify-between py-1.5"><p className="text-slate-600 pl-8">Tidak ada pendapatan</p><p className="text-slate-700">Rp 0</p></div>
                                )}
                            </div>
                           
                            {/* Beban */}
                            <div className="space-y-1 pt-4">
                                <h4 className="font-bold text-slate-800 py-1.5 border-b-2 border-slate-200">Beban</h4>
                                {reportData.expenses.accounts.length > 0 ? (
                                     reportData.expenses.accounts.map((acc) => (
                                        <ReportRow key={acc.account_code} label={acc.account_name} amount={acc.total} isExpense />
                                    ))
                                ) : (
                                    <div className="flex justify-between py-1.5"><p className="text-slate-600 pl-8">Tidak ada beban</p><p className="text-slate-700">Rp 0</p></div>
                                )}
                                <div className="flex justify-between pt-2 border-t border-slate-300 mt-2">
                                    <p className="font-semibold text-slate-800 pl-8">Total Beban</p>
                                    <p className="font-semibold text-red-600">{formatValue(reportData.expenses.total, true)}</p>
                                </div>
                            </div>
                            
                            {/* PHU / Laba Bersih */}
                             <div className="bg-red-600 text-white p-3 rounded-md mt-6 flex justify-between items-center text-base">
                                <p className="font-bold">Sisa Hasil Usaha (SHU)</p>
                                <p className="font-bold text-lg">{formatShu(reportData.net_profit)}</p>
                             </div>
                        </div>
                    </div>
                )}
            </div>
             <style>{`.input { margin-top: 0.25rem; display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; } .btn-primary { padding: 0.5rem 1rem; background-color: #4f46e5; color: white; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; } .btn-primary:hover { background-color: #4338ca; } .btn-primary:disabled { background-color: #a5b4fc; cursor: not-allowed;} .btn-secondary { padding: 0.5rem 1rem; background-color: #e2e8f0; color: #1e2b3b; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; border: 1px solid #cbd5e1; } .btn-secondary:hover { background-color: #cbd5e1; } .btn-secondary:disabled { background-color: #f1f5f9; color: #94a3b8; cursor: not-allowed; } @media print { body * { visibility: hidden; } #printable-report, #printable-report * { visibility: visible; } #printable-report { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 1.5rem; box-shadow: none; border: none; } } `}</style>
        </div>
    );
};

export default ProfitLossReport;