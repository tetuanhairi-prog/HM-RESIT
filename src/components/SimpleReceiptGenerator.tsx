import React, { useState, useEffect } from 'react';

interface SimpleReceipt {
  no: string;
  date: string;
  name: string;
  phone: string;
  rm: string;
  words: string;
  for: string;
  method: string;
  cheque: string;
  issuer: string;
  timestamp: number;
}

export default function SimpleReceiptGenerator() {
  const [formData, setFormData] = useState({
    no: '1001',
    date: '',
    name: 'HAIRI MUSTAFA ASSOCIATES',
    phone: '011-5653 1310',
    rm: '80.00',
    words: 'EIGHTY ONLY',
    for: 'LAND VALUATION',
    method: 'tunai',
    cheque: '',
    issuer: 'Admin'
  });

  const [receiptHistory, setReceiptHistory] = useState<SimpleReceipt[]>([]);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<string | null>(null);

  useEffect(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
    setFormData(prev => ({ ...prev, date: date.toLocaleDateString('en-GB', options).toUpperCase() }));

    const stored = localStorage.getItem('simpleReceiptHistory');
    if (stored) {
      try {
        setReceiptHistory(JSON.parse(stored));
      } catch (e) {
        console.error("Ralat membaca data resit", e);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (showNotification = true) => {
    if (!formData.no.trim()) return;

    const newReceipt: SimpleReceipt = {
      ...formData,
      timestamp: Date.now()
    };

    let updatedHistory = [...receiptHistory];
    const existingIndex = updatedHistory.findIndex(r => r.no === formData.no);
    if (existingIndex > -1) {
      updatedHistory[existingIndex] = newReceipt;
    } else {
      updatedHistory.push(newReceipt);
    }

    setReceiptHistory(updatedHistory);
    localStorage.setItem('simpleReceiptHistory', JSON.stringify(updatedHistory));

    if (showNotification) {
      triggerToast(`Resit No. ${formData.no} telah disimpan!`);
    }
  };

  const handlePrintAndSave = () => {
    handleSave(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const triggerToast = (message: string) => {
    setToastMsg(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const loadReceiptData = (no: string) => {
    const item = receiptHistory.find(r => r.no === no);
    if (item) {
      setFormData({
        no: item.no,
        date: item.date,
        name: item.name,
        phone: item.phone,
        rm: item.rm,
        words: item.words,
        for: item.for,
        method: item.method,
        cheque: item.cheque,
        issuer: item.issuer
      });
      triggerToast("Data resit dimuatkan");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const openDeleteModal = (no: string) => {
    setReceiptToDelete(no);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (receiptToDelete) {
      const updated = receiptHistory.filter(r => r.no !== receiptToDelete);
      setReceiptHistory(updated);
      localStorage.setItem('simpleReceiptHistory', JSON.stringify(updated));
      setDeleteModalOpen(false);
      triggerToast(`Resit No. ${receiptToDelete} berjaya dipadam.`);
      setReceiptToDelete(null);
    }
  };

  const resetForm = () => {
    let nextNo = 1001;
    if (receiptHistory.length > 0) {
      const numbers = receiptHistory.map(r => {
        const num = parseInt(r.no.replace(/\D/g, ''));
        return isNaN(num) ? 0 : num;
      });
      const maxNo = Math.max(...numbers);
      if (maxNo > 0) nextNo = maxNo + 1;
    } else {
      let currentInput = parseInt(formData.no);
      if (!isNaN(currentInput)) nextNo = currentInput + 1;
    }

    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };

    setFormData({
      no: String(nextNo),
      date: date.toLocaleDateString('en-GB', options).toUpperCase(),
      name: '',
      phone: '',
      rm: '0.00',
      words: '',
      for: '',
      method: 'tunai',
      cheque: '',
      issuer: formData.issuer // keep current issuer
    });
  };

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-8 items-start w-full relative">
      <style>{`
        @media print {
            body { background-color: white !important; }
            .no-print { display: none !important; }
            .receipt-container { 
                box-shadow: none !important; 
                border: none !important; 
                width: 100% !important; 
                max-width: none !important; 
                margin: 0 !important;
                padding: 0 !important;
            }
        }
        .watermark-bg {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.03;
            pointer-events: none;
            overflow: hidden;
            user-select: none;
            z-index: 0;
        }
        .watermark-text {
            font-size: 2.5rem;
            font-weight: bold;
            color: black;
            transform: rotate(-45deg);
            white-space: nowrap;
            line-height: 4;
        }
        @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .toast-enter {
            animation: slideUp 0.3s ease-out forwards;
        }
      `}</style>

      {/* BAHAGIAN KIRI: BORANG & SENARAI RESIT */}
      <div className="w-full lg:w-1/3 space-y-6 no-print">
        {/* Kad Borang */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Borang Resit</h2>
          </div>

          <form className="space-y-4 text-slate-800 dark:text-slate-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">No. Resit</label>
                <input type="text" name="no" value={formData.no} onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Tarikh</label>
                <input type="text" name="date" value={formData.date} onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Diterima Daripada</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">No. Telefon</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="block text-sm font-semibold mb-1">Jumlah (RM)</label>
                <input type="number" step="0.01" name="rm" value={formData.rm} onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold mb-1">Jumlah Perkataan</label>
                <input type="text" name="words" value={formData.words} onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Bayaran Untuk</label>
              <input type="text" name="for" value={formData.for} onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Kaedah Bayaran</label>
                <select name="method" value={formData.method} onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="tunai">Tunai / Cash</option>
                  <option value="cek">Cek / Cheque</option>
                </select>
              </div>
              {formData.method === 'cek' && (
                <div>
                  <label className="block text-sm font-semibold mb-1">No. Cek</label>
                  <input type="text" name="cheque" value={formData.cheque} onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Dikeluarkan Oleh (Singkatan)</label>
              <input type="text" name="issuer" value={formData.issuer} onChange={handleChange} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button type="button" onClick={handlePrintAndSave} className="flex-1 bg-blue-600 text-white py-2 px-4 rounded font-bold hover:bg-blue-700 flex items-center justify-center gap-2 transition shadow">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                Cetak & Simpan
              </button>
              <button type="button" onClick={() => handleSave(true)} className="bg-emerald-600 text-white py-2 px-4 rounded font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 transition shadow">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                Simpan
              </button>
              <button type="button" onClick={resetForm} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-2 px-4 rounded font-bold hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center transition shadow" title="Resit Baru">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
              </button>
            </div>
          </form>
        </div>

        {/* Kad Senarai Sejarah Resit */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-slate-400"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Senarai Resit (Tersimpan)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-800 dark:text-slate-200">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
                <tr>
                  <th className="px-3 py-2">No</th>
                  <th className="px-3 py-2">Pelanggan</th>
                  <th className="px-3 py-2 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {receiptHistory.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-4 text-slate-500 italic">Tiada resit tersimpan.</td>
                  </tr>
                ) : (
                  [...receiptHistory].sort((a, b) => b.timestamp - a.timestamp).map(item => (
                    <tr key={item.no} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                      <td className="px-3 py-3 font-semibold">{item.no}</td>
                      <td className="px-3 py-3 truncate max-w-[120px]" title={item.name}>{item.name || '-'}</td>
                      <td className="px-3 py-3 text-right space-x-1 whitespace-nowrap">
                        <button type="button" onClick={() => loadReceiptData(item.no)} className="text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 p-1.5 rounded transition inline-block" title="Papar Resit">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <button type="button" onClick={() => openDeleteModal(item.no)} className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 p-1.5 rounded transition inline-block" title="Padam Resit">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* BAHAGIAN KANAN: PAPARAN RESIT */}
      <div className="w-full lg:w-2/3 flex justify-center receipt-container lg:sticky lg:top-8 bg-transparent text-black overflow-x-auto" style={{ color: 'black' }}>
        <div className="bg-white border-2 border-slate-300 w-full min-w-[600px] max-w-[800px] p-8 shadow-lg relative receipt-container min-h-[500px]">
          {/* Watermark */}
          <div className="watermark-bg">
            <div className="watermark-text text-black">
              <p>HAIRI MUSTAFA ASSOCIATES</p>
              <p>HAIRI MUSTAFA ASSOCIATES</p>
              <p>HAIRI MUSTAFA ASSOCIATES</p>
              <p>HAIRI MUSTAFA ASSOCIATES</p>
              <p>HAIRI MUSTAFA ASSOCIATES</p>
              <p>HAIRI MUSTAFA ASSOCIATES</p>
              <p>HAIRI MUSTAFA ASSOCIATES</p>
            </div>
          </div>

          <div className="relative z-10">
            {/* Header Resit */}
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-start gap-4">
                <img src="https://arleta.site/interactivelink/2510/logo.png" alt="Logo Syarikat" className="h-20 w-auto object-contain" crossOrigin="anonymous" />
                <div className="text-left font-bold space-y-1">
                  <h1 className="text-2xl tracking-widest border-b-4 border-slate-800 pb-1 inline-block">RESIT RASMI</h1>
                  <h2 className="text-lg">OFFICIAL RECEIPT</h2>
                </div>
              </div>

              <div className="w-64 space-y-4 text-sm font-semibold">
                <div className="flex items-end gap-2">
                  <div className="w-24 leading-tight">
                    <div> No. Resit</div>
                    <div>Receipt No.</div>
                  </div>
                  <div className="flex-1 border-b-2 border-dotted border-slate-500 text-center text-lg text-red-600 font-bold pb-1">
                    {formData.no || '-'}
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <div className="w-24 leading-tight">
                    <div>日期 / Tarikh</div>
                    <div>Date</div>
                  </div>
                  <div className="flex-1 border-b-2 border-dotted border-slate-500 text-center pb-1 uppercase">
                    {formData.date || '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Isi Resit */}
            <div className="space-y-6 text-sm md:text-base font-semibold">
              <div className="flex items-end">
                <div className="w-48 leading-tight flex-shrink-0">
                  <div>Menerima daripada</div>
                  <div>Received from</div>
                </div>
                <div className="flex-1 border-b-2 border-dotted border-slate-500 px-4 pb-1 uppercase">
                  <span>{formData.name || '-'}</span>
                  {formData.phone && (
                    <span className="ml-4 text-slate-700">(<span>{formData.phone}</span>)</span>
                  )}
                </div>
              </div>

              <div className="flex items-end">
                <div className="w-48 leading-tight flex-shrink-0">
                  <div>Dengan Jumlah RM</div>
                  <div>The sum of Ringgit</div>
                </div>
                <div className="flex-1 border-b-2 border-dotted border-slate-500 px-4 pb-1 uppercase bg-slate-50 italic min-h-[1.5rem]">
                  {formData.words || '-'}
                </div>
              </div>

              <div className="flex items-end">
                <div className="w-48 leading-tight flex-shrink-0">
                  <div>Bayaran untuk</div>
                  <div>Being payment of</div>
                </div>
                <div className="flex-1 border-b-2 border-dotted border-slate-500 px-4 pb-1 uppercase min-h-[1.5rem]">
                  {formData.for || '-'}
                </div>
              </div>
            </div>

            {/* Bahagian Bawah Resit */}
            <div className="mt-12 flex justify-between items-end">
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="bg-slate-200 border-2 border-slate-800 px-4 py-2 font-bold text-xl min-w-[150px] text-center">
                    RM <span>{parseFloat(formData.rm || '0').toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-black flex items-center justify-center bg-white">
                      {formData.method === 'tunai' && <div className="w-2 h-2 bg-black rounded-full block"></div>}
                    </div>
                    <div className="leading-tight">
                      <div>Tunai / Transfer</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-black flex items-center justify-center bg-white">
                      {formData.method === 'cek' && <div className="w-2 h-2 bg-black rounded-full block"></div>}
                    </div>
                    <div className="leading-tight flex items-center gap-2">
                      <div>No.Cek / Cheque No.</div>
                      <div className="border-b border-black w-24 px-1 text-center h-5 bg-transparent">{formData.method === 'cek' ? formData.cheque : ''}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-64 text-center relative">
                <img src="https://arleta.site/interactivelink/2510/cop-bulat.png" 
                     alt="Cop Syarikat" 
                     className="absolute -top-12 left-1/2 transform -translate-x-1/2 w-28 h-28 opacity-90 object-contain pointer-events-none" 
                     style={{ mixBlendMode: 'multiply', transform: 'translateX(-50%) rotate(-5deg)' }}
                     crossOrigin="anonymous" />
                <div className="border-b-2 border-dotted border-slate-500 h-10 mb-2 relative z-10">
                  <span className="absolute bottom-1 left-0 right-0 text-slate-700 italic text-sm">{formData.issuer}</span>
                </div>
                <div className="text-sm font-semibold leading-tight relative z-10">
                  <div>Issued by / Yang dibenarkan</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifikasi */}
      {showToast && (
        <div className="fixed bottom-5 right-5 bg-slate-800 text-white px-6 py-3 rounded shadow-lg z-50 flex items-center gap-3 toast-enter">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Modal Pengesahan Padam */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm p-6 transform transition-all text-slate-800 dark:text-slate-100">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              <h3 className="text-lg font-bold">Padam Resit</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Adakah anda pasti mahu memadam rekod resit ini dari sejarah?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteModalOpen(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded font-medium transition">Batal</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition">Ya, Padam</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
