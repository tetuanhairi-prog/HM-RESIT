export interface LineItem {
  description: string;
  amount: number;
}

export interface Receipt {
  id: string; // e.g., HMA-2026-0001
  documentType?: string; // e.g., RESIT, INVOICE
  tarikh: string;
  kategori: string;
  paymentMethod: string;
  nama: string;
  alamat: string;
  item: string;
  jumlah: number;
  items?: LineItem[];
  bakiTerdahulu: number;
  butiran: string;
  timestamp: string;
}

export type SortOption = 
  | 'latest' 
  | 'oldest' 
  | 'amount-asc' 
  | 'amount-desc' 
  | 'name-asc' 
  | 'name-desc';
