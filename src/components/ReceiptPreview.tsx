import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { Receipt } from '../types';

interface ReceiptPreviewProps {
  data: Partial<Receipt>;
}

const ReceiptPreview = forwardRef<HTMLDivElement, ReceiptPreviewProps>(({ data }, ref) => {
  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return '0.00';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const bakiTerkini = (data.bakiTerdahulu || 0) - (data.jumlah || 0);
  const formattedDate = data.tarikh ? format(new Date(data.tarikh), 'dd.MM.yyyy') : '-';

  return (
    <div 
      ref={ref}
      className="p-6 md:p-8 flex-1 min-h-[600px] flex flex-col w-full mx-auto print:p-0 print:max-w-none print:w-full"
      style={{ color: '#000000', backgroundColor: '#ffffff' }}
    >
      <table className="w-full h-full">
        <thead className="table-header-group">
          <tr>
            <td>
              <div className="flex items-center border-b-2 pb-4 mb-4 gap-4" style={{ borderColor: '#000000' }}>
                <img 
                  src="https://arleta.site/interactivelink/2510/logo.png" 
                  alt="Logo" 
                  className="h-[70px] w-auto shrink-0"
                  crossOrigin="anonymous"
                />
                <div className="text-left">
                  <h1 className="text-lg font-bold mb-1">TETUAN HAIRI MUSTAFA & ASSOCIATES</h1>
                  <p className="text-xs m-0 leading-tight">PEGUAM SYARIE * PESURUHJAYA SUMPAH</p>
                  <p className="text-xs m-0 leading-tight">LOT 02, BANGUNAN ARKED MARA, 09100 BALING, KEDAH</p>
                  <p className="text-xs m-0 leading-tight">TEL: 010-2434143 / 011-56531310 | EMAIL: tetuanhairi@gmail.com</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between text-sm mb-4 gap-4 text-left">
                <div className="flex-1">
                  <strong className="block mb-1 uppercase" style={{ textTransform: 'uppercase' }}>NO. {data.documentType || 'RESIT'}: <span>{data.id || '-'}</span></strong>
                  <strong className="block mt-2">PELANGGAN:</strong>
                  <span className="text-xs block">{data.kategori || '-'}</span>
                  <span className="font-bold text-lg block my-1">{data.nama || '-'}</span>
                  <span className="block whitespace-pre-wrap">{data.alamat || '-'}</span>
                </div>
                <div className="text-right">
                  <strong>TARIKH:</strong> <span>{formattedDate}</span><br />
                  <strong className="block mt-1">CARA BAYARAN:</strong> <span>{data.paymentMethod || '-'}</span>
                </div>
              </div>

              <div className="text-center text-2xl font-bold underline my-4 uppercase" style={{ textTransform: 'uppercase' }}>{data.documentType || 'RESIT'}</div>
            </td>
          </tr>
        </thead>
        <tbody className="align-top">
          <tr>
            <td>
              <table className="w-full border-collapse mb-4 text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>
                    <th className="p-2 border text-left font-semibold" style={{ borderColor: '#000000' }}>ITEM / PERKARA</th>
                    <th className="p-2 border text-right font-semibold w-1/4" style={{ borderColor: '#000000' }}>JUMLAH (RM)</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.items && data.items.length > 0 ? data.items : [{ description: data.item || '-', amount: data.jumlah || 0 }]).map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2 border text-left" style={{ borderColor: '#000000' }}>{item.description || '-'}</td>
                      <td className="p-2 border text-right" style={{ borderColor: '#000000' }}>{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex flex-col sm:flex-row justify-between text-left text-sm font-semibold gap-4 mb-6">
                <div>
                  <p className="m-1">BUTIRAN KES: <span className="underline">{data.butiran || '-'}</span></p>
                </div>
                <div className="text-right">
                  <p className="m-1">JUMLAH BAYARAN: RM <span>{formatCurrency(data.jumlah)}</span></p>
                  <p className="m-1">BAKI TERDAHULU: RM <span>{formatCurrency(data.bakiTerdahulu)}</span></p>
                  <p className="m-1 border-t pt-1 mt-2" style={{ borderColor: '#000000' }}>BAKI TERKINI: RM <span>{formatCurrency(bakiTerkini)}</span></p>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
        <tfoot className="table-footer-group align-bottom">
          <tr>
            <td>
              <div className="flex justify-start items-start mt-8 border-t pt-5 text-left" style={{ borderColor: '#000000' }}>
                <div className="text-center w-[220px]">
                  <div className="h-[70px] flex items-center justify-center mb-2">
                    <img 
                      src="https://arleta.site/interactivelink/2510/cop-bulat.png" 
                      alt="Cop Rasmi" 
                      className="max-h-[65px] w-auto"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div className="font-bold text-sm mb-1">HAIRI MUSTAFA & ASSOCIATES</div>
                  <div className="text-xs" style={{ color: '#475569' }}>Peguam Syarie & Pesuruhjaya Sumpah</div>
                </div>
              </div>

              <div className="text-center text-[0.7rem] pt-4 mt-4 border-t border-dashed leading-tight" style={{ color: '#64748b', borderColor: '#cbd5e1' }}>
                <p>Resit ini dijana oleh komputer, terima kasih atas urusan anda</p>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
});

ReceiptPreview.displayName = 'ReceiptPreview';

export default ReceiptPreview;
