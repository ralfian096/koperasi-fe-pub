
import React, { useState } from 'react';
import { BusinessUnit, EquityChangeData } from '../types';
import { useNotification } from '../contexts/NotificationContext';

const API_BASE_URL = 'https://api.majukoperasiku.my.id/manage/finance/reports';

const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return 'Rp 0';
    const num = Number(amount);
     if (num < 0) {
        return `(Rp ${Math.abs(num).toLocaleString('id-ID')})`;
    }
    return `Rp ${num.toLocaleString('id-ID')}`;
};

const ReportRow: React.FC<{ label: string; amount: number; isSub?: boolean, isNegative?: boolean, isTotal?: boolean }> = ({ label, amount, isSub = false, isNegative = false, isTotal = false }) => (
    <div className={`flex justify-between py-2 ${isTotal ? 'font-bold border-t border-slate-300 pt-3 mt-1' : ''}`}>
        <p className={`${isSub ? 'pl-4' : ''} ${isTotal ? 'text-slate-800' : 'text-slate-600'}`}>{label}</p>
        <p className={`${isNegative ? 'text-red-600' : 'text-slate-700'} ${isTotal ? 'font-bold text-slate-900' : 'font-medium'}`}>{formatCurrency(amount)}</p>
    </div>
);


interface EquityChangeReportProps {
    selectedBusinessUnit?: BusinessUnit;
}

const EquityChangeReport: React.FC<EquityChangeReportProps> = ({ selectedBusinessUnit }) => {
    const { addNotification } = useNotification();
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(today);
    const [reportData, setReportData] = useState<EquityChangeData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const isConsolidated = !selectedBusinessUnit;
    const pageTitle = isConsolidated ? "Laporan Perubahan Modal Konsolidasi" : "Laporan Perubahan Modal";
    const reportTitle = isConsolidated ? "Konsolidasi Semua Unit Usaha" : selectedBusinessUnit?.name;

    const handleGenerateReport = async () => {
        if (!startDate || !endDate) {
            addNotification('Tanggal mulai dan tanggal akhir harus diisi.', 'error');
            return;
        }
        
        setIsLoading(true);
        setReportData(null);

        try {
            const params = new URLSearchParams({
                start_date: startDate,
                end_date: endDate,
            });
            if (!isConsolidated) {
                params.append('business_id', String(selectedBusinessUnit.id));
            }

            const endpoint = isConsolidated
                ? `${API_BASE_URL}/consolidated/equity-change`
                : `${API_BASE_URL}/equity-change`;

            const response = await fetch(`${endpoint}?${params.toString()}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Gagal memuat laporan perubahan modal');
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
            <h2 className="text-3xl font-bold text-slate-800">{pageTitle}</h2>
            
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
                    <div className="max-w-2xl mx-auto font-sans text-sm">
                        <div className="text-center mb-8">
                            <h3 className="text-xl font-bold text-slate-900">{reportTitle}</h3>
                            <h4 className="text-lg font-semibold text-slate-800">{reportData.report_name}</h4>
                            <p className="text-sm text-slate-500">Untuk Periode yang Berakhir pada {reportData.period.split('to')[1].trim()}</p>
                        </div>

                        <div className="space-y-1">
                            <ReportRow label={`Modal Awal Periode`} amount={reportData.beginning_equity} />
                            <ReportRow label="Laba Periode Berjalan" amount={reportData.profit_for_period} isSub />
                            <ReportRow label="Setoran Modal" amount={reportData.capital_injections} isSub />
                            <ReportRow label="Penarikan Modal" amount={reportData.capital_withdrawals} isSub isNegative/>
                            <ReportRow 
                                label={`Modal Akhir Periode`} 
                                amount={reportData.ending_equity} 
                                isTotal
                            />
                        </div>
                    </div>
                )}
            </div>
            <style>{`.input { margin-top: 0.25rem; display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; } .btn-primary { padding: 0.5rem 1rem; background-color: #4f46e5; color: white; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; } .btn-primary:hover { background-color: #4338ca; } .btn-primary:disabled { background-color: #a5b4fc; cursor: not-allowed;} `}</style>
        </div>
    );
};

export default EquityChangeReport;
