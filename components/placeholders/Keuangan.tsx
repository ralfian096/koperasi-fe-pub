

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { SubView } from '../../App';
import { JournalEntry, IncomeStatementData, BalanceSheetData, FinancialRatioData, FinancialRatioDetail, BalanceSheetSection } from '../../types';

const API_BASE_URL = 'https://api.majukoperasiku.my.id/manage';
const API_FINANCE_URL = `${API_BASE_URL}/finance`;

// --- Helper Functions & Components ---
const formatCurrency = (amount: number | undefined | null, options?: Intl.NumberFormatOptions) => {
    if (amount === undefined || amount === null) return 'Rp 0';
    return `Rp ${Number(amount).toLocaleString('id-ID', { maximumFractionDigits: 0, ...options })}`;
};

const formatValue = (amount: number | undefined, isExpense: boolean = false) => {
    if (amount === undefined || amount === null) return 'Rp 0';
    const num = parseFloat(String(amount));
    if (isExpense) {
        return num > 0 ? `(Rp ${num.toLocaleString('id-ID')})` : 'Rp 0';
    }
    if (num < 0) {
        return `(Rp ${Math.abs(num).toLocaleString('id-ID')})`;
    }
    return `Rp ${num.toLocaleString('id-ID')}`;
};

const formatNumber = (amount: string | number) => parseFloat(String(amount)).toLocaleString('id-ID');

const ReportHeader: React.FC<{ title: string, subtitle?: string, period?: string | { start: string, end: string } | { as_of: string } }> = ({ title, subtitle, period }) => (
    <div className="text-center mb-8">
        {subtitle && <h3 className="text-xl font-bold text-slate-900">{subtitle}</h3>}
        <h4 className="text-lg font-semibold text-slate-800">{title}</h4>
        {period && <p className="text-sm text-slate-500">
            {typeof period === 'string' 
                ? period
                : 'as_of' in period
                ? `Per tanggal ${new Date(period.as_of).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`
                : `Periode ${new Date(period.start).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} s/d ${new Date(period.end).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`
            }
        </p>}
    </div>
);

// --- Sub-components for each report ---

// 1. Jurnal Umum
const JurnalUmum: React.FC = () => {
    const { addNotification } = useNotification();
    const [journals, setJournals] = useState<JournalEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const handleFetchJournals = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            
            const response = await fetch(`${API_FINANCE_URL}/consolidated/journal-entries?${params.toString()}`);
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.message || 'Gagal memuat jurnal umum');
            }
            const result = await response.json();
            
            if (result.code === 200 && result.data?.data) {
                const mappedJournals = result.data.data.map((journal: any): JournalEntry => ({
                    ...journal,
                    date: journal.entry_date,
                    total_debit: journal.details.reduce((sum: number, d: any) => sum + (d.entry_type === 'DEBIT' ? parseFloat(d.amount) : 0), 0).toString(),
                    total_credit: journal.details.reduce((sum: number, d: any) => sum + (d.entry_type === 'CREDIT' ? parseFloat(d.amount) : 0), 0).toString(),
                }));
                setJournals(mappedJournals);
            } else {
                setJournals([]);
            }
        } catch (err: any) {
            addNotification(err.message, 'error');
            setJournals([]);
        } finally {
            setIsLoading(false);
        }
    }, [addNotification, startDate, endDate]);

    return (
        <div className="space-y-6">
            <h3 className="text-3xl font-bold text-slate-800">Jurnal Umum Konsolidasi</h3>
            <div className="p-4 bg-white rounded-lg shadow-md space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-slate-600">Tanggal Mulai</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input w-full" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-600">Tanggal Akhir</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} className="input w-full" />
                    </div>
                    <button onClick={handleFetchJournals} disabled={isLoading} className="btn-primary h-10">{isLoading ? 'Memuat...' : 'Tampilkan Jurnal'}</button>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                     <table className="min-w-full">
                        <thead className="bg-slate-50">
                            <tr className="border-b border-slate-300">
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tanggal & Deskripsi</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider w-48">Debit (IDR)</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider w-48">Kredit (IDR)</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {isLoading ? (
                                <tr><td colSpan={3} className="text-center py-10 text-slate-500">Memuat data...</td></tr>
                            ) : journals.length > 0 ? (
                                journals.map((journal) => (
                                    <React.Fragment key={journal.id}>
                                        <tr className="border-t-4 border-slate-100 border-b border-slate-200">
                                            <td className="px-6 py-3 align-top" colSpan={3}>
                                                <div className="font-semibold text-slate-800">{new Date(journal.entry_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                                <div className="text-sm text-slate-600">{journal.description}</div>
                                                <div className="text-xs font-medium text-indigo-600 mt-1">{journal.business?.name || 'Konsolidasi'}</div>
                                            </td>
                                        </tr>
                                        {journal.details.map((detail: any) => (
                                            <tr key={detail.id}>
                                                <td className="pl-12 pr-6 py-2 text-sm text-slate-600">{detail.account_chart.account_name}</td>
                                                <td className="px-6 py-2 text-sm text-slate-700 text-right">{detail.entry_type === 'DEBIT' ? formatNumber(detail.amount) : '-'}</td>
                                                <td className="px-6 py-2 text-sm text-slate-700 text-right">{detail.entry_type === 'CREDIT' ? formatNumber(detail.amount) : '-'}</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))
                            ) : (
                                <tr><td colSpan={3} className="text-center py-10 text-slate-500">Tidak ada entri jurnal ditemukan untuk periode ini.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// 2. Laporan PHU
const LaporanPHU: React.FC = () => {
    const { addNotification } = useNotification();
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(today);
    const [reportData, setReportData] = useState<IncomeStatementData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateReport = useCallback(async () => {
        setIsLoading(true); setReportData(null);
        try {
            const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
            const response = await fetch(`${API_FINANCE_URL}/reports/consolidated/income-statement?${params.toString()}`);
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Gagal memuat laporan');
            setReportData(result.data);
        } catch (err: any) { addNotification(err.message, 'error'); } finally { setIsLoading(false); }
    }, [startDate, endDate, addNotification]);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Laporan PHU Konsolidasi</h2>
            <div className="p-4 bg-white rounded-lg shadow-md">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div><label className="block text-sm font-medium text-slate-600">Tanggal Mulai</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input w-full"/></div>
                    <div><label className="block text-sm font-medium text-slate-600">Tanggal Akhir</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} className="input w-full"/></div>
                    <button onClick={handleGenerateReport} disabled={isLoading} className="btn-primary h-10">{isLoading ? 'Memuat...' : 'Tampilkan Laporan'}</button>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
                {isLoading && <div className="text-center py-10 text-slate-500">Memuat laporan...</div>}
                {!isLoading && !reportData && <div className="text-center py-10 text-slate-500">Pilih periode dan tampilkan laporan.</div>}
                {reportData && (
                    <div className="max-w-3xl mx-auto font-sans">
                        <ReportHeader title={reportData.report_name} subtitle="Konsolidasi Semua Unit Usaha" period={{start: startDate, end: endDate}} />
                        <div className="space-y-4 text-sm">
                            <div className="space-y-1"><h4 className="font-bold text-slate-800 py-1.5 border-b-2 border-slate-200">Pendapatan</h4>
                                {reportData.revenues.accounts.map(acc => (<div key={acc.account_code} className="flex justify-between py-1.5"><p className="text-slate-600 pl-8">{acc.account_name}</p><p>{formatValue(acc.total)}</p></div>))}
                            </div>
                            <div className="space-y-1 pt-4"><h4 className="font-bold text-slate-800 py-1.5 border-b-2 border-slate-200">Beban</h4>
                                {reportData.expenses.accounts.map(acc => (<div key={acc.account_code} className="flex justify-between py-1.5"><p className="text-slate-600 pl-8">{acc.account_name}</p><p className="text-red-600">{formatValue(acc.total, true)}</p></div>))}
                                <div className="flex justify-between pt-2 border-t border-slate-300 mt-2"><p className="font-semibold text-slate-800 pl-8">Total Beban</p><p className="font-semibold text-red-600">{formatValue(reportData.expenses.total, true)}</p></div>
                            </div>
                             <div className="bg-indigo-600 text-white p-3 rounded-md mt-6 flex justify-between items-center text-base">
                                <p className="font-bold">Sisa Hasil Usaha (SHU)</p><p className="font-bold text-lg">{formatCurrency(reportData.net_profit)}</p>
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// 3. Laporan Neraca
const LaporanNeraca: React.FC = () => {
    const { addNotification } = useNotification();
    const today = new Date().toISOString().split('T')[0];
    const [asOfDate, setAsOfDate] = useState(today);
    const [reportData, setReportData] = useState<BalanceSheetData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateReport = useCallback(async () => {
        setIsLoading(true); setReportData(null);
        try {
            const params = new URLSearchParams({ end_date: asOfDate });
            const response = await fetch(`${API_FINANCE_URL}/reports/consolidated/balance-sheet?${params.toString()}`);
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Gagal memuat laporan');
            setReportData(result.data);
        } catch (err: any) { addNotification(err.message, 'error'); } finally { setIsLoading(false); }
    }, [asOfDate, addNotification]);
    
    const ReportSection: React.FC<{ title: string; accounts: BalanceSheetSection['accounts']; total: number }> = ({ title, accounts, total }) => (
        <div className="space-y-2">
            <h4 className="font-bold text-slate-800 text-lg py-2 border-b-2 border-slate-200">{title}</h4>
            {accounts.map((acc, index) => (<div key={index} className="flex justify-between py-1.5"><p className="text-slate-600">{acc.account_name}</p><p className="text-slate-700 font-medium">{formatCurrency(acc.total)}</p></div>))}
            <div className="flex justify-between pt-2 border-t border-slate-300 mt-2 font-semibold"><p className="text-slate-800">Total {title}</p><p className="text-slate-900">{formatCurrency(total)}</p></div>
        </div>
    );
    
    const totalLiabilitiesAndEquity = reportData ? reportData.liabilities.total + reportData.equity.total : 0;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Laporan Neraca Konsolidasi</h2>
            <div className="p-4 bg-white rounded-lg shadow-md">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div><label className="block text-sm font-medium text-slate-600">Per Tanggal</label><input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="input w-full"/></div>
                    <button onClick={handleGenerateReport} disabled={isLoading} className="btn-primary h-10">{isLoading ? 'Memuat...' : 'Tampilkan Laporan'}</button>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
                 {isLoading && <div className="text-center py-10 text-slate-500">Memuat laporan...</div>}
                {!isLoading && !reportData && <div className="text-center py-10 text-slate-500">Pilih tanggal dan tampilkan laporan.</div>}
                {reportData && (
                    <div className="font-sans text-sm">
                        <ReportHeader title={reportData.report_name} subtitle="Konsolidasi Semua Unit Usaha" period={{as_of: reportData.as_of_date}} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <ReportSection title="Aset" accounts={reportData.assets.accounts} total={reportData.assets.total} />
                            <div className="space-y-6">
                                <ReportSection title="Liabilitas" accounts={reportData.liabilities.accounts} total={reportData.liabilities.total} />
                                <ReportSection title="Ekuitas" accounts={reportData.equity.accounts} total={reportData.equity.total} />
                                <div className="flex justify-between pt-3 border-t-2 border-slate-900 mt-4 font-bold text-base"><p className="text-slate-800">Total Liabilitas dan Ekuitas</p><p className="text-slate-900">{formatCurrency(totalLiabilitiesAndEquity)}</p></div>
                            </div>
                        </div>
                        <div className="mt-10 pt-4 border-t border-dashed">
                            {reportData.check_balance === 0 ? <p className="text-center font-semibold text-green-600">NERACA SEIMBANG</p> : <p className="text-center font-semibold text-red-600">NERACA TIDAK SEIMBANG (Selisih: {formatCurrency(reportData.check_balance)})</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// 4. Rasio Keuangan
const RasioKeuangan: React.FC = () => {
    const { addNotification } = useNotification();
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(today);
    const [reportData, setReportData] = useState<FinancialRatioData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateReport = useCallback(async () => {
        setIsLoading(true); setReportData(null);
        try {
            const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
            const response = await fetch(`${API_FINANCE_URL}/reports/consolidated/financial-ratio?${params.toString()}`);
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Gagal memuat laporan');
            setReportData(result.data);
        } catch (err: any) { addNotification(err.message, 'error'); } finally { setIsLoading(false); }
    }, [startDate, endDate, addNotification]);
    
    const processedRatios = useMemo(() => {
        if (!reportData) return [];
        return Object.values(reportData).filter((v): v is FinancialRatioDetail => typeof v === 'object' && v !== null && 'name' in v && 'formula' in v);
    }, [reportData]);

    const RatioCard: React.FC<{ ratio: FinancialRatioDetail }> = ({ ratio }) => {
        const isPercentage = ratio.formula.includes('%');
        const displayValue = `${ratio.value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${isPercentage ? '%' : ''}`;
        return (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col">
                <div className="flex justify-between items-start">
                    <h5 className="font-semibold text-slate-700 max-w-[70%]">{ratio.name}</h5><p className="text-2xl font-bold text-indigo-600">{displayValue}</p>
                </div>
                <p className="text-sm text-slate-500 mt-2 flex-grow">{ratio.interpretation}</p>
                <details className="mt-3 text-xs"><summary className="cursor-pointer text-slate-500 hover:text-slate-700">Lihat Detail</summary>
                    <div className="mt-2 p-3 bg-white rounded border">
                        <p className="font-semibold">Formula:</p><p className="font-mono text-slate-600">{ratio.formula}</p>
                        <p className="font-semibold mt-2">Komponen:</p>
                        <ul className="list-disc list-inside text-slate-600">
                            {/* FIX: Cast value to Number to resolve TypeScript error where it was inferred as `unknown`. */}
                            {Object.entries(ratio.components).map(([key, value]) => (<li key={key}>{key.replace(/_/g, ' ')}: {formatCurrency(Number(value))}</li>))}
                        </ul>
                    </div>
                </details>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Rasio Keuangan Konsolidasi</h2>
            <div className="p-4 bg-white rounded-lg shadow-md">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div><label className="block text-sm font-medium text-slate-600">Tanggal Mulai</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input w-full"/></div>
                    <div><label className="block text-sm font-medium text-slate-600">Tanggal Akhir</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} className="input w-full"/></div>
                    <button onClick={handleGenerateReport} disabled={isLoading} className="btn-primary h-10 md:col-span-2">{isLoading ? 'Menganalisis...' : 'Tampilkan Analisis'}</button>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
                {isLoading && <div className="text-center py-10 text-slate-500">Menganalisis data...</div>}
                {!isLoading && !reportData && <div className="text-center py-10 text-slate-500">Pilih periode dan tampilkan analisis.</div>}
                {reportData && (
                    <div className="font-sans text-sm space-y-8">
                        <ReportHeader title={reportData.report_name} subtitle="Konsolidasi Semua Unit Usaha" period={{start: startDate, end: endDate}} />
                        {processedRatios.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {processedRatios.map(ratio => <RatioCard key={ratio.name} ratio={ratio} />)}
                            </div>
                        ) : ( <div className="text-center py-10 text-slate-500">Tidak ada data rasio untuk periode ini.</div> )}
                    </div>
                )}
            </div>
        </div>
    );
};


// --- Main Keuangan Component (Router) ---
const Keuangan: React.FC<{ subView: SubView | null }> = ({ subView }) => {
    const renderContent = () => {
        switch (subView) {
            case 'jurnal-umum': return <JurnalUmum />;
            case 'laporan-phu': return <LaporanPHU />;
            case 'laporan-neraca': return <LaporanNeraca />;
            case 'rasio-keuangan': return <RasioKeuangan />;
            default: return <JurnalUmum />; // Default to Jurnal
        }
    };
    return (
        <div className="space-y-8">
            {renderContent()}
            <style>{`.input { margin-top: 0.25rem; display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; } .btn-primary { padding: 0.5rem 1rem; background-color: #4f46e5; color: white; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; } .btn-primary:hover { background-color: #4338ca; } .btn-primary:disabled { background-color: #a5b4fc; cursor: not-allowed;} `}</style>
        </div>
    );
};

export default Keuangan;