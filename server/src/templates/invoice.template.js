/**
 * Generates clean, printer-friendly HTML for tax invoice
 * @param {Object} data Invoice data
 * @returns {string} HTML string
 */
export const invoiceHtml = (data) => {
  const {
    invoiceNumber,
    orderNumber,
    invoiceDate,
    billedBy = {
      name: 'Rameshwar Namkeen',
      tagline: 'Authentic Taste of Gujarat',
      address: 'Plot No. 12, GIDC Industrial Estate, Rajkot, Gujarat - 360003',
      phone: '+91 98765 43210',
      email: 'sales@ramshewarnamkeen.com',
      gstin: '24AAACR1234M1Z5'
    },
    shippedTo,
    customerName,
    phone,
    address,
    items = [],
    deliveryCharge = 0,
    totalAmount = 0,
    paymentMethod,
    paymentStatus,
    appliedCartOfferName,
    cartDiscountAmount
  } = data;

  const deliveryInfo = shippedTo || {
    receiverName: customerName || 'Valued Customer',
    phone: phone || 'N/A',
    address: address || 'Address on file'
  };

  const formattedDate = invoiceDate
    ? new Date(invoiceDate).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
    : new Date().toLocaleDateString('en-IN');

  const rows = items
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #eeeeee;">
        <td style="padding: 10px 12px; font-size: 13px; color: #333333;">
          ${idx + 1}. ${item.productName}
          ${item.appliedOfferName
          ? `<div style="font-size: 11px; color: #777777; margin-top: 3px;">Offer applied: ${item.appliedOfferName}</div>`
          : ''
        }
        </td>
        <td style="padding: 10px 12px; font-size: 13px; color: #555555;">${item.variant}</td>
        <td style="padding: 10px 12px; font-size: 13px; text-align: center; color: #333333;">${item.quantity}</td>
        <td style="padding: 10px 12px; font-size: 13px; text-align: right; color: #333333;">₹${item.unitPrice.toFixed(2)}</td>
        <td style="padding: 10px 12px; font-size: 13px; text-align: right; font-weight: 600; color: #222222;">₹${item.subtotal.toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${invoiceNumber}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    }
    body {
      background-color: #ffffff;
      color: #333333;
      padding: 30px;
    }
    .header {
      background-color: #C62828;
      color: #ffffff;
      padding: 24px;
      border-radius: 8px 8px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 1px;
    }
    .brand-subtitle {
      font-size: 12px;
      color: #ffcccc;
      margin-top: 4px;
    }
    .invoice-title {
      font-size: 20px;
      font-weight: bold;
      text-align: right;
    }
    .meta-box {
      background-color: #fdfdfd;
      border: 1px solid #eeeeee;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      gap: 20px;
    }
    .meta-col {
      flex: 1;
      font-size: 12px;
      line-height: 1.6;
    }
    .meta-heading {
      font-size: 13px;
      font-weight: bold;
      color: #8E1B1B;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .sections-box {
      margin-top: 16px;
      background-color: #fafafa;
      border: 1px solid #eeeeee;
      border-radius: 6px;
      padding: 18px 20px;
      display: flex;
      justify-content: space-between;
      gap: 24px;
    }
    .section-col {
      flex: 1;
      font-size: 12px;
      line-height: 1.6;
    }
    .section-heading {
      font-size: 12px;
      font-weight: bold;
      color: #8E1B1B;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .table-container {
      margin-top: 20px;
      border: 1px solid #eeeeee;
      border-radius: 4px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background-color: #8E1B1B;
      color: #ffffff;
      padding: 10px 12px;
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .totals-area {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
    .totals-box {
      width: 280px;
      border: 1px solid #eeeeee;
      border-radius: 4px;
      padding: 14px;
      background-color: #fafafa;
      font-size: 13px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .grand-total {
      border-top: 2px solid #C62828;
      padding-top: 8px;
      font-size: 16px;
      font-weight: 900;
      color: #C62828;
    }
    .payment-badge {
      display: inline-block;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: bold;
      border-radius: 4px;
      text-transform: uppercase;
      background-color: #e6f4ea;
      color: #137333;
    }
    .footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 1px dashed #dddddd;
      text-align: center;
      font-size: 11px;
      color: #888888;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand-title">RAMESHWAR NAMKEEN</div>
      <div class="brand-subtitle">Authentic Taste of Gujarat</div>
    </div>
    <div class="invoice-title">
      TAX INVOICE
    </div>
  </div>

  <div class="meta-box">
    <div class="meta-col">
      <div class="meta-heading">Invoice Details</div>
      <div><strong>Invoice No:</strong> ${invoiceNumber}</div>
      <div><strong>Order No:</strong> ${orderNumber}</div>
      <div><strong>Date:</strong> ${formattedDate}</div>
    </div>
    <div class="meta-col">
      <div class="meta-heading">Payment Information</div>
      <div><strong>Method:</strong> ${(paymentMethod || 'N/A').toUpperCase()}</div>
      <div><strong>Status:</strong> <span class="payment-badge">${(paymentStatus || 'PENDING').toUpperCase()}</span></div>
    </div>
  </div>

  <div class="sections-box">
    <div class="section-col">
      <div class="section-heading">Billed By</div>
      <div><strong>${billedBy.name || 'Rameshwar Namkeen'}</strong></div>
      ${billedBy.tagline ? `<div style="color: #666666; font-size: 11px;">${billedBy.tagline}</div>` : ''}
      <div>${billedBy.address || ''}</div>
      <div>Phone: ${billedBy.phone || ''}</div>
      <div>Email: ${billedBy.email || ''}</div>
      ${billedBy.gstin ? `<div><strong>GSTIN:</strong> ${billedBy.gstin}</div>` : ''}
    </div>
    <div class="section-col">
      <div class="section-heading">Shipped To</div>
      <div><strong>${deliveryInfo.receiverName}</strong></div>
      <div>Phone: ${deliveryInfo.phone}</div>
      <div style="margin-top: 2px;">${deliveryInfo.address}</div>
    </div>
  </div>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th style="text-align: left;">Product</th>
          <th style="text-align: left;">Pack / Variant</th>
          <th style="text-align: center; width: 60px;">Qty</th>
          <th style="text-align: right; width: 100px;">Unit Price</th>
          <th style="text-align: right; width: 110px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>

  <div class="totals-area">
    <div class="totals-box">
      ${appliedCartOfferName && cartDiscountAmount > 0 ? `
      <div class="totals-row" style="color: #065F46; font-size: 12px; font-weight: 600;">
        <span>Bulk order discount (${appliedCartOfferName}):</span>
        <span>-₹${cartDiscountAmount.toFixed(2)}</span>
      </div>
      ` : ''}
      <div class="totals-row">
        <span>Delivery Charge:</span>
        <span>${deliveryCharge === 0 ? 'FREE' : '₹' + deliveryCharge.toFixed(2)}</span>
      </div>
      <div class="totals-row grand-total">
        <span>Total Amount:</span>
        <span>₹${totalAmount.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Thank you for shopping with Rameshwar Namkeen!</p>
    <p style="margin-top: 4px;">This is a computer-generated tax invoice and requires no signature.</p>
  </div>
</body>
</html>
  `.trim();
};
