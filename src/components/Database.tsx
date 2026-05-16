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
  onShare: (id: string) => void;
  onPrint: (receipt: Receipt) => void;
}

export default function Database({
  receipts,
  onEdit,
  onDuplicate,
  onDelete,
  onBulkDelete,
  onExportExcel,
  onShare,
  onPrint
}: DatabaseProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterSort, setFilterSort] = useState<SortOption>('latest');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredAndSortedReceipts = useMemo(() => {
    let result = [...receipts];

    // Search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.nama.toLowerCase().includes(lowerQuery) || 
        r.id.toLowerCase().includes(lowerQuery)
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
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'oldest':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'amount-asc':
          return a.jumlah - b.jumlah;
        case 'amount-desc':
          return b.jumlah - a.jumlah;
        case 'name-asc':
          return a.nama.localeCompare(b.nama);
        case 'name-desc':
          return b.nama.localeCompare(a.nama);
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
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors mt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white m-0">Senarai Rekod Dokumen</h3>
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-5">
        <input 
          type="text" 
          placeholder="Cari nama pelanggan atau no resit..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full md:w-64 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
        />
        
        <select 
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full md:w-auto outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
        >
          <option value="">Semua Bayaran</option>
          <option value="CASH">CASH</option>
          <option value="TRANSFER">TRANSFER</option>
          <option value="CHEQUE">CHEQUE</option>
        </select>

        <select 
          value={filterSort}
          onChange={(e) => setFilterSort(e.target.value as SortOption)}
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full md:w-auto outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
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
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full md:w-auto outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
        />
        <span className="text-slate-400">-</span>
        <input 
          type="date" 
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full md:w-auto outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
        />

        <button 
          onClick={resetFilters}
          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Reset Filters
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
          <input 
            type="checkbox" 
            checked={selectedIds.size === filteredAndSortedReceipts.length && filteredAndSortedReceipts.length > 0}
            onChange={handleSelectAll}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          /> 
          Pilih Semua
        </label>
        {selectedIds.size > 0 && (
          <button 
            onClick={handleBulkDelete}
            className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            Padam Terpilih ({selectedIds.size})
          </button>
        )}
        <button 
          onClick={onExportExcel}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ml-auto"
        >
          📥 Export CSV
        </button>
      </div>

      <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">
            <tr>
              <th className="p-4 border-b border-slate-200 dark:border-slate-700 w-10 text-center">
                <input 
                  type="checkbox" 
                  checked={selectedIds.size === filteredAndSortedReceipts.length && filteredAndSortedReceipts.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="p-4 border-b border-slate-200 dark:border-slate-700 font-medium">No. Dokumen</th>
              <th className="p-4 border-b border-slate-200 dark:border-slate-700 font-medium">Tarikh</th>
              <th className="p-4 border-b border-slate-200 dark:border-slate-700 font-medium">Pelanggan</th>
              <th className="p-4 border-b border-slate-200 dark:border-slate-700 font-medium">Jenis</th>
              <th className="p-4 border-b border-slate-200 dark:border-slate-700 font-medium text-right">Jumlah (RM)</th>
              <th className="p-4 border-b border-slate-200 dark:border-slate-700 font-medium text-right">Baki (RM)</th>
              <th className="p-4 border-b border-slate-200 dark:border-slate-700 font-medium text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50 bg-white dark:bg-slate-800">
            {filteredAndSortedReceipts.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400">
                  Tiada rekod dijumpai.
                </td>
              </tr>
            ) : (
              filteredAndSortedReceipts.map(receipt => {
                const baki = receipt.bakiTerdahulu - receipt.jumlah;
                return (
                  <tr key={receipt.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 text-slate-800 dark:text-slate-300 transition-colors group">
                    <td className="p-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(receipt.id)}
                        onChange={() => handleSelectOne(receipt.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-4 font-medium text-slate-900 dark:text-slate-100">{receipt.id}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">{format(new Date(receipt.tarikh), 'dd MMM yyyy')}</td>
                    <td className="p-4 font-medium">{receipt.nama}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium tracking-wide uppercase ${
                        receipt.paymentMethod === 'CASH' ? 'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                        receipt.paymentMethod === 'TRANSFER' ? 'bg-blue-100/50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                        'bg-purple-100/50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400'
                      }`}>
                        {receipt.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono">{formatCurrency(receipt.jumlah)}</td>
                    <td className="p-4 text-right font-mono text-slate-500 dark:text-slate-400">{formatCurrency(baki)}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
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
                          onClick={() => onPrint(receipt)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded transition-colors"
                          title="Print"
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
