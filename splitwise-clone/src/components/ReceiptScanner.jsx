import { useState, useRef, useEffect } from "react";
import { formatCurrency } from "../utils/currency";

const DEMO_RECEIPTS = [
  {
    name: "Spice Garden Restaurant",
    date: new Date().toISOString(),
    items: [
      { name: "Butter Chicken", price: 320 },
      { name: "Naan (2)", price: 80 },
      { name: "Paneer Tikka", price: 280 },
      { name: "Jeera Rice", price: 120 },
      { name: "Gulab Jamun", price: 90 },
    ],
    tax: 89,
    total: 979,
  },
  {
    name: "Quick Mart Groceries",
    date: new Date().toISOString(),
    items: [
      { name: "Milk (1L)", price: 62 },
      { name: "Bread", price: 40 },
      { name: "Eggs (12)", price: 84 },
      { name: "Rice (2kg)", price: 180 },
      { name: "Cooking Oil", price: 150 },
    ],
    tax: 0,
    total: 516,
  },
];

export default function ReceiptScanner({ onItemsScanned }) {
  const [step, setStep] = useState("capture");
  const [editedItems, setEditedItems] = useState([]);
  const [restaurantName, setRestaurantName] = useState("");
  const [tax, setTax] = useState("");
  const [scanning, setScanning] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const fileInputRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = () => {
    simulateScan();
  };

  const simulateScan = () => {
    setScanning(true);
    setStep("scanning");

    setTimeout(() => {
      const demo = DEMO_RECEIPTS[Math.floor(Math.random() * DEMO_RECEIPTS.length)];
      setReceipt(demo);
      setRestaurantName(demo.name);
      setEditedItems(demo.items.map((item, i) => ({ ...item, id: i, assignedTo: "" })));
      setTax(demo.tax.toString());
      setScanning(false);
      setStep("review");
    }, 2000);
  };

  const useDemoReceipt = () => {
    setScanning(true);
    setStep("scanning");
    setTimeout(() => {
      const demo = DEMO_RECEIPTS[0];
      setReceipt(demo);
      setRestaurantName(demo.name);
      setEditedItems(demo.items.map((item, i) => ({ ...item, id: i, assignedTo: "" })));
      setTax(demo.tax.toString());
      setScanning(false);
      setStep("review");
    }, 1500);
  };

  const updateItem = (id, field, value) => {
    setEditedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (id) => {
    setEditedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addItem = () => {
    setEditedItems((prev) => [
      ...prev,
      { id: Date.now(), name: "", price: 0, assignedTo: "" },
    ]);
  };

  const subtotal = editedItems.reduce((s, item) => s + (parseFloat(item.price) || 0), 0);
  const totalWithTax = subtotal + (parseFloat(tax) || 0);

  const confirmItems = () => {
    onItemsScanned?.({
      restaurant: restaurantName,
      items: editedItems.map(({ id: _id, ...rest }) => rest),
      subtotal,
      tax: parseFloat(tax) || 0,
      total: totalWithTax,
    });
    setStep("done");
  };

  if (step === "done") {
    return (
      <div className="bg-green-50 rounded-2xl p-6 text-center">
        <p className="text-4xl mb-2">✓</p>
        <p className="font-bold text-green-700">Receipt scanned successfully!</p>
        <p className="text-sm text-green-600 mt-1">{editedItems.length} items added</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {step === "capture" && (
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>

          <h3 className="font-bold text-gray-800 mb-1">Scan Receipt</h3>
          <p className="text-sm text-gray-500 mb-4">
            Take a photo or upload a receipt image
          </p>

          <div className="space-y-2">
            <button
              onClick={handleCapture}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition-colors"
            >
              📷 Take Photo
            </button>
            <button
              onClick={handleCapture}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              📁 Upload Image
            </button>
            <button
              onClick={useDemoReceipt}
              className="w-full bg-blue-50 text-blue-600 py-3 rounded-lg font-medium hover:bg-blue-100 transition-colors"
            >
              🧾 Try Demo Receipt
            </button>
          </div>
        </div>
      )}

      {step === "scanning" && (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-gray-800">Scanning receipt...</p>
          <p className="text-sm text-gray-500 mt-1">Reading items and totals</p>
        </div>
      )}

      {step === "review" && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">Review Scanned Items</h3>
            <button onClick={() => setStep("capture")} className="text-sm text-gray-400 hover:text-gray-600">
              Rescan
            </button>
          </div>

          <div className="mb-4">
            <label className="text-xs text-gray-500 block mb-1">Restaurant / Store</label>
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div className="space-y-2 mb-4">
            {editedItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, "name", e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Item name"
                />
                <div className="relative w-24">
                  <span className="absolute left-2 top-2 text-gray-400 text-xs">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => updateItem(item.id, "price", parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-2 py-2 border rounded-lg text-sm text-right focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
                <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 p-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <button onClick={addItem} className="w-full text-sm text-green-600 hover:text-green-700 font-medium py-2 border border-dashed border-green-300 rounded-lg mb-4">
            + Add Item
          </button>

          <div className="border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-800">{formatCurrency(subtotal, "INR")}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Tax</span>
              <div className="flex items-center gap-1">
                <span className="text-gray-400">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  className="w-20 px-2 py-1 border rounded text-right text-sm focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-1">
              <span>Total</span>
              <span>{formatCurrency(totalWithTax, "INR")}</span>
            </div>
          </div>

          <button
            onClick={confirmItems}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-bold hover:bg-green-600 transition-colors mt-4"
          >
            Use These Items
          </button>
        </div>
      )}
    </div>
  );
}
