

import React, { useState } from 'react';
import { BusinessUnit, FinancialRatioData, FinancialRatioDetail } from '../types';
import { useNotification } from '../contexts/NotificationContext';

const API_ENDPOINT = 'https://api.majukoperasiku.my.id/manage/finance/reports/financial-ratio';

// Component to display a single, detailed ratio
const RatioCard: React.FC<{ ratio: FinancialRatioDetail }> = ({ ratio }) => {
    const isPercentage = ratio.formula.includes('%');
    const displayValue = `${ratio.value.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${isPercentage ? '%' : ''}`;

    return (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col">
            <div className="flex justify-between items-start">
                <h5 className="font-semibold text-slate-700 max-w-[70%]">{ratio.name}</h5>
                <p className="text-2xl font-bold text-indigo-600">{displayValue}</p>
            </div>
            <p className="text-sm text-slate-500 mt-2 flex-grow">{ratio.interpretation}</p>
            <details className="mt-3 text-xs">
                <summary className="cursor-pointer text-slate-500 hover:text-slate-700">Lihat Detail Perhitungan</summary>
                <div className="mt-2 p-3 bg-white rounded border">
                    <p className="font-semibold">Formula:</p>
                    <p className="font-mono text-slate-600">{ratio.formula}</p>
                    <p className="font-semibold mt-2">Komponen:</p>
                    <ul className="list-disc list-inside text-slate-600">
                        {Object.entries(ratio.components).map(([key, value]) => (
                            // FIX: Replaced `toLocaleString` with `Intl.NumberFormat` to avoid type errors with older TypeScript lib versions.
                            // FIX: Cast value to Number to resolve TypeScript error where it was inferred as `unknown`.
                            <li key={key}>{key.replace(/_/g, ' ')}: {`Rp ${new Intl.NumberFormat('id-ID').format(Number(value))}`}</li>
                        ))}
                    </ul>
                </div>
            </details>
        </div>
    );
};


const RasioKeuangan: React.FC<{ selectedBusinessUnit: BusinessUnit }> = ({ selectedBusinessUnit }) => {
    const { addNotification } = useNotification();
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(today);
    const [reportData, setReportData] = useState<FinancialRatioData | null>(null);
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
                throw new Error(result.message || 'Gagal memuat laporan rasio keuangan');
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

    const processedRatios = React.useMemo(() => {
        if (!reportData) return [];
        // Filter out metadata and extract only the ratio objects
        return Object.values(reportData).filter(
            (value): value is FinancialRatioDetail => 
                typeof value === 'object' && value !== null && 'name' in value && 'formula' in value
        );
    }, [reportData]);


    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Analisis Rasio Keuangan</h2>
            
            {/* Filters */}
            <div className="p-4 bg-white rounded-lg shadow-md">
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
                    <div className="md:col-span-2">
                        <button
                            onClick={handleGenerateReport}
                            disabled={isLoading}
                            className="btn-primary h-10 w-full"
                        >
                            {isLoading ? 'Menganalisis...' : 'Tampilkan Analisis'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Display */}
            <div className="bg-white rounded-lg shadow-md p-6">
                {isLoading && (
                    <div className="text-center py-10 text-slate-500">
                        <p>Menghitung rasio keuangan...</p>
                    </div>
                )}

                {!isLoading && !reportData && (
                     <div className="text-center py-10 text-slate-500">
                        <p>Pilih periode tanggal dan klik "Tampilkan Analisis" untuk memulai.</p>
                    </div>
                )}
                
                {reportData && (
                    <div className="font-sans text-sm space-y-8">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-slate-900">{selectedBusinessUnit.name}</h3>
                            <h4 className="text-lg font-semibold text-slate-800">{reportData.report_name}</h4>
                            <p className="text-sm text-slate-500">Periode {reportData.period.replace(' to ', ' s/d ')}</p>
                        </div>
                        
                        {processedRatios.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {processedRatios.map(ratio => <RatioCard key={ratio.name} ratio={ratio} />)}
                            </div>
                        ) : (
                             <div className="text-center py-10 text-slate-500">
                                <p>Tidak ada data rasio yang dapat dihitung untuk periode ini.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
             <style>{`.input { margin-top: 0.25rem; display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; } .btn-primary { padding: 0.5rem 1rem; background-color: #4f46e5; color: white; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; } .btn-primary:hover { background-color: #4338ca; } .btn-primary:disabled { background-color: #a5b4fc; cursor: not-allowed;} `}</style>
        </div>
    );
};

export default RasioKeuangan;