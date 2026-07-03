import { useState } from "react";
import { buildUpiLink, openPaymentApp } from "../utils/paymentLinks";

export default function PaymentLinkButton({ toUserName, toUpiId, amount, note = "Splitwise settlement" }) {
  const [showOptions, setShowOptions] = useState(false);

  const handleUpiPay = () => {
    const link = buildUpiLink(toUpiId || "user@upi", amount, note, toUserName);
    openPaymentApp(link);
  };

  const handleVenmoPay = () => {
    const safeAmount = parseFloat(amount) || 0;
    const link = `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(toUserName)}&amount=${safeAmount.toFixed(2)}&note=${encodeURIComponent(note)}`;
    openPaymentApp(link);
  };

  const handlePaypalPay = () => {
    const safeAmount = parseFloat(amount) || 0;
    const link = `paypal://xmoney/request?receiver=${encodeURIComponent(toUserName)}&amount=${safeAmount.toFixed(2)}&note=${encodeURIComponent(note)}`;
    openPaymentApp(link);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center gap-1.5 bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Pay
      </button>

      {showOptions && (
        <div className="absolute right-0 top-full mt-1 bg-white border rounded-xl shadow-lg z-50 w-56 p-2 space-y-1">
          <p className="text-xs text-gray-400 px-2 py-1">Pay {toUserName}</p>

          <button
            onClick={() => { handleUpiPay(); setShowOptions(false); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left"
          >
            <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">U</span>
            <div>
              <p className="text-sm font-medium text-gray-800">UPI Apps</p>
              <p className="text-xs text-gray-400">Google Pay, PhonePe, Paytm</p>
            </div>
          </button>

          <button
            onClick={() => { handleVenmoPay(); setShowOptions(false); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left"
          >
            <span className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 text-xs font-bold">V</span>
            <div>
              <p className="text-sm font-medium text-gray-800">Venmo</p>
              <p className="text-xs text-gray-400">Pay via Venmo</p>
            </div>
          </button>

          <button
            onClick={() => { handlePaypalPay(); setShowOptions(false); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left"
          >
            <span className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 text-xs font-bold">P</span>
            <div>
              <p className="text-sm font-medium text-gray-800">PayPal</p>
              <p className="text-xs text-gray-400">Pay via PayPal</p>
            </div>
          </button>

          <button
            onClick={() => setShowOptions(false)}
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-1"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
