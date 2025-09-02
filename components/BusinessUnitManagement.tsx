

import React, { useState, useEffect } from 'react';
import { BusinessUnit } from '../types';
import { EditIcon, TrashIcon, PlusIcon, ImagePlaceholderIcon } from './icons/Icons';
import { useNotification } from '../contexts/NotificationContext';
import ConfirmationModal from './ConfirmationModal';

const API_STORAGE_URL = 'https://api.majukoperasiku.my.id/storage';
const API_ENDPOINT = 'https://api.majukoperasiku.my.id/manage/business';

const getFullLogoUrl = (path: string | null): string | null => {
  if (!path) return null;
  // If it's already a full URL (http/https) or a local blob, return as is.
  if (path.startsWith('http') || path.startsWith('blob:')) {
    return path;
  }
  return `${API_STORAGE_URL}/${path}`;
};

const ImageWithFallback: React.FC<{
  src: string | null;
  alt: string;
  className: string;
  fallbackClassName?: string;
}> = ({ src, alt, className, fallbackClassName }) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    if (src) {
      setError(false); // Reset error state when src changes
    }
  }, [src]);

  const handleError = () => {
    setError(true);
  };

  if (error || !src) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-slate-100">
        <ImagePlaceholderIcon className={fallbackClassName || 'w-full h-full text-slate-400 p-2'} />
      </div>
    );
  }

  return <img src={src} alt={alt} onError={handleError} className={className} />;
};


// API Helper with Progress and Error Handling for POST/PUT
const apiRequestWithProgress = (
    method: 'POST' | 'PUT',
    url: string,
    data: FormData,
    onProgress: (progress: number) => void
): Promise<any> => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // For PUT requests with FormData, we use POST and add a _method field.
        // This is a common practice for many server-side frameworks.
        const httpMethod = 'POST';
        if (method === 'PUT') {
            data.append('_method', 'PUT');
        }

        xhr.open(httpMethod, url, true);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                onProgress(percentComplete);
            }
        };

        xhr.onload = () => {
            try {
                const response = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300) {
                     resolve(response.data || response);
                } else {
                    reject(new Error(response.message || `Server merespons dengan status ${xhr.status}`));
                }
            } catch (e) {
                reject(new Error(`Gagal mem-parsing respons server: ${xhr.responseText}`));
            }
        };

        xhr.onerror = () => {
            reject(new Error('Kesalahan jaringan saat mengunggah.'));
        };
        
        xhr.send(data);
    });
};


// Modal Component for Business Unit
const BusinessUnitModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // Changed to a simple trigger
  unit: BusinessUnit | null;
}> = ({ isOpen, onClose, onSave, unit }) => {
  
  const { addNotification } = useNotification();
  const initialFormState = {
    name: '',
    email: '',
    contact: '',
    description: '',
    website: '',
    instagram: '',
    tiktok: '',
    is_active: '1',
    logo: null,
  };

  const [formData, setFormData] = useState<Omit<BusinessUnit, 'id' | 'outlets'>>(initialFormState);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
        if (unit) {
            setFormData({
                name: unit.name,
                email: unit.email || '',
                contact: unit.contact || '',
                description: unit.description || '',
                website: unit.website || '',
                instagram: unit.instagram || '',
                tiktok: unit.tiktok || '',
                is_active: unit.is_active,
                logo: unit.logo
            });
            setPreviewUrl(getFullLogoUrl(unit.logo));
        } else {
             setFormData(initialFormState);
             setPreviewUrl(null);
        }
        setSelectedFile(null);
        setIsUploading(false);
        setUploadProgress(0);
    }
  }, [unit, isOpen]);
  
  // Cleanup blob URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);


  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({...prev, [name]: value}));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
    }
    
    if (file && file.type.startsWith('image/')) {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    } else {
        setSelectedFile(null);
        setPreviewUrl(getFullLogoUrl(unit?.logo || null));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() === '') return;
    
    setIsUploading(true);
    setUploadProgress(0);

    const apiFormData = new FormData();
    const payload: { [key: string]: any } = { ...formData };
    delete (payload as any).logo;

    // Append only non-empty fields to FormData
    for (const key in payload) {
        if (payload[key] !== null && payload[key] !== '') {
            apiFormData.append(key, payload[key]);
        }
    }
    
    if (selectedFile) {
        apiFormData.append('logo', selectedFile);
    }

    try {
        if (unit) { // Handle EDIT
            await apiRequestWithProgress(
                'PUT',
                `${API_ENDPOINT}/${unit.id}`,
                apiFormData,
                (progress) => setUploadProgress(progress)
            );
            addNotification('Data unit usaha berhasil diperbarui.', 'success');
        } else { // Handle ADD NEW
            await apiRequestWithProgress(
                'POST',
                API_ENDPOINT,
                apiFormData,
                (progress) => setUploadProgress(progress)
            );
            addNotification('Unit usaha baru berhasil ditambahkan.', 'success');
        }
        onSave(); // Trigger refetch in parent
        onClose();
    } catch (error: any) {
        addNotification(`Proses unggah bermasalah: ${error.message}`, 'error');
        setIsUploading(false);
        setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto py-10">
      <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 w-full max-w-2xl max-h-full overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-slate-800">{unit ? 'Ubah Unit Usaha' : 'Tambah Unit Usaha Baru'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-600">Logo Unit Usaha</label>
                <div className="mt-1 flex items-center gap-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden border">
                         <ImageWithFallback
                            src={previewUrl}
                            alt="Preview Logo"
                            className="w-full h-full object-cover"
                            fallbackClassName="w-12 h-12 text-slate-400"
                        />
                    </div>
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-red-500">
                        <span>Unggah file</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" disabled={isUploading} />
                    </label>
                </div>
            </div>
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-600">Nama Unit Usaha</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" disabled={isUploading}/>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-600">Email</label>
                    <input type="email" name="email" id="email" value={formData.email || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" disabled={isUploading}/>
                </div>
                <div>
                    <label htmlFor="contact" className="block text-sm font-medium text-slate-600">Kontak (No. HP)</label>
                    <input type="tel" name="contact" id="contact" value={formData.contact || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" disabled={isUploading}/>
                </div>
            </div>
             <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-600">Deskripsi</label>
                <textarea name="description" id="description" value={formData.description || ''} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" disabled={isUploading}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="website" className="block text-sm font-medium text-slate-600">Website</label>
                    <input type="url" name="website" id="website" value={formData.website || ''} onChange={handleChange} placeholder="https://contoh.com" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" disabled={isUploading}/>
                </div>
                 <div>
                    <label htmlFor="instagram" className="block text-sm font-medium text-slate-600">Instagram</label>
                    <input type="text" name="instagram" id="instagram" value={formData.instagram || ''} onChange={handleChange} placeholder="@username" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" disabled={isUploading}/>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="tiktok" className="block text-sm font-medium text-slate-600">TikTok</label>
                    <input type="text" name="tiktok" id="tiktok" value={formData.tiktok || ''} onChange={handleChange} placeholder="@username" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" disabled={isUploading}/>
                </div>
                 <div>
                    <label htmlFor="is_active" className="block text-sm font-medium text-slate-600">Status</label>
                    <select name="is_active" id="is_active" value={formData.is_active} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500" disabled={isUploading}>
                        <option value="1">Aktif</option>
                        <option value="0">Tidak Aktif</option>
                    </select>
                </div>
            </div>
            {isUploading && (
                <div className="space-y-1">
                    <div className="flex justify-between">
                        <span className="text-sm font-medium text-slate-700">Mengunggah...</span>
                        <span className="text-sm font-medium text-slate-700">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div className="bg-red-600 h-2.5 rounded-full transition-all duration-150" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                </div>
            )}
          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isUploading}>Batal</button>
            <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-wait w-28 text-center" disabled={isUploading}>
              {isUploading ? 'Mengunggah...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Component
const BusinessUnitManagement: React.FC = () => {
    const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { addNotification } = useNotification();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<BusinessUnit | null>(null);

    // State for confirmation modal
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [deletingUnit, setDeletingUnit] = useState<BusinessUnit | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchBusinessUnits = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch(API_ENDPOINT);
            if (!response.ok) {
                throw new Error(`Gagal mengambil data: Status ${response.status}`);
            }
            const result = await response.json();
            if (result.code === 200 && result.data && Array.isArray(result.data.data)) {
                setBusinessUnits(result.data.data);
            } else {
                throw new Error(result.message || 'Format respons API tidak valid');
            }
        } catch (err: any) {
            setError(err.message);
            addNotification(`Gagal memuat data: ${err.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBusinessUnits();
    }, []);

    const handleOpenModal = (unit: BusinessUnit | null = null) => {
        setEditingUnit(unit);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUnit(null);
    };

    const handleSaveUnit = () => {
        fetchBusinessUnits(); // Always refetch data on save
    };

    const handleDeleteUnit = (unit: BusinessUnit) => {
        setDeletingUnit(unit);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingUnit) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`${API_ENDPOINT}/${deletingUnit.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                let errorMessage = `Server merespons dengan status ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // Ignore if response is not JSON
                }
                throw new Error(errorMessage);
            }

            addNotification(`Unit usaha "${deletingUnit.name}" berhasil dihapus.`, 'success');
            fetchBusinessUnits(); // Refresh the list
        } catch (err: any) {
            addNotification(`Gagal menghapus: ${err.message}`, 'error');
        } finally {
            setIsDeleting(false);
            setIsConfirmModalOpen(false);
            setDeletingUnit(null);
        }
    };
    
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-800">Manajemen Unit Usaha</h2>
            
            <div className="flex justify-end">
                <button 
                    onClick={() => handleOpenModal()} 
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition"
                >
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    Tambah Unit Usaha
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Logo</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Unit Usaha</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kontak</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Jumlah Outlet</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isLoading ? (
                                <tr><td colSpan={7} className="text-center py-10 text-slate-500">Memuat data...</td></tr>
                            ) : error && businessUnits.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-10 text-red-500">Error: {error}</td></tr>
                            ) : businessUnits.length > 0 ? businessUnits.map((unit) => (
                                <tr key={unit.id}>
                                    <td className="px-6 py-4">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border">
                                            <ImageWithFallback
                                                src={getFullLogoUrl(unit.logo)}
                                                alt={unit.name}
                                                className="h-full w-full object-cover"
                                                fallbackClassName="w-6 h-6 text-slate-400"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{unit.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{unit.email || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{unit.contact || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-center">{unit.outlets?.length || 0}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            unit.is_active === '1' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {unit.is_active === '1' ? 'Aktif' : 'Tidak Aktif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(unit)} className="text-red-600 hover:text-red-900 mr-4"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteUnit(unit)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-slate-500">
                                        Tidak ada unit usaha yang ditemukan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <BusinessUnitModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveUnit} unit={editingUnit} />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Konfirmasi Hapus"
                message={`Apakah Anda yakin ingin menghapus unit usaha "${deletingUnit?.name}"? Aksi ini tidak dapat dibatalkan.`}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default BusinessUnitManagement;
