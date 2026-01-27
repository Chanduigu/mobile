'use client';

import Link from 'next/link';

const printStyles = `
@media print {
    .no-print {
        display: none !important;
    }
    body {
        background: white !important;
        color: black !important;
    }
    @page {
        margin: 0.5cm;
    }
}
`;

type Props = {
    order: any;
    items: any[];
    store: any;
    previousBalance?: number;
};

export default function InvoiceView({ order, items, store, previousBalance = 0 }: Props) {
    const currentBillTotal = order.totalAmount;
    const paidAmount = order.paidAmount;

    // Total Due = Current Bill + Previous Outstanding
    const totalDue = currentBillTotal + previousBalance;

    // Remaining Balance = Total Due - Paid Amount
    const balance = totalDue - paidAmount;

    const paymentStatus = balance === 0 ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Pending');

    const waText = `*INVOICE - SAPTHAGIRI FOODS*%0A` +
        `Store: ${store.name}%0A` +
        `Date: ${new Date(order.date).toLocaleDateString()}%0A` +
        `%0A*Items:*%0A` +
        items.map((i: any, idx: number) => `${i.name} x ${i.quantity} = ₹${i.quantity * i.price}`).join('%0A') +
        `%0A%0A*Current Bill: ₹${currentBillTotal}*%0A` +
        (previousBalance > 0 ? `Previous Balance: ₹${previousBalance}%0A` : '') +
        `*Total Due: ₹${totalDue}*%0A` +
        `Paid: ₹${paidAmount} (${order.paymentMethod || 'Cash'})%0A` +
        `*Remaining Balance: ₹${balance}*%0A` +
        `Status: ${paymentStatus}%0A` +
        `%0AThank you!`;

    // Static QR Code from uploaded image
    const qrUrl = '/images/phonepe-qr.jpg';

    return (
        <div className="max-w-md mx-auto bg-white text-black p-4 rounded-lg shadow-lg border border-gray-200 print:shadow-none print:border-none print:max-w-none print:w-full print:p-0">
            <style>{printStyles}</style>

            {/* Header Section matching 'SAPTHAGIRI FOODS' bill */}
            <div className="text-center mb-2 border-b-2 border-orange-600 pb-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-600 px-1 mb-1">
                    <span className="border border-gray-400 px-1 rounded bg-gray-50">CASH BILL</span>
                    <div className="text-right leading-tight">
                        <div>Mob: <span className="text-black">92421 43039</span></div>
                        <div><span className="text-black">81234 63039</span></div>
                        <div><span className="text-black">90088 76036</span></div>
                    </div>
                </div>

                <h1 className="text-3xl font-extrabold uppercase text-orange-600 tracking-wider mb-0 font-heading" style={{ textShadow: '0.5px 0.5px 0px rgba(0,0,0,0.1)' }}>
                    SAPTHAGIRI FOODS
                </h1>

                <div className="bg-orange-600 text-white text-[9px] font-bold py-1 px-2 mb-1 rounded-sm tracking-wide inline-block w-full">
                    Mfrs of: PAPAD, PANI PURI PURI, READY TO EAT CHAPATHI, SAVOURIES ETC.
                </div>

                <p className="text-[10px] text-gray-600 font-semibold px-4">
                    687/1/58/1, Shivanahalli, Jakkur Main Road, Yelahanka, Bengaluru - 560064.
                </p>

                <div className="flex justify-between items-end mt-2 text-sm text-gray-800 font-bold border-t border-orange-200 pt-1 px-1">
                    <span>No: <span className="text-red-600 font-mono text-lg">{order.id.slice(0, 6).toUpperCase()}</span></span>
                    <span>Date: <span className="font-medium text-black">{new Date(order.date).toLocaleDateString()}</span></span>
                </div>
            </div>

            {/* Customer Details */}
            <div className="mb-4 text-sm border-b border-dotted border-gray-300 pb-2">
                <div className="flex items-start">
                    <span className="font-bold w-10 text-gray-500 mt-1">M/s.</span>
                    <div className="flex-1 font-bold text-lg leading-tight px-1 uppercase text-black break-words">
                        {store.name}
                    </div>
                </div>
                {store.address && (
                    <div className="ml-10 text-[11px] text-gray-500 leading-tight">{store.address}</div>
                )}
            </div>

            {/* Items Table */}
            <div className="border border-gray-300 min-h-[300px] flex flex-col mb-2 rounded-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-orange-50/50 border-b border-gray-300 text-gray-700 text-[10px] uppercase tracking-wide">
                            <th className="w-8 border-r border-gray-300 py-1.5 font-bold">SN</th>
                            <th className="text-left border-r border-gray-300 px-2 py-1.5 font-bold">Item Name</th>
                            <th className="w-10 text-right border-r border-gray-300 px-1 py-1.5 font-bold">Qty</th>
                            <th className="w-14 text-right border-r border-gray-300 px-1 py-1.5 font-bold">Rate</th>
                            <th className="w-16 text-right px-2 py-1.5 font-bold">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {items.map((item: any, index: number) => (
                            <tr key={item.id || index} className="text-black text-xs font-semibold">
                                <td className="text-center border-r border-gray-300 py-1.5">{index + 1}</td>
                                <td className="border-r border-gray-300 px-2 py-1.5">{item.name}</td>
                                <td className="text-right border-r border-gray-300 px-1 py-1.5">{item.quantity}</td>
                                <td className="text-right border-r border-gray-300 px-1 py-1.5">{item.price}</td>
                                <td className="text-right px-2 py-1.5">{(item.quantity * item.price).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="mt-auto border-t border-gray-300">
                    <div className="flex justify-between items-center bg-gray-50 px-2 py-2">
                        <span className="font-bold text-xs uppercase text-gray-500">Bill Total</span>
                        <span className="font-bold text-lg">₹{currentBillTotal}</span>
                    </div>
                </div>
            </div>

            {/* Summary / Payment Info */}
            <div className="space-y-1 mb-6 text-sm bg-gray-50/50 p-2 rounded border border-gray-100">
                {previousBalance > 0 && (
                    <div className="flex justify-between text-yellow-700 font-semibold px-1 text-xs">
                        <span>Previous Balance (+)</span>
                        <span>₹{previousBalance}</span>
                    </div>
                )}
                {(previousBalance > 0) && (
                    <div className="flex justify-between font-bold text-sm px-1 border-t border-dashed border-gray-300 pt-1 mt-1">
                        <span>Grand Total Due</span>
                        <span>₹{totalDue}</span>
                    </div>
                )}
                <div className="flex justify-between text-green-700 font-semibold px-1 mt-1">
                    <span>Paid Amount ({order.paymentMethod === 'upi' ? 'UPI' : 'Cash'}) (-)</span>
                    <span>₹{paidAmount}</span>
                </div>

                <div className="flex justify-between items-center text-red-600 font-bold border-t border-gray-300 pt-2 mt-2 px-1">
                    <span className="text-sm uppercase tracking-wide">Balance Due</span>
                    <span className="text-xl">₹{balance}</span>
                </div>
            </div>

            {/* Footer Signatures */}
            <div className="flex justify-between items-end mt-4 mb-2 pt-4 px-2 text-[10px] text-gray-700 font-bold">
                <div className="text-center w-24">
                    <span className="block mb-6 text-gray-300">__________________</span>
                    <div className="">Receiver's Signature</div>
                </div>
                <div className="text-center w-32">
                    <div className="mb-6 font-serif italic text-xs">Sapthagiri Foods</div>
                    <span className="block text-gray-300 mb-0.5">__________________</span>
                    <div className="">Authorised Signatory</div>
                </div>
            </div>

            <p className="text-center text-[10px] font-medium text-gray-400 mt-4 italic">Thank you for your business!</p>

            <div className="text-center text-xs font-bold text-gray-500 mb-6 mt-4 no-print space-y-2">
                <a
                    href={`https://wa.me/?text=${waText}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white py-3 rounded-lg font-bold hover:bg-[#128C7E] transition-colors shadow-sm"
                >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                    Send Invoice on WhatsApp
                </a>

                <button
                    onClick={() => typeof window !== 'undefined' && window.print()}
                    className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white text-center py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print / Download PDF
                </button>
            </div>
            <Link
                href="/driver"
                className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white text-center py-4 rounded-lg font-bold hover:bg-black transition-colors shadow-lg mt-4 animate-pulse"
            >
                Return to Route
            </Link>
        </div>
    );
}
