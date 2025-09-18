
import React from 'react';

const Pengajuan: React.FC = () => {
    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Pengajuan RAB</h2>
            <p className="text-slate-600">
                Fitur untuk pengajuan Rencana Anggaran Biaya (RAB) akan tersedia di sini.
                Anda dapat membuat, mengirim, dan melacak status pengajuan RAB untuk berbagai keperluan operasional.
            </p>
            <div className="mt-6 p-4 border-l-4 border-indigo-500 bg-indigo-50">
                <p className="font-semibold text-indigo-800">Fitur yang Direncanakan:</p>
                <ul className="list-disc list-inside text-indigo-700 mt-2">
                    <li>Formulir Pengajuan RAB</li>
                    <li>Alur Persetujuan (Approval Workflow)</li>
                    <li>Pelacakan Status Pengajuan</li>
                    <li>Riwayat Pengajuan</li>
                </ul>
            </div>
        </div>
    );
};

export default Pengajuan;
