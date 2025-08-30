import React, { useState, useMemo, useEffect } from 'react';
import usePosData from '../../hooks/usePosData';
import { OperationalCost } from '../../types';
import { EditIcon, TrashIcon, PlusIcon } from '../icons/Icons';

// Modal Component
const CostModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (cost: Omit<OperationalCost, 'id' | 'outletId'> | OperationalCost) => void;
  cost: OperationalCost | null;
}> = ({ isOpen, onClose, onSave, cost }) => {
  const { operationalCostCategories } = usePosData();
  const [formData, setFormData] = useState({
    description: '',
    categoryId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  });

  useEffect(() => {
    if (isOpen) {
      if (cost) {
        setFormData({
          description: cost.description,
          categoryId: cost.categoryId,
          amount: cost.amount,
          date: new Date(cost.date).toISOString().split('T')[0],
        });
      } else {
        setFormData({
          description: '',
          categoryId: operationalCostCategories[0]?.id || '',
          amount: 0,
          date: new Date().toISOString().split('T')[0],
        });
      }
    }
  }, [cost, isOpen, operationalCostCategories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const costData = {
        ...formData,
        amount: Number(formData.amount),
        date: new Date(formData.date),
    };

    if (cost) {
      onSave({ ...cost, ...costData });
    } else {
      onSave(costData as Omit<OperationalCost, 'id' | 'outletId'>);
    }
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">{cost ? 'Ubah Biaya' : 'Tambah Biaya Baru'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-600">Deskripsi</label>
            <input type="text" name="description" id="description" value={formData.description} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"/>
          </div>
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-slate-600">Kategori Biaya</label>
            <select name="categoryId" id="categoryId" value={formData.categoryId} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500">
                {operationalCostCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-slate-600">Jumlah (Rp)</label>
            <input type="number" name="amount" id="amount" value={formData.amount} onChange={handleChange} required min="0" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"/>
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-slate-600">Tanggal</label>
            <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"/>
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300">Batal</button>
            <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Component
const OperationalCosts: React.FC = () => {
    const { businessUnits, outlets, operationalCosts, operationalCostCategories, addOperationalCost, updateOperationalCost, deleteOperationalCost } = usePosData();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCost, setEditingCost] = useState<OperationalCost | null>(null);

    // Filters
    const [selectedUnit, setSelectedUnit] = useState<string>(businessUnits[0]?.id || '');
    const [selectedOutlet, setSelectedOutlet] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1));
    const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));

    const categoryMap = useMemo(() =>
        operationalCostCategories.reduce((acc, cat) => {
            acc[cat.id] = cat.name;
            return acc;
        }, {} as Record<string, string>),
    [operationalCostCategories]);

    const availableOutlets = useMemo(() => {
        return outlets.filter(o => o.businessUnitId === selectedUnit);
    }, [selectedUnit, outlets]);
    
    useEffect(() => {
        if (availableOutlets.length > 0) {
            const currentOutletExists = availableOutlets.some(o => o.id === selectedOutlet);
            if (!currentOutletExists) setSelectedOutlet(availableOutlets[0].id);
        } else {
            setSelectedOutlet('');
        }
    }, [selectedUnit, availableOutlets, selectedOutlet]);

    const filteredCosts = useMemo(() => {
        return operationalCosts.filter(cost => {
            const costDate = new Date(cost.date);
            const monthMatch = selectedMonth === 'all' || costDate.getMonth() + 1 === parseInt(selectedMonth);
            const yearMatch = costDate.getFullYear() === parseInt(selectedYear);
            return cost.outletId === selectedOutlet && monthMatch && yearMatch;
        }).sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [operationalCosts, selectedOutlet, selectedMonth, selectedYear]);

    const handleOpenModal = (cost: OperationalCost | null = null) => {
        setEditingCost(cost);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCost(null);
    };

    const handleSaveCost = (costData: Omit<OperationalCost, 'id' | 'outletId'> | OperationalCost) => {
        if ('id' in costData) {
            updateOperationalCost(costData);
        } else if (selectedOutlet) {
            addOperationalCost({ ...costData, outletId: selectedOutlet });
        }
    };

    const years = useMemo(() => Array.from(new Set(operationalCosts.map(c => new Date(c.date).getFullYear()))).sort((a,b) => b-a), [operationalCosts]);
    const months = [
        { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' }, { value: '3', label: 'Maret' },
        { value: '4', label: 'April' }, { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
        { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' }, { value: '9', label: 'September' },
        { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <h2 className="text-3xl font-bold text-slate-800">Biaya Operasional</h2>
                 <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-wrap">
                    <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500">
                      {businessUnits.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                    </select>
                    <select value={selectedOutlet} onChange={(e) => setSelectedOutlet(e.target.value)} className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" disabled={availableOutlets.length === 0}>
                       {availableOutlets.map(outlet => <option key={outlet.id} value={outlet.id}>{outlet.name}</option>)}
                    </select>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500">
                        <option value="all">Semua Bulan</option>
                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                 </div>
            </div>
            
            <div className="flex justify-end">
                <button 
                    onClick={() => handleOpenModal()} 
                    className={`flex items-center px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition ${!selectedOutlet ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!selectedOutlet}
                >
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    Tambah Biaya
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tanggal</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kategori</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Deskripsi</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Jumlah</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredCosts.length > 0 ? filteredCosts.map((cost) => (
                                <tr key={cost.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{new Date(cost.date).toLocaleDateString('id-ID')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{categoryMap[cost.categoryId] || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{cost.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">Rp{cost.amount.toLocaleString('id-ID')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(cost)} className="text-red-600 hover:text-red-900 mr-4"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => deleteOperationalCost(cost.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-slate-500">
                                        {selectedOutlet ? 'Tidak ada data biaya untuk filter ini.' : 'Silakan pilih unit usaha dan outlet.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <CostModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveCost} cost={editingCost} />
        </div>
    );
};

export default OperationalCosts;