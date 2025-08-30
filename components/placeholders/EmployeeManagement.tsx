import React from 'react';

const EmployeeManagement: React.FC = () => {
    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Manajemen Karyawan</h2>
            <p className="text-slate-600">
                Modul ini didedikasikan untuk pengelolaan data karyawan di setiap unit usaha dan outlet.
                Anda akan dapat mengelola informasi pribadi, posisi, jadwal kerja, dan data terkait lainnya.
            </p>
            <div className="mt-6 p-4 border-l-4 border-red-500 bg-red-50">
                <p className="font-semibold text-red-800">Fitur yang Direncanakan:</p>
                <ul className="list-disc list-inside text-red-700 mt-2">
                    <li>Daftar Karyawan per Outlet (CRUD)</li>
                    <li>Detail Informasi Karyawan</li>
                    {/* <li>Manajemen Posisi dan Jabatan</li> */}
                    <li>Pelacakan Absensi (Opsional)</li>
                </ul>
            </div>
        </div>
    );
};

export default EmployeeManagement;