
import React, { useState } from 'react';
import { BusinessUnit, BalanceSheetData } from '../types';
import { useNotification } from '../contexts/NotificationContext';

const API_ENDPOINT = 'https://api.majukoperasiku.my.id/manage/finance/reports/balance-sheet';

const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return 'Rp 0';
    return `Rp ${Number(amount).toLocaleString('id-ID')}`;
};

const ReportSection: React.FC<{ title: string; accounts: { account_name: string; total: number }[]; total: number }> = ({ title, accounts, total }) => (
    <div className="space-y-2">
        <h4 className="font-bold text-slate-800 text-lg py-2 border-b-2 border-slate-200">{title}</h4>
        <div className="space-y-1">
            {accounts.length > 0 ? (
                accounts.map((acc, index) => (
                    <div key={index} className="flex justify-between py-1.5">
                        <p className="text-slate-600">{acc.account_name}</p>
                        <p className="text-slate-700 font-medium">{formatCurrency(acc.total)}</p>
                    </div>
                ))
            ) : (
                <div className="flex justify-between py-1.5"><p className="text-slate-500 italic">Tidak ada data</p></div>
            )}
        </div>
        <div className="flex justify-between pt-2 border-t border-slate-300 mt-2 font-semibold">
            <p className="text-slate-800">Total {title}</p>
            <p className="text-slate-900">{formatCurrency(total)}</p>
        </div>
    </div>
);


const LaporanNeraca: React.FC<{ selectedBusinessUnit: BusinessUnit }> = ({ selectedBusinessUnit }) => {
    const { addNotification } = useNotification();
    const today = new Date().toISOString().split('T')[0];

    const [asOfDate, setAsOfDate] = useState(today);
    const [reportData, setReportData] = useState<BalanceSheetData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateReport = async () => {
        if (!asOfDate) {
            addNotification('Tanggal harus diisi.', 'error');
            return;
        }
        
        setIsLoading(true);
        setReportData(null);

        try {
            const params = new URLSearchParams({
                business_id: String(selectedBusinessUnit.id),
                end_date: asOfDate,
            });
            const response = await fetch(`${API_ENDPOINT}?${params.toString()}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Gagal memuat laporan neraca');
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

    const totalLiabilitiesAndEquity = reportData ? reportData.liabilities.total + reportData.equity.total : 0;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Laporan Posisi Keuangan (Neraca)</h2>
            
            {/* Filters */}
            <div className="p-4 bg-white rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="as_of_date" className="block text-sm font-medium text-slate-600">Per Tanggal</label>
                        <input
                            type="date"
                            id="as_of_date"
                            value={asOfDate}
                            onChange={(e) => setAsOfDate(e.target.value)}
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
                </div>
            </div>

            {/* Report Display */}
            <div className="bg-white rounded-lg shadow-md p-6">
                {isLoading && (
                    <div className="text-center py-10 text-slate-500">
                        <p>Menghasilkan laporan...</p>
                    </div>
                )}

                {!isLoading && !reportData && (
                     <div className="text-center py-10 text-slate-500">
                        <p>Pilih tanggal dan klik "Tampilkan Laporan" untuk memulai.</p>
                    </div>
                )}
                
                {reportData && (
                    <div className="font-sans text-sm">
                        <div className="text-center mb-8">
                            <h3 className="text-xl font-bold text-slate-900">{selectedBusinessUnit.name}</h3>
                            <h4 className="text-lg font-semibold text-slate-800">{reportData.report_name}</h4>
                            <p className="text-sm text-slate-500">Per tanggal {reportData.as_of_date}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            {/* Kolom Aset */}
                            <ReportSection title="Aset" accounts={reportData.assets.accounts} total={reportData.assets.total} />
                            
                            {/* Kolom Liabilitas & Ekuitas */}
                            <div className="space-y-6">
                                <ReportSection title="Liabilitas" accounts={reportData.liabilities.accounts} total={reportData.liabilities.total} />
                                <ReportSection title="Ekuitas" accounts={reportData.equity.accounts} total={reportData.equity.total} />
                                
                                <div className="flex justify-between pt-3 border-t-2 border-slate-900 mt-4 font-bold text-base">
                                    <p className="text-slate-800">Total Liabilitas dan Ekuitas</p>
                                    <p className="text-slate-900">{formatCurrency(totalLiabilitiesAndEquity)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Balance Check Footer */}
                        <div className="mt-10 pt-4 border-t border-dashed">
                            {reportData.check_balance === 0 ? (
                                <p className="text-center font-semibold text-green-600">NERACA SEIMBANG</p>
                            ) : (
                                <p className="text-center font-semibold text-red-600">NERACA TIDAK SEIMBANG (Selisih: {formatCurrency(reportData.check_balance)})</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
             <style>{`.input { margin-top: 0.25rem; display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; } .btn-primary { padding: 0.5rem 1rem; background-color: #4f46e5; color: white; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; } .btn-primary:hover { background-color: #4338ca; } .btn-primary:disabled { background-color: #a5b4fc; cursor: not-allowed;} `}</style>
        </div>
    );
};

export default LaporanNeraca;