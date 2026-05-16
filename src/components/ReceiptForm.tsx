import React from 'react';
import { Receipt } from '../types';

interface ReceiptFormProps {
  formData: Partial<Receipt>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Receipt>>>;
  onSave: () => void;
  onPreview: () => void;
  onExportPDF: () => void;
  onReset: () => void;
}

export default function ReceiptForm({
  formData,
  setFormData,
  onSave,
  onPreview,
  onExportPDF,
  onReset
}: ReceiptFormProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'jumlah' || name === 'bakiTerdahulu' ? parseFloat(value) || 0 : value
    }));
  };

  const lineItems = formData.items && formData.items.length > 0 
    ? formData.items 
    : [{ description: formData.item || '', amount: formData.jumlah || 0 }];

  const handleItemChange = (index: number, field: 'description' | 'amount', value: string | number) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    const newTotal = newItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    
    setFormData(prev => ({
      ...prev,
      items: newItems,
      jumlah: newTotal,
      item: newItems[0]?.description || '' // Backup untuk backward compatibility
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...lineItems, { description: '', amount: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    const newItems = lineItems.filter((_, i) => i !== index);
    const newTotal = newItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    
    setFormData(prev => ({
      ...prev,
      items: newItems,
      jumlah: newTotal,
      item: newItems.length > 0 ? newItems[0].description : ''
    }));
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1 min-w-[300px] transition-colors">
      <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3 mb-5">
        Jana Dokumen Baru
      </h2>
      
      <form className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Tarikh:</label>
            <input 
              type="date" 
              name="tarikh"
              value={formData.tarikh || ''}
              onChange={handleChange}
              className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">No. Dokumen:</label>
            <input 
              type="text" 
              name="id"
              value={formData.id || ''}
              readOnly
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tajuk Dokumen:</label>
            <select 
              name="documentType"
              value={formData.documentType || 'RESIT'}
              onChange={handleChange}
              className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase transition-shadow"
            >
              <option value="RESIT">RESIT</option>
              <option value="INVOICE">INVOICE</option>
              <option value="SEBUT HARGA">SEBUT HARGA</option>
              <option value="PAYMENT VOUCHER">PAYMENT VOUCHER</option>
              <option value="SLIP">SLIP</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Kategori:</label>
            <select 
              name="kategori"
              value={formData.kategori || 'DOKUMEN'}
              onChange={handleChange}
              className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
            >
              <option value="DOKUMEN">DOKUMEN</option>
              <option value="LAWYER">LAWYER</option>
              <option value="LAIN-LAIN">LAIN-LAIN</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Cara Pembayaran:</label>
            <select 
              name="paymentMethod"
              value={formData.paymentMethod || 'CASH'}
              onChange={handleChange}
              className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
            >
              <option value="CASH">CASH</option>
              <option value="TRANSFER">TRANSFER</option>
              <option value="CHEQUE">CHEQUE</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nama Pelanggan / Syarikat:</label>
          <input 
            type="text" 
            name="nama"
            value={formData.nama || ''}
            onChange={handleChange}
            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
            required 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Alamat:</label>
          <textarea 
            name="alamat"
            value={formData.alamat || ''}
            onChange={handleChange}
            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[80px] transition-shadow resize-y"
          />
        </div>

        <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Senarai Perkara / Keterangan:</label>
            <button 
              type="button" 
              onClick={addItem} 
              className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              + Tambah Baris
            </button>
          </div>
          
          {lineItems.map((item, index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex-1 w-full">
                <input 
                  type="text" 
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  placeholder="Keterangan item/perkara..."
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                  required
                />
              </div>
              <div className="w-full sm:w-48 flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-sm">RM</span>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={item.amount === 0 && item.description === '' ? '' : item.amount}
                    onChange={(e) => handleItemChange(index, 'amount', parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 pl-10 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow font-mono"
                    placeholder="0.00"
                    required
                  />
                </div>
                {lineItems.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeItem(index)} 
                    className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800"
                    title="Padam baris"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
          
          <div className="flex justify-end pt-3 mt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="text-right flex items-center pr-2">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mr-4">Jumlah Keseluruhan:</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                RM {new Intl.NumberFormat('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(formData.jumlah || 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Baki Terdahulu (RM):</label>
            <input 
              type="number" 
              name="bakiTerdahulu"
              step="0.01"
              min="0"
              value={formData.bakiTerdahulu || ''}
              onChange={handleChange}
              className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow font-mono"
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Butiran Lanjut / Nota:</label>
            <input 
              type="text" 
              name="butiran"
              value={formData.butiran || ''}
              onChange={handleChange}
              className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button 
            type="button" 
            onClick={onSave}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors shadow-sm"
          >
            Simpan & Cetak
          </button>
          <button 
            type="button" 
            onClick={onPreview}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2.5 px-4 rounded-lg font-medium transition-colors shadow-sm"
          >
            Preview
          </button>
          <button 
            type="button" 
            onClick={onExportPDF}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2.5 px-4 rounded-lg font-medium transition-colors shadow-sm"
          >
            Export PDF
          </button>
          <button 
            type="button" 
            onClick={onReset}
            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 py-2.5 px-4 rounded-lg font-medium transition-colors"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
