'use client';

export default function PaymentProofThumbnail({ paymentProof }: { paymentProof: string }) {
    if (!paymentProof) return null;

    return (
        <div className="mt-2 text-right">
            <span className="text-[10px] text-gray-400 block mb-1">Payment Proof</span>
            <a href={paymentProof} target="_blank" rel="noreferrer" className="block w-16 h-16 rounded overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:ring-2 hover:ring-blue-500 transition-all relative group bg-gray-50 dark:bg-gray-800">
                <img
                    src={paymentProof}
                    alt="Proof"
                    className="object-cover w-full h-full"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                />
                <div className="hidden absolute inset-0 flex items-center justify-center flex-col p-1 text-[8px] font-bold text-gray-500 text-center uppercase">
                    <svg className="w-4 h-4 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    View File
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </a>
        </div>
    );
}
