import React from 'react';

const UserManagement: React.FC = () => {
    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Manajemen Akun Pengguna</h2>
            <p className="text-slate-600">
                Sebagai admin, Anda dapat mengelola akun pengguna yang memiliki akses ke sistem back-office ini.
                Anda akan dapat membuat pengguna baru, menetapkan peran, dan mengatur hak akses untuk setiap menu.
            </p>
             <p className="text-slate-800 font-medium mt-4">
                Ya, lakukan perubahannya
            </p>
            <div className="mt-6 p-4 border-l-4 border-red-500 bg-red-50">
                <p className="font-semibold text-red-800">Fitur yang Direncanakan:</p>
                <ul className="list-disc list-inside text-red-700 mt-2">
                    <li>Daftar Pengguna Sistem (CRUD)</li>
                    <li>Manajemen Peran (Admin, Manajer, Staf)</li>
                    <li>Pengaturan Hak Akses per Peran (Role-Based Access Control)</li>
                    <li>Fitur Reset Password</li>
                </ul>
            </div>
        </div>
    );
};

export default UserManagement;