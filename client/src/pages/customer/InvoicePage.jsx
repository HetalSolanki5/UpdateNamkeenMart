import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getInvoiceJson, downloadInvoicePdf } from '../../api/invoiceApi.js';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';

const InvoicePage = () => {
  const { orderId } = useParams();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getInvoiceJson(orderId);
        setInvoice(data?.invoice || data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load invoice.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [orderId]);

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    setDownloading(true);
    try {
      await downloadInvoicePdf(orderId, invoice.invoiceNumber);
    } catch (err) {
      alert('Failed to download invoice PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Loader message="Loading tax invoice..." />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <EmptyState message={error || 'Invoice not found.'} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      {/* Non-print Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
        <div>
          <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
            <Link to="/customer/orders" className="hover:text-[#C62828]">&larr; My Orders</Link>
            <span>/</span>
            <span>Invoice {invoice.invoiceNumber}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">
            Tax Invoice Preview
          </h1>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:text-black text-xs font-bold rounded-lg transition shadow-xs"
          >
            Print Invoice
          </button>
          <button
            disabled={downloading}
            onClick={handleDownloadPdf}
            className="px-4 py-2 bg-[#C62828] hover:bg-[#8E1B1B] text-white text-xs font-bold rounded-lg transition shadow-xs disabled:opacity-50"
          >
            {downloading ? 'Downloading...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden print:border-none print:shadow-none print:m-0">
        {/* Brand Header Banner */}
        <div className="bg-[#C62828] text-white p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-wider uppercase">
              RAMESHWAR NAMKEEN
            </h2>
            <p className="text-xs text-white/80 mt-1">Authentic Taste of Gujarat</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs uppercase tracking-widest text-white/70 block">Official Document</span>
            <span className="text-xl font-black">TAX INVOICE</span>
          </div>
        </div>

        {/* Invoice Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 sm:p-8 bg-gray-50/50 border-b border-gray-200 text-xs">
          <div>
            <h4 className="font-bold text-[#8E1B1B] uppercase text-[11px] mb-2 tracking-wider">
              Invoice Details
            </h4>
            <div className="space-y-1 text-gray-700">
              <p><strong>Invoice No:</strong> {invoice.invoiceNumber}</p>
              <p><strong>Order No:</strong> {invoice.orderNumber}</p>
              <p>
                <strong>Date:</strong>{' '}
                {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-[#8E1B1B] uppercase text-[11px] mb-2 tracking-wider">
              Payment Status
            </h4>
            <div className="space-y-1 text-gray-700">
              <p><strong>Method:</strong> {invoice.paymentMethod?.toUpperCase()}</p>
              <p>
                <strong>Status:</strong>{' '}
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                  {invoice.paymentStatus}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Phase 12C: Simplified to 2 Sections: "Billed By" and "Shipped To" (Billed To removed) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 sm:p-8 bg-white border-b border-gray-100 text-xs">
          <div>
            <h4 className="font-bold text-[#8E1B1B] uppercase text-[11px] mb-2 tracking-wider">
              Billed By
            </h4>
            <div className="space-y-1 text-gray-700">
              <p className="font-bold text-gray-900">{invoice.billedBy?.name || 'Rameshwar Namkeen'}</p>
              {invoice.billedBy?.tagline && (
                <p className="text-gray-500 text-[11px]">{invoice.billedBy.tagline}</p>
              )}
              <p className="leading-relaxed">
                {invoice.billedBy?.address || 'Plot No. 12, GIDC Industrial Estate, Rajkot, Gujarat - 360003'}
              </p>
              <p>Phone: {invoice.billedBy?.phone || '+91 98765 43210'}</p>
              <p>Email: {invoice.billedBy?.email || 'sales@ramshewarnamkeen.com'}</p>
              <p><strong>GSTIN:</strong> {invoice.billedBy?.gstin || '24AAACR1234M1Z5'}</p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-[#8E1B1B] uppercase text-[11px] mb-2 tracking-wider">
              Shipped To
            </h4>
            <div className="space-y-1 text-gray-700">
              <p className="font-bold text-gray-900">
                {invoice.shippedTo?.receiverName || invoice.customerName || 'Valued Customer'}
              </p>
              <p>Phone: {invoice.shippedTo?.phone || invoice.phone || 'N/A'}</p>
              <p className="leading-relaxed">
                {invoice.shippedTo?.address || invoice.address || 'Address on file'}
              </p>
            </div>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="p-6 sm:p-8">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#8E1B1B] text-white text-[11px] uppercase tracking-wider font-bold">
                <th className="py-3 px-4">Product Description</th>
                <th className="py-3 px-4">Pack Size</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {invoice.items?.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-semibold">{item.productName}</td>
                  <td className="py-3 px-4 text-gray-500">{item.variant}</td>
                  <td className="py-3 px-4 text-center">{item.quantity}</td>
                  <td className="py-3 px-4 text-right">₹{item.unitPrice?.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">
                    ₹{item.subtotal?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="mt-6 flex justify-end">
            <div className="w-full sm:w-72 bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charge:</span>
                <span className="font-semibold text-emerald-600">
                  {invoice.deliveryCharge === 0 ? 'FREE' : `₹${invoice.deliveryCharge?.toFixed(2)}`}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-black text-gray-900">
                <span>Total Amount:</span>
                <span className="text-[#C62828] text-base">₹{invoice.totalAmount?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-10 pt-4 border-t border-dashed border-gray-200 text-center text-[11px] text-gray-400">
            <p>Thank you for shopping with Rameshwar Namkeen!</p>
            <p className="mt-0.5">This is a computer-generated tax invoice and requires no physical signature.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;
