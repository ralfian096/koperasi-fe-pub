
import React from 'react';

const Keuangan: React.FC = () => {
    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Manajemen Keuangan</h2>
            <p className="text-slate-600">
                Modul ini akan menjadi pusat pengelolaan keuangan, termasuk pembuatan jurnal,
                laporan sisa hasil usaha (SHU), neraca, dan analisis rasio keuangan.
            </p>
            <div className="mt-6 p-4 border-l-4 border-indigo-500 bg-indigo-50">
                <p className="font-semibold text-indigo-800">Fitur yang Direncanakan:</p>
                <ul className="list-disc list-inside text-indigo-700 mt-2">
                    <li>Pembuatan Jurnal Umum</li>
                    <li>Laporan Sisa Hasil Usaha (SHU)</li>
                    <li>Laporan Neraca Keuangan</li>
                    <li>Analisis Rasio Keuangan</li>
                </ul>
            </div>
        </div>
    );
};

export default Keuangan;
