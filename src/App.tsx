import React, { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import { format } from 'date-fns';
import { Receipt } from './types';
import ReceiptForm from './components/ReceiptForm';
import ReceiptPreview from './components/ReceiptPreview';
import Database from './components/Database';

const STORAGE_KEY = 'hma_receipts_v2';
const DRAFT_KEY = 'hma_form_draft';
const LAST_RECEIPT_KEY = 'hma_last_receipt';
const DARK_MODE_KEY = 'hma_dark_mode';

export default function App() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [formData, setFormData] = useState<Partial<Receipt>>({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [isFetchingAPI, setIsFetchingAPI] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    pageSize: 'A5',
    orientation: 'portrait',
    margin: 1.0
  });
  
  const receiptRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bulkPrintReceipts, setBulkPrintReceipts] = useState<Receipt[]>([]);
  const bulkPrintContainerRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    // Load Dark Mode
    const savedDarkMode = localStorage.getItem(DARK_MODE_KEY) === 'true';
    setIsDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }

    // Load Receipts
    const savedReceipts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    setReceipts(savedReceipts);

    // Check for shared receipt ID in URL
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('id');
    
    if (sharedId) {
      const sharedReceipt = savedReceipts.find((r: Receipt) => r.id === sharedId);
      if (sharedReceipt) {
        setFormData(sharedReceipt);
        setShowPreviewModal(true);
      } else {
        alert('Resit tidak dijumpai.');
        resetForm();
      }
    } else {
      // Load Draft or Initialize Form
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (draft) {
        setFormData(draft);
      } else {
        resetForm();
      }
    }
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    }
  }, [formData]);

  // Save receipts to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
  }, [receipts]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem(DARK_MODE_KEY, String(newMode));
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const [isEditing, setIsEditing] = useState(false);

  const generateReceiptNumber = (currentReceipts?: Receipt[]) => {
    const list = currentReceipts || JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const year = new Date().getFullYear();
    const prefix = `HMA-${year}-`;
    
    let maxNum = 0;
    for (const r of list) {
      if (r.id?.startsWith(prefix)) {
        const numPart = r.id.replace(prefix, '');
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    
    // Check against LAST_RECEIPT_KEY to avoid reusing numbers from deleted receipts
    const lastNumFromStorage = parseInt(localStorage.getItem(LAST_RECEIPT_KEY) || '0', 10);
    maxNum = Math.max(maxNum, lastNumFromStorage);
    
    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  };

  const resetForm = () => {
    setIsEditing(false);
    setFormData({
      id: generateReceiptNumber(),
      documentType: 'RESIT',
      tarikh: format(new Date(), 'yyyy-MM-dd'),
      kategori: 'DOKUMEN',
      paymentMethod: 'CASH',
      nama: '',
      alamat: '',
      item: 'Fee/Deposit',
      jumlah: 0,
      items: [{ description: 'Fee/Deposit', amount: 0 }],
      bakiTerdahulu: 0,
      butiran: '',
      timestamp: new Date().toISOString()
    });
  };

  const handleSave = () => {
    if (!formData.nama || formData.jumlah === undefined) {
      alert('Sila isi nama pelanggan dan jumlah bayaran.');
      return;
    }

    // Always fetch latest from localStorage to prevent concurrent overwrite
    const savedReceipts: Receipt[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    let finalId = formData.id;
    if (!isEditing) {
      // Regenerate ID right before saving to guarantee uniqueness against latest data
      finalId = generateReceiptNumber(savedReceipts);
      
      // Update the running counter
      const newNum = parseInt((finalId as string).split('-').pop() || '0', 10);
      localStorage.setItem(LAST_RECEIPT_KEY, String(Math.max(newNum, parseInt(localStorage.getItem(LAST_RECEIPT_KEY) || '0', 10))));
    }

    const newReceipt = {
      ...formData,
      id: finalId,
      timestamp: new Date().toISOString()
    } as Receipt;

    let updatedReceipts;
    const existing = savedReceipts.findIndex(r => r.id === newReceipt.id);
    
    if (existing >= 0 && isEditing) {
      updatedReceipts = [...savedReceipts];
      updatedReceipts[existing] = newReceipt;
    } else {
      updatedReceipts = [newReceipt, ...savedReceipts.filter(r => r.id !== newReceipt.id)];
    }

    setReceipts(updatedReceipts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReceipts));
    
    // Update formData id so the UI reflects the potentially new ID, but stay in edit mode so double clicks don't create duplicates
    setFormData(prev => ({ ...prev, id: finalId }));
    setIsEditing(true);

    // Print after save
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleExportPDF = () => {
    if (!receiptRef.current) return;
    const element = receiptRef.current;
    const opt = {
      margin: printConfig.margin,
      filename: `${formData.id || 'Resit'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 800 },
      jsPDF: { unit: 'cm', format: printConfig.pageSize.toLowerCase(), orientation: printConfig.orientation }
    };
    html2pdf().set(opt).from(element).save();
  };

  useEffect(() => {
    if (bulkPrintReceipts.length > 0 && bulkPrintContainerRef.current) {
      setTimeout(() => {
        const element = bulkPrintContainerRef.current;
        if (!element) return;
        const opt = {
          margin: printConfig.margin,
          filename: `HMA_Export_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, windowWidth: 800 },
          jsPDF: { unit: 'cm', format: printConfig.pageSize.toLowerCase(), orientation: printConfig.orientation }
        };
        html2pdf().set(opt).from(element).save().then(() => {
          setBulkPrintReceipts([]);
        });
      }, 500);
    }
  }, [bulkPrintReceipts, printConfig]);

  const handleEdit = (receipt: Receipt) => {
    setIsEditing(true);
    setFormData(receipt);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDuplicate = (receipt: Receipt) => {
    setIsEditing(false);
    const newId = generateReceiptNumber();
    setFormData({
      ...receipt,
      id: newId,
      tarikh: format(new Date(), 'yyyy-MM-dd'),
      timestamp: new Date().toISOString()
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShare = (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Pautan resit berjaya disalin ke clipboard!\n\n' + url);
    }).catch(() => {
      alert('Gagal menyalin pautan.');
    });
  };

  const handlePrint = (receipt: Receipt) => {
    setFormData(receipt);
    setShowPreviewModal(true);
  };

  const handleDelete = (id: string) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
  };

  const handleBulkDelete = (ids: string[]) => {
    setReceipts(prev => prev.filter(r => !ids.includes(r.id)));
  };

  const handleBulkExportPDF = (ids: string[]) => {
    const selected = receipts.filter(r => ids.includes(r.id));
    setBulkPrintReceipts(selected);
  };

  const handleBackup = () => {
    const dataStr = JSON.stringify(receipts, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `hma_backup_${format(new Date(), 'yyyyMMdd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    setShowBackupModal(false);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          if (window.confirm('Adakah anda pasti untuk restore data ini? Data sedia ada akan diganti.')) {
            setReceipts(data);
            alert('Data berjaya di-restore!');
          }
        } else {
          alert('Format fail tidak sah.');
        }
      } catch (err) {
        alert('Ralat membaca fail JSON.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportExcel = () => {
    const headers = ['No. Resit', 'Tarikh', 'Kategori', 'Cara Bayaran', 'Nama', 'Alamat', 'Perkara', 'Jumlah', 'Baki Terdahulu', 'Butiran'];
    const csvContent = [
      headers.join(','),
      ...receipts.map(r => [
        r.id,
        r.tarikh,
        r.kategori,
        r.paymentMethod,
        `"${r.nama.replace(/"/g, '""')}"`,
        `"${r.alamat.replace(/"/g, '""')}"`,
        `"${r.item.replace(/"/g, '""')}"`,
        r.jumlah,
        r.bakiTerdahulu,
        `"${r.butiran.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `hma_export_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.click();
  };

  const handleFetchAPI = async () => {
    setIsFetchingAPI(true);
    try {
      // Simulate an API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      // In a real application, you would fetch the data from your backend
      // const response = await fetch('/api/receipts');
      // const data = await response.json();
      // setReceipts(data);
      alert('Data berjaya diselaraskan dengan API (Simulasi).');
    } catch (error) {
      alert('Gagal mengambil data dari API.');
    } finally {
      setIsFetchingAPI(false);
    }
  };

  // Calculate Stats
  const totalReceipts = receipts.length;
  const totalAmount = receipts.reduce((sum, r) => sum + r.jumlah, 0);
  const totalBalance = receipts.reduce((sum, r) => sum + (r.bakiTerdahulu - r.jumlah), 0);
  const uniqueCustomers = new Set(receipts.map(r => r.nama.toLowerCase())).size;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-4 md:p-8 font-sans transition-colors">
      <style>{`
        @media print {
          @page {
            size: ${printConfig.pageSize} ${printConfig.orientation};
            margin: ${printConfig.margin}cm;
          }
        }
      `}</style>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 dark:border-slate-700 pb-4 gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white m-0">Sistem Resit HMA</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={handleFetchAPI}
              disabled={isFetchingAPI}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed border border-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
            >
              {isFetchingAPI ? '🔄 Syncing...' : '🔄 Sync API'}
            </button>
            <button 
              onClick={toggleDarkMode}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              {isDarkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
            <button 
              onClick={() => setShowBackupModal(true)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              💾 Backup
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              📂 Restore
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept=".json" 
              onChange={handleRestore} 
              className="hidden" 
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm flex flex-col justify-center">
            <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Resit</h4>
            <p className="text-3xl font-light text-slate-900 dark:text-white">{totalReceipts}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm flex flex-col justify-center">
            <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Bayaran</h4>
            <p className="text-3xl font-light text-slate-900 dark:text-white">RM {formatCurrency(totalAmount)}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm flex flex-col justify-center">
            <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Baki</h4>
            <p className="text-3xl font-light text-slate-900 dark:text-white">RM {formatCurrency(totalBalance)}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl shadow-sm flex flex-col justify-center">
            <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Pelanggan</h4>
            <p className="text-3xl font-light text-slate-900 dark:text-white">{uniqueCustomers}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="print:hidden flex-1">
            <ReceiptForm 
              formData={formData}
              setFormData={setFormData}
              onSave={handleSave}
              onPreview={() => setShowPreviewModal(true)}
              onExportPDF={handleExportPDF}
              onReset={resetForm}
            />
          </div>
          <div className="flex-1 print:w-full print:m-0 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden print:border-none print:shadow-none print:rounded-none">
            <ReceiptPreview ref={receiptRef} data={formData} />
          </div>
        </div>

        {/* Database */}
        <div className="print:hidden">
          <Database 
            receipts={receipts}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
            onExportExcel={handleExportExcel}
            onBulkExportPDF={handleBulkExportPDF}
            onShare={handleShare}
            onPrint={handlePrint}
          />
        </div>

        {bulkPrintReceipts.length > 0 && (
          <div className="absolute left-[-9999px] top-0 w-[800px] bg-white text-black">
            <div ref={bulkPrintContainerRef}>
              {bulkPrintReceipts.map((receipt, index) => (
                <div key={receipt.id} style={{ pageBreakAfter: index < bulkPrintReceipts.length - 1 ? 'always' : 'auto', breakAfter: index < bulkPrintReceipts.length - 1 ? 'page' : 'auto' }}>
                  <ReceiptPreview data={receipt} />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold">Print Preview</h2>
              <button onClick={() => setShowPreviewModal(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex flex-wrap gap-6 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Paper Size</label>
                <select 
                  value={printConfig.pageSize}
                  onChange={e => setPrintConfig(prev => ({...prev, pageSize: e.target.value}))}
                  className="p-2 border border-slate-300 rounded-lg text-sm bg-white dark:bg-slate-900 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="A4">A4</option>
                  <option value="A5">A5</option>
                  <option value="Letter">Letter</option>
                  <option value="Legal">Legal</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Orientation</label>
                <select 
                  value={printConfig.orientation}
                  onChange={e => setPrintConfig(prev => ({...prev, orientation: e.target.value}))}
                  className="p-2 border border-slate-300 rounded-lg text-sm bg-white dark:bg-slate-900 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
              <div>
                 <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Margin (cm)</label>
                 <input 
                   type="number" step="0.1" min="0" max="5" 
                   value={printConfig.margin}
                   onChange={e => setPrintConfig(prev => ({...prev, margin: parseFloat(e.target.value) || 0}))}
                   className="p-2 border border-slate-300 rounded-lg text-sm w-20 bg-white dark:bg-slate-900 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                 />
              </div>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-100 dark:bg-slate-900 flex justify-center">
              <div className="max-w-2xl w-full bg-white rounded-lg shadow-md overflow-hidden">
                <ReceiptPreview data={formData} />
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-4 justify-end">
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-2 rounded-lg font-medium shadow-sm transition-colors"
              >
                Tutup
              </button>
              <button 
                onClick={() => {
                  setShowPreviewModal(false);
                  setTimeout(() => window.print(), 100);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-colors"
              >
                Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold">Backup Data</h2>
              <button onClick={() => setShowBackupModal(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6">
              <p className="mb-6 text-slate-600 dark:text-slate-400">Klik butang di bawah untuk download semua data anda sebagai JSON file:</p>
              <div className="flex gap-4">
                <button 
                  onClick={handleBackup}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded font-semibold"
                >
                  💾 Download Backup
                </button>
                <button 
                  onClick={() => setShowBackupModal(false)}
                  className="flex-1 bg-slate-400 hover:bg-slate-500 text-white px-4 py-2 rounded font-semibold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

