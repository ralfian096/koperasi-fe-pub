
import React from 'react';

const LaporanNeraca: React.FC = () => {
    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Laporan Neraca</h2>
            <p className="text-slate-600">
                Fitur untuk melihat laporan neraca keuangan (balance sheet) akan tersedia di sini.
                Laporan ini akan menampilkan ringkasan aset, kewajiban, dan ekuitas perusahaan pada periode tertentu.
            </p>
            <div className="mt-6 p-4 border-l-4 border-primary-500 bg-primary-50">
                <p className="font-semibold text-primary-800">Fitur yang Direncanakan:</p>
                <ul className="list-disc list-inside text-primary-700 mt-2">
                    <li>Tampilan Aset (Lancar & Tetap)</li>
                    <li>Tampilan Kewajiban dan Ekuitas</li>
                    <li>Filter Berdasarkan Periode</li>
                    <li>Cetak Laporan</li>
                </ul>
            </div>
        </div>
    );
};

export default LaporanNeraca;
