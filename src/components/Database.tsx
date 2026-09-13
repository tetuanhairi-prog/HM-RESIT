import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Receipt, SortOption } from '../types';

interface DatabaseProps {
  receipts: Receipt[];
  onEdit: (receipt: Receipt) => void;
  onDuplicate: (receipt: Receipt) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onExportExcel: () => void;
  onBulkExportPDF: (ids: string[]) => void;
  onShare: (id: string) => void;
  onPrint: (receipt: Receipt) => void;
  onQuickPrint: (receipt: Receipt) => void;
  isSyncing?: boolean;
  cloudSyncStatus?: 'online' | 'syncing' | 'error';
  lastSyncedTime?: string;
  onManualSync?: () => void;
}

export default function Database({
  receipts,
  onEdit,
  onDuplicate,
  onDelete,
  onBulkDelete,
  onExportExcel,
  onBulkExportPDF,
  onShare,
  onPrint,
  onQuickPrint,
  isSyncing = false,
  cloudSyncStatus = 'online',
  lastSyncedTime,
  onManualSync
}: DatabaseProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterSort, setFilterSort] = useState<SortOption>('latest');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'simple' | 'detailed'>('simple');

  const getReceiptButiran = (r: Receipt): string => {
    if (r.items && r.items.length > 0) {
      const itemsList = r.items.map(i => i.description).filter(Boolean);
      if (itemsList.length > 0) return itemsList.join(', ');
    }
    return r.butiran || r.item || '-';
  };

  const filteredAndSortedReceipts = useMemo(() => {
    let result = [...receipts];

    // Search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(r => 
        (r.nama && r.nama.toLowerCase().includes(lowerQuery)) || 
        (r.id && r.id.toLowerCase().includes(lowerQuery)) ||
        getReceiptButiran(r).toLowerCase().includes(lowerQuery)
      );
    }

    // Payment Filter
    if (filterPayment) {
      result = result.filter(r => r.paymentMethod === filterPayment);
    }

    // Date Range Filter
    if (dateFrom) {
      result = result.filter(r => new Date(r.tarikh) >= new Date(dateFrom));
    }
    if (dateTo) {
      result = result.filter(r => new Date(r.tarikh) <= new Date(dateTo));
    }

    // Sort
    result.sort((a, b) => {
      switch (filterSort) {
        case 'latest':
          return new Date(b.timestamp || b.tarikh).getTime() - new Date(a.timestamp || a.tarikh).getTime();
        case 'oldest':
          return new Date(a.timestamp || a.tarikh).getTime() - new Date(b.timestamp || b.tarikh).getTime();
        case 'amount-asc':
          return a.jumlah - b.jumlah;
        case 'amount-desc':
          return b.jumlah - a.jumlah;
        case 'name-asc':
          return (a.nama || '').localeCompare(b.nama || '');
        case 'name-desc':
          return (b.nama || '').localeCompare(a.nama || '');
        default:
          return 0;
      }
    });

    return result;
  }, [receipts, searchQuery, filterPayment, filterSort, dateFrom, dateTo]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredAndSortedReceipts.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Adakah anda pasti untuk memadam ${selectedIds.size} rekod terpilih?`)) {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterPayment('');
    setFilterSort('latest');
    setDateFrom('');
    setDateTo('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors mt-6 print:hidden">
      {/* Header with Online Cloud Sync Status */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white m-0">
              Senarai Rekod Data
            </h3>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              cloudSyncStatus === 'error'
                ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800'
                : isSyncing
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                cloudSyncStatus === 'error' ? 'bg-red-500' : isSyncing ? 'bg-amber-500 animate-spin' : 'bg-emerald-500 animate-pulse'
              }`} />
              {isSyncing ? 'Menyegerak ke Cloud...' : cloudSyncStatus === 'error' ? 'Cloud Ralat' : 'Auto-Sync Cloud Online'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Data terselamat di Cloud Firestore • Format mudah: <strong>NAMA / TARIKH / BUTIRAN / TOTAL</strong>
            {lastSyncedTime && ` • Diselaras: ${lastSyncedTime}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switch: Simple (Name/Date/Butiran/Total) vs Detailed */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-900 text-xs">
            <button
              onClick={() => setViewMode('simple')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                viewMode === 'simple'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              ⚡ Ringkas (Name/Date/Butiran/Total)
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                viewMode === 'detailed'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              📑 Lengkap
            </button>
          </div>

          {onManualSync && (
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              title="Segerakkan semua data ke Cloud sekarang"
            >
              ☁️ {isSyncing ? 'Syncing...' : 'Sync Cloud'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-5">
        <input 
          type="text" 
          placeholder="Cari Nama, No Resit, atau Butiran..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full md:w-72 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-sm"
        />
        
        <select 
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full md:w-auto outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-sm"
        >
          <option value="">Semua Bayaran</option>
          <option value="CASH">CASH</option>
          <option value="TRANSFER">TRANSFER</option>
          <option value="CHEQUE">CHEQUE</option>
        </select>

        <select 
          value={filterSort}
          onChange={(e) => setFilterSort(e.target.value as SortOption)}
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full md:w-auto outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-sm"
        >
          <option value="latest">Terbaru</option>
          <option value="oldest">Tertua</option>
          <option value="amount-asc">Jumlah (Rendah)</option>
          <option value="amount-desc">Jumlah (Tinggi)</option>
          <option value="name-asc">Nama (A-Z)</option>
          <option value="name-desc">Nama (Z-A)</option>
        </select>

        <input 
          type="date" 
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full md:w-auto outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-sm"
        />
        <span className="text-slate-400">-</span>
        <input 
          type="date" 
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full md:w-auto outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-sm"
        />

        <button 
          onClick={resetFilters}
          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
          <input 
            type="checkbox" 
            checked={selectedIds.size === filteredAndSortedReceipts.length && filteredAndSortedReceipts.length > 0}
            onChange={handleSelectAll}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          /> 
          Pilih Semua ({filteredAndSortedReceipts.length})
        </label>
        {selectedIds.size > 0 && (
          <>
            <button 
              onClick={handleBulkDelete}
              className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              Padam Terpilih ({selectedIds.size})
            </button>
            <button 
              onClick={() => {
                onBulkExportPDF(Array.from(selectedIds));
              }}
              className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              📄 Export PDF ({selectedIds.size})
            </button>
          </>
        )}
        <button 
          onClick={onExportExcel}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ml-auto"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Main Table: Simple data (NAME / DATE / BUTIRAN / TOTAL) */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase text-xs tracking-wider">
            <tr>
              <th className="p-3.5 border-b border-slate-200 dark:border-slate-700 w-10 text-center">
                <input 
                  type="checkbox" 
                  checked={selectedIds.size === filteredAndSortedReceipts.length && filteredAndSortedReceipts.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="p-3.5 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-slate-200">
                NAMA (Pelanggan)
              </th>
              <th className="p-3.5 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-slate-200">
                TARIKH (Date)
              </th>
              <th className="p-3.5 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-slate-200">
                BUTIRAN (Keterangan)
              </th>
              <th className="p-3.5 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-slate-200 text-right">
                TOTAL (RM)
              </th>
              {viewMode === 'detailed' && (
                <>
                  <th className="p-3.5 border-b border-slate-200 dark:border-slate-700 font-medium">No. Dokumen</th>
                  <th className="p-3.5 border-b border-slate-200 dark:border-slate-700 font-medium">Jenis</th>
                  <th className="p-3.5 border-b border-slate-200 dark:border-slate-700 font-medium text-right">Baki (RM)</th>
                </>
              )}
              <th className="p-3.5 border-b border-slate-200 dark:border-slate-700 font-medium text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50 bg-white dark:bg-slate-800">
            {filteredAndSortedReceipts.length === 0 ? (
              <tr>
                <td colSpan={viewMode === 'detailed' ? 9 : 6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                  {searchQuery ? 'Tiada rekod sepadan dengan carian.' : 'Tiada rekod data dijumpai di Cloud atau tempatan.'}
                </td>
              </tr>
            ) : (
              filteredAndSortedReceipts.map(receipt => {
                const baki = (receipt.bakiTerdahulu || 0) - (receipt.jumlah || 0);
                const butiranText = getReceiptButiran(receipt);
                return (
                  <tr key={receipt.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 text-slate-800 dark:text-slate-300 transition-colors group">
                    <td className="p-3.5 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(receipt.id)}
                        onChange={() => handleSelectOne(receipt.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>

                    {/* NAME */}
                    <td className="p-3.5 font-semibold text-slate-900 dark:text-slate-100">
                      <div>{receipt.nama || '-'}</div>
                      <div className="text-[11px] text-slate-400 font-mono font-normal">{receipt.id}</div>
                    </td>

                    {/* DATE */}
                    <td className="p-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {receipt.tarikh ? (
                        <span>{format(new Date(receipt.tarikh), 'dd/MM/yyyy')}</span>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* BUTIRAN */}
                    <td className="p-3.5 max-w-xs md:max-w-md">
                      <div className="line-clamp-2 text-slate-700 dark:text-slate-300 font-normal" title={butiranText}>
                        {butiranText}
                      </div>
                    </td>

                    {/* TOTAL */}
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      RM {formatCurrency(receipt.jumlah || 0)}
                    </td>

                    {viewMode === 'detailed' && (
                      <>
                        <td className="p-3.5 font-mono text-xs text-slate-500">{receipt.id}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium tracking-wide uppercase ${
                            receipt.paymentMethod === 'CASH' ? 'bg-emerald-100/60 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                            receipt.paymentMethod === 'TRANSFER' ? 'bg-blue-100/60 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                            'bg-purple-100/60 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400'
                          }`}>
                            {receipt.paymentMethod || 'CASH'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-500 dark:text-slate-400">
                          {formatCurrency(baki)}
                        </td>
                      </>
                    )}

                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onEdit(receipt)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded transition-colors"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => onDuplicate(receipt)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded transition-colors"
                          title="Duplicate"
                        >
                          📋
                        </button>
                        <button 
                          onClick={() => onQuickPrint(receipt)}
                          className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-slate-700 rounded transition-colors"
                          title="Cetak Pantas"
                        >
                          ⚡
                        </button>
                        <button 
                          onClick={() => onPrint(receipt)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded transition-colors"
                          title="Print Preview"
                        >
                          🖨️
                        </button>
                        <button 
                          onClick={() => onShare(receipt.id)}
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-700 rounded transition-colors"
                          title="Kongsi"
                        >
                          🔗
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm(`Padam rekod ${receipt.id}?`)) {
                              onDelete(receipt.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded transition-colors"
                          title="Padam"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
