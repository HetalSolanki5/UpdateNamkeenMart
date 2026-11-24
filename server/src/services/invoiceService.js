
import Invoice from '../models/Invoice.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import puppeteer from 'puppeteer';

// Create Invoice
export const createInvoice = async (orderId, userId) => {
    const order = await Order.findById(orderId);

    if (!order) {
        throw new Error('Order not found');
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    // Check existing invoice
    const existingInvoice = await Invoice.findOne({ orderId });

    if (existingInvoice) {
        return existingInvoice;
    }

    const invoiceNumber = `INV-${Date.now()}`;

    const invoice = await Invoice.create({
        invoiceNumber,
        orderId,
        userId,
        totalAmount: order.totalAmount,
        invoiceDate: new Date()
    });

    return invoice;
};


// Get All Invoices
export const getAllInvoices = async () => {
    return await Invoice.find()
        .populate('orderId')
        .populate('userId', 'name email phone')
        .sort({ createdAt: -1 });
};


// Get Invoice By ID
export const getInvoiceById = async (invoiceId) => {
    const invoice = await Invoice.findById(invoiceId)
        .populate('orderId')
        .populate('userId', 'name email phone');

    if (!invoice) {
        throw new Error('Invoice not found');
    }

    return invoice;
};


// Get Invoice By Order ID
export const getInvoiceByOrderId = async (orderId) => {
    const invoice = await Invoice.findOne({ orderId })
        .populate('orderId')
        .populate('userId', 'name email phone');

    if (!invoice) {
        throw new Error('Invoice not found');
    }

    return invoice;
};


// Generate Invoice PDF
export const generatePdf = async (invoiceId) => {
    const invoice = await getInvoiceById(invoiceId);

    const user = invoice.userId;

    const order = invoice.orderId;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${invoice.invoiceNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 30px;
          color: #333;
        }

        .header {
          text-align: center;
          border-bottom: 2px solid #c92323;
          padding-bottom: 15px;
        }

        h1 {
          color: #c92323;
        }

        .details {
          margin-top: 30px;
          line-height: 1.8;
        }

        .amount {
          margin-top: 30px;
          text-align: right;
          font-size: 20px;
          font-weight: bold;
        }

        .footer {
          margin-top: 60px;
          text-align: center;
          color: #777;
        }
      </style>
    </head>

    <body>
      <div class="header">
        <h1>Aum Rameshwar Namkeen</h1>
        <h2>INVOICE</h2>
      </div>

      <div class="details">
        <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
        <p><strong>Invoice Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</p>
        <p><strong>Customer Name:</strong> ${user.name}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Phone:</strong> ${user.phone}</p>
        <p><strong>Order ID:</strong> ${order._id}</p>
      </div>

      <div class="amount">
        Total Amount: ₹${invoice.totalAmount}
      </div>

      <div class="footer">
        Thank you for shopping with Aum Rameshwar Namkeen!
      </div>
    </body>
    </html>
  `;

    const browser = await puppeteer.launch({
        headless: true
    });

    try {
        const page = await browser.newPage();

        await page.setContent(html, {
            waitUntil: 'networkidle0'
        });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true
        });

        return pdfBuffer;
    } finally {
        await browser.close();
    }
};


// Delete Invoice
export const deleteInvoice = async (invoiceId) => {
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
        throw new Error('Invoice not found');
    }

    await Invoice.findByIdAndDelete(invoiceId);

    return {
        message: 'Invoice deleted successfully'
    };
};


// Default Export
const invoiceService = {
    createInvoice,
    getAllInvoices,
    getInvoiceById,
    getInvoiceByOrderId,
    generatePdf,
    deleteInvoice
};

export default invoiceService;
