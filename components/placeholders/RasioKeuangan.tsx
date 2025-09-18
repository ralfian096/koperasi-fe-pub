
import React from 'react';

const RasioKeuangan: React.FC = () => {
    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Analisis Rasio Keuangan</h2>
            <p className="text-slate-600">
                Modul ini akan menyediakan alat untuk menganalisis kesehatan keuangan usaha melalui berbagai rasio penting.
            </p>
            <div className="mt-6 p-4 border-l-4 border-indigo-500 bg-indigo-50">
                <p className="font-semibold text-indigo-800">Fitur yang Direncanakan:</p>
                <ul className="list-disc list-inside text-indigo-700 mt-2">
                    <li>Rasio Likuiditas (e.g., Current Ratio)</li>
                    <li>Rasio Profitabilitas (e.g., Gross Profit Margin)</li>
                    <li>Rasio Solvabilitas (e.g., Debt to Equity Ratio)</li>
                    <li>Visualisasi data dalam bentuk grafik</li>
                </ul>
            </div>
        </div>
    );
};

export default RasioKeuangan;
