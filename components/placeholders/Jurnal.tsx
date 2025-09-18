
import React from 'react';

const Jurnal: React.FC = () => {
    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Jurnal Umum</h2>
            <p className="text-slate-600">
                Halaman ini akan berisi fitur untuk mengelola entri jurnal umum keuangan.
                Anda akan dapat mencatat semua transaksi debit dan kredit yang terjadi.
            </p>
            <div className="mt-6 p-4 border-l-4 border-indigo-500 bg-indigo-50">
                <p className="font-semibold text-indigo-800">Fitur yang Direncanakan:</p>
                <ul className="list-disc list-inside text-indigo-700 mt-2">
                    <li>Input Jurnal (Debit/Kredit)</li>
                    <li>Daftar Entri Jurnal</li>
                    <li>Filter dan Pencarian Jurnal</li>
                    <li>Ekspor ke PDF/Excel</li>
                </ul>
            </div>
        </div>
    );
};

export default Jurnal;
