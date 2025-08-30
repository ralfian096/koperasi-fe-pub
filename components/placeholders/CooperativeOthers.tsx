import React from 'react';

const CooperativeOthers: React.FC = () => {
    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Fitur Koperasi Lainnya</h2>
            <p className="text-slate-600">
                Halaman ini akan berisi fitur untuk mengelola semua aspek keanggotaan koperasi.
                Anda akan dapat menambah, mengubah, dan melihat data anggota, serta mencatat dan melacak
                simpanan (pokok, wajib, sukarela) dan pinjaman anggota.
            </p>
            <div className="mt-6 p-4 border-l-4 border-red-500 bg-red-50">
                <p className="font-semibold text-red-800">Fitur yang Direncanakan:</p>
                <ul className="list-disc list-inside text-red-700 mt-2">
                    <li>Manajemen Simpanan Anggota (Pokok, Wajib, Sukarela)</li>
                    <li>Manajemen Pinjaman Anggota</li>
                    <li>Laporan Keuangan Koperasi</li>
                    <li>Pengaturan Sisa Hasil Usaha (SHU)</li>
                </ul>
            </div>
        </div>
    );
};

export default CooperativeOthers;