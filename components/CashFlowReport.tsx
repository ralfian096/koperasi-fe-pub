
import React, { useState } from 'react';
import { BusinessUnit, CashFlowData, CashFlowSection } from '../types';
import { useNotification } from '../contexts/NotificationContext';

const API_ENDPOINT = 'https://api.majukoperasiku.my.id/manage/finance/reports/cash-flow';

const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return 'Rp 0';
    const num = Number(amount);
    if (num < 0) {
        return `(Rp ${Math.abs(num).toLocaleString('id-ID')})`;
    }
    return `Rp ${num.toLocaleString('id-ID')}`;
};

const ReportSection: React.FC<{ title: string; section: CashFlowSection; isNegative?: boolean }> = ({ title, section, isNegative = false }) => (
    <div className="space-y-1">
        <h4 className="font-bold text-slate-800 py-1.5 border-b-2 border-slate-200">{title}</h4>
        {section.accounts.length > 0 ? (
            section.accounts.map((acc, index) => (
                <div key={index} className="flex justify-between py-1.5">
                    <p className="text-slate-600 pl-4">{acc.account_name}</p>
                    <p className="text-slate-700">{formatCurrency(acc.total)}</p>
                </div>
            ))
        ) : (
            <div className="flex justify-between py-1.5"><p className="text-slate-500 pl-4 italic">Tidak ada data</p></div>
        )}
        <div className="flex justify-between pt-2 border-t border-slate-300 mt-2 font-semibold">
            <p className="text-slate-800 pl-4">Total Arus Kas dari {title}</p>
            <p className={`${isNegative && section.total > 0 ? 'text-red-600' : 'text-slate-900'}`}>{formatCurrency(section.total)}</p>
        </div>
    </div>
);


const CashFlowReport: React.FC<{ selectedBusinessUnit: BusinessUnit }> = ({ selectedBusinessUnit }) => {
    const { addNotification } = useNotification();
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(today);
    const [reportData, setReportData] = useState<CashFlowData | null>(null);
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
                throw new Error(result.message || 'Gagal memuat laporan arus kas');
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
    
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Laporan Arus Kas</h2>
            
            <div className="p-4 bg-white rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="start_date" className="block text-sm font-medium text-slate-600">Tanggal Mulai</label>
                        <input type="date" id="start_date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input w-full"/>
                    </div>
                     <div>
                        <label htmlFor="end_date" className="block text-sm font-medium text-slate-600">Tanggal Akhir</label>
                        <input type="date" id="end_date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} className="input w-full"/>
                    </div>
                    <button onClick={handleGenerateReport} disabled={isLoading} className="btn-primary h-10">
                        {isLoading ? 'Memuat...' : 'Tampilkan Laporan'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                {isLoading && <div className="text-center py-10 text-slate-500">Menghasilkan laporan...</div>}
                {!isLoading && !reportData && <div className="text-center py-10 text-slate-500">Pilih periode dan tampilkan laporan.</div>}
                
                {reportData && (
                    <div className="max-w-3xl mx-auto font-sans text-sm">
                        <div className="text-center mb-8">
                            <h3 className="text-xl font-bold text-slate-900">{selectedBusinessUnit.name}</h3>
                            <h4 className="text-lg font-semibold text-slate-800">{reportData.report_name}</h4>
                            <p className="text-sm text-slate-500">Untuk Periode yang Berakhir pada {reportData.period.split('to')[1].trim()}</p>
                        </div>

                        <div className="space-y-6">
                            <ReportSection title="Aktivitas Operasi" section={reportData.operating_activities} />
                            <ReportSection title="Aktivitas Investasi" section={reportData.investing_activities} isNegative />
                            <ReportSection title="Aktivitas Pendanaan" section={reportData.financing_activities} />
                            
                            <div className="pt-4 mt-4 border-t-2 border-slate-400 space-y-2">
                                <div className="flex justify-between font-semibold">
                                    <p>Kenaikan (Penurunan) Bersih Kas</p>
                                    <p className={reportData.net_cash_flow < 0 ? 'text-red-600' : ''}>{formatCurrency(reportData.net_cash_flow)}</p>
                                </div>
                                 <div className="flex justify-between">
                                    <p>Kas pada Awal Periode</p>
                                    <p>{formatCurrency(reportData.beginning_cash_balance)}</p>
                                </div>
                                <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-300">
                                    <p>Kas pada Akhir Periode</p>
                                    <p>{formatCurrency(reportData.ending_cash_balance)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <style>{`.input { margin-top: 0.25rem; display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; } .btn-primary { padding: 0.5rem 1rem; background-color: #4f46e5; color: white; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; } .btn-primary:hover { background-color: #4338ca; } .btn-primary:disabled { background-color: #a5b4fc; cursor: not-allowed;} `}</style>
        </div>
    );
};

export default CashFlowReport;
