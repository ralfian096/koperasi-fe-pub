import React, { useState, useEffect } from 'react';
import { BusinessUnit } from '../types';
import { ImagePlaceholderIcon } from './icons/Icons';
import { useNotification } from '../contexts/NotificationContext';

const API_STORAGE_URL = 'https://api.majukoperasiku.my.id/storage';
const API_ENDPOINT = 'https://api.majukoperasiku.my.id/manage/business';

const getFullLogoUrl = (path: string | null): string | null => {
  if (!path) return null;
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
      setError(false);
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

const apiRequestWithProgress = (
    method: 'POST' | 'PUT',
    url: string,
    data: FormData,
    onProgress: (progress: number) => void
): Promise<any> => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
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
                    const errorMessages = response.errors ? Object.values(response.errors).flat().join(' ') : response.message;
                    reject(new Error(errorMessages || `Server merespons dengan status ${xhr.status}`));
                }
            } catch (e) {
                reject(new Error(`Gagal mem-parsing respons server: ${xhr.responseText}`));
            }
        };
        xhr.onerror = () => reject(new Error('Kesalahan jaringan saat mengunggah.'));
        xhr.send(data);
    });
};

const BusinessUnitModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
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

    for (const key in payload) {
        if (payload[key] !== null && payload[key] !== '' && payload[key] !== undefined) {
            apiFormData.append(key, payload[key]);
        }
    }
    
    if (selectedFile) {
        apiFormData.append('logo', selectedFile);
    }

    try {
        if (unit) { // Handle EDIT
            await apiRequestWithProgress('PUT', `${API_ENDPOINT}/${unit.id}`, apiFormData, setUploadProgress);
            addNotification('Data unit usaha berhasil diperbarui.', 'success');
        } else { // Handle ADD NEW
            await apiRequestWithProgress('POST', API_ENDPOINT, apiFormData, setUploadProgress);
            addNotification('Unit usaha baru berhasil ditambahkan.', 'success');
        }
        onSave();
        onClose();
    } catch (error: any) {
        addNotification(`Gagal menyimpan: ${error.message}`, 'error');
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
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                        <span>Unggah file</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" disabled={isUploading} />
                    </label>
                </div>
            </div>
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-600">Nama Unit Usaha *</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" disabled={isUploading}/>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-600">Email</label>
                    <input type="email" name="email" id="email" value={formData.email || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" disabled={isUploading}/>
                </div>
                <div>
                    <label htmlFor="contact" className="block text-sm font-medium text-slate-600">Kontak (No. HP)</label>
                    <input type="tel" name="contact" id="contact" value={formData.contact || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" disabled={isUploading}/>
                </div>
            </div>
             <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-600">Deskripsi</label>
                <textarea name="description" id="description" value={formData.description || ''} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" disabled={isUploading}/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="website" className="block text-sm font-medium text-slate-600">Website</label>
                    <input type="url" name="website" id="website" value={formData.website || ''} onChange={handleChange} placeholder="https://contoh.com" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" disabled={isUploading}/>
                </div>
                 <div>
                    <label htmlFor="instagram" className="block text-sm font-medium text-slate-600">Instagram</label>
                    <input type="text" name="instagram" id="instagram" value={formData.instagram || ''} onChange={handleChange} placeholder="@username" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" disabled={isUploading}/>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="tiktok" className="block text-sm font-medium text-slate-600">TikTok</label>
                    <input type="text" name="tiktok" id="tiktok" value={formData.tiktok || ''} onChange={handleChange} placeholder="@username" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" disabled={isUploading}/>
                </div>
                 <div>
                    <label htmlFor="is_active" className="block text-sm font-medium text-slate-600">Status</label>
                    <select name="is_active" id="is_active" value={formData.is_active} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" disabled={isUploading}>
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
                        <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-150" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                </div>
            )}
          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isUploading}>Batal</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-wait w-28 text-center" disabled={isUploading}>
              {isUploading ? 'Mengunggah...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BusinessUnitModal;
