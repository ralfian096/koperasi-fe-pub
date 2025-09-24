
import React from 'react';

const UnitManagement: React.FC = () => {
    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Manajemen Unit Satuan</h2>
            <p className="text-slate-600">
                Modul ini berfungsi untuk mengelola unit-unit satuan yang digunakan dalam produk, baik untuk barang (e.g., Pcs, Box, Kg) maupun sewa (e.g., Jam, Hari, Bulan).
            </p>
            <div className="mt-6 p-4 border-l-4 border-indigo-500 bg-indigo-50">
                <p className="font-semibold text-indigo-800">Fitur yang Direncanakan:</p>
                <ul className="list-disc list-inside text-indigo-700 mt-2">
                    <li>Daftar Unit Satuan (CRUD)</li>
                    <li>Pengelompokan unit berdasarkan tipe (Waktu, Berat, Jumlah)</li>
                    <li>Konversi antar satuan (jika diperlukan)</li>
                </ul>
            </div>
        </div>
    );
};

export default UnitManagement;
