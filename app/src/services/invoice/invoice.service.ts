// src/renderer/services/invoice/invoice.service.ts
import { Sale } from '../api/sale.api';
import { StoreInfo } from '../api/store-info.api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

class InvoiceService {
  private storeInfo: StoreInfo | null = null;

  /**
   * Set store information (call this on app init or when settings change)
   */
  setStoreInfo(info: StoreInfo | null) {
    this.storeInfo = info;
  }

  /**
   * Get current store info
   */
  getStoreInfo(): StoreInfo | null {
    return this.storeInfo;
  }

  /**
   * Generate PDF Invoice with Store Info
   */
  generatePDF(sale: Sale): jsPDF {
    const doc = new jsPDF();
    let currentY = 20;
    const pageWidth = doc.internal.pageSize.width;

    // Store Logo (if exists)
    if (this.storeInfo?.logoUrl) {
      try {
      //  let currentY = 20;

        const logoUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/${this.storeInfo.logoUrl}`;
        doc.addImage(logoUrl, 'PNG', pageWidth / 2 - 15, currentY, 30, 30);
        currentY += 35;
      } catch (error) {
        console.warn('Failed to load logo:', error);
      }
    }

    // Store Name
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(this.storeInfo?.name || 'Store Name', pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;
    
    // Store Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(this.storeInfo?.address || 'Store Address', pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    doc.text(this.storeInfo?.phone || 'Phone Number', pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    
    if (this.storeInfo?.email) {
      doc.text(this.storeInfo.email, pageWidth / 2, currentY, { align: 'center' });
      currentY += 5;
    }
    
    // Line separator
    doc.setLineWidth(0.5);
    doc.line(10, currentY, pageWidth - 10, currentY);
    currentY += 7;
    
    // Invoice header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 10, currentY);
    currentY += 7;
    
    // Invoice details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${sale.id}`, 10, currentY);
    currentY += 5;
    doc.text(`Date: ${new Date(sale.createdAt).toLocaleString()}`, 10, currentY);
    currentY += 5;
    doc.text(`Cashier: ${sale.user.username}`, 10, currentY);
    currentY += 5;
    doc.text(`Payment: ${sale.paymentType}`, 10, currentY);
    currentY += 7;
    
    // Items table
    const tableData = sale.items.map(item => [
      item.product.name,
      `${item.product.size} / ${item.product.color}`,
      item.quantity.toString(),
      `$${item.price.toFixed(2)}`,
      item.discount > 0 ? `-$${item.discount.toFixed(2)}` : '-',
      `$${((item.price - item.discount) * item.quantity).toFixed(2)}`,
    ]);
    
    
    autoTable(doc, {
      startY: currentY,
      head: [['Item', 'Size/Color', 'Qty', 'Price', 'Discount', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 9 },
    });
    
    // Calculate totals
    const finalY = (doc as any).lastAutoTable.finalY || currentY;
    const subtotal = sale.items.reduce((sum, item) => 
      sum + (item.price - item.discount) * item.quantity, 0
    );
    
    // Totals section
    const totalsX = pageWidth - 70;
    currentY = finalY + 10;
    
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', totalsX, currentY);
    doc.text(`$${subtotal.toFixed(2)}`, totalsX + 40, currentY, { align: 'right' });
    
    if (sale.discount > 0) {
      currentY += 7;
      doc.text('Sale Discount:', totalsX, currentY);
      doc.text(`-$${sale.discount.toFixed(2)}`, totalsX + 40, currentY, { align: 'right' });
    }
    
    // Total
    currentY += 10;
    doc.setLineWidth(0.5);
    doc.line(totalsX, currentY - 3, pageWidth - 10, currentY - 3);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', totalsX, currentY);
    doc.text(`${sale.total.toFixed(2)}`, totalsX + 40, currentY, { align: 'right' });
    
    // Footer
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const footerY = doc.internal.pageSize.height - 20;
    doc.text('Thank you for your purchase!', pageWidth / 2, footerY, { align: 'center' });
    doc.text('For returns or exchanges, please bring this receipt.', pageWidth / 2, footerY + 5, { align: 'center' });
    
    return doc;
  }

  /**
   * Generate thermal receipt with Store Info
   */
  generateThermalReceipt(sale: Sale, width: 58 | 80 = 80): string {
    const lineWidth = width === 58 ? 32 : 42;
    
    const centerText = (text: string) => {
      const padding = Math.max(0, Math.floor((lineWidth - text.length) / 2));
      return ' '.repeat(padding) + text;
    };
    
    const rightAlign = (left: string, right: string) => {
      const spaces = Math.max(1, lineWidth - left.length - right.length);
      return left + ' '.repeat(spaces) + right;
    };
    
    let receipt = '\n';
    
    // Store name and details
    receipt += centerText(this.storeInfo?.name || 'Store Name') + '\n';
    receipt += centerText(this.storeInfo?.address || 'Store Address') + '\n';
    receipt += centerText(this.storeInfo?.phone || 'Phone') + '\n';
    
    if (this.storeInfo?.email) {
      receipt += centerText(this.storeInfo.email) + '\n';
    }
    
    receipt += '='.repeat(lineWidth) + '\n';
    receipt += rightAlign('Invoice #:', sale.id.toString()) + '\n';
    receipt += rightAlign('Date:', new Date(sale.createdAt).toLocaleString()) + '\n';
    receipt += rightAlign('Cashier:', sale.user.username) + '\n';
    receipt += rightAlign('Payment:', sale.paymentType) + '\n';
    receipt += '='.repeat(lineWidth) + '\n\n';
    
    // Items
    sale.items.forEach(item => {
      const name = item.product.name.substring(0, lineWidth - 2);
      receipt += name + '\n';
      
      const details = `  ${item.product.size}/${item.product.color}`;
      receipt += details + '\n';
      
      const qty = `  ${item.quantity} x ${item.price.toFixed(2)}`;
      const itemTotal = `${((item.price - item.discount) * item.quantity).toFixed(2)}`;
      receipt += rightAlign(qty, itemTotal) + '\n';
      
      if (item.discount > 0) {
        receipt += rightAlign('  Discount:', `-${item.discount.toFixed(2)}`) + '\n';
      }
      receipt += '\n';
    });
    
    receipt += '-'.repeat(lineWidth) + '\n';
    
    const subtotal = sale.items.reduce((sum, item) => 
      sum + (item.price - item.discount) * item.quantity, 0
    );
    
    receipt += rightAlign('Subtotal:', `${subtotal.toFixed(2)}`) + '\n';
    
    if (sale.discount > 0) {
      receipt += rightAlign('Sale Discount:', `-${sale.discount.toFixed(2)}`) + '\n';
    }
    
    receipt += '='.repeat(lineWidth) + '\n';
    receipt += rightAlign('TOTAL:', `${sale.total.toFixed(2)}`) + '\n';
    receipt += '='.repeat(lineWidth) + '\n\n';
    
    receipt += centerText('Thank you for shopping!') + '\n';
    receipt += centerText('Please come again') + '\n\n\n';
    
    return receipt;
  }

  /**
   * Print invoice - opens print dialog or preview
   */
  async print(sale: Sale): Promise<void> {
    try {
      const doc = this.generatePDF(sale);
      
      // For Electron: Use native printing if available
      if (window.electron && window.electron.print.pdf) {
        const pdfData = doc.output('datauristring').split(',')[1];
        const result = await window.electron.print.pdf(pdfData);

        if (!result.success) {
          console.warn('Electron print failed, falling back to browser print');
          this.browserPrint(doc, sale);
        }
      } else {
        // Fallback to browser print
        this.browserPrint(doc, sale);
      }
    } catch (error) {
      console.error('Print error:', error);
      throw error;
    }
  }
  
  /**
   * Browser-based print (works without printer connected)
   */
  private browserPrint(doc: jsPDF, sale: Sale): void {
    // Create blob URL
    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    
    // Open in new window/tab for print preview
    const printWindow = window.open(url, '_blank');
    
    if (printWindow) {
      // Wait for PDF to load, then trigger print dialog
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          // Clean up blob URL after print dialog closes
          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 1000);
        }, 250);
      };
    } else {
      // If popup blocked, download instead
      console.warn('Print window blocked, downloading PDF instead');
      URL.revokeObjectURL(url);
      this.download(sale);
    }
  }

  /**
   * Download invoice as PDF
   */
  download(sale: Sale): void {
    const doc = this.generatePDF(sale);
    const filename = `invoice-${sale.id}-${Date.now()}.pdf`;
    doc.save(filename);
  }

  
  /**
   * Print to thermal printer (ESC/POS)
   */
  async printThermal(sale: Sale): Promise<void> {
    const receipt = this.generateThermalReceipt(sale);
    
    // For Electron with thermal printer
    if (window.electron && window.electron.print.thermal) {
      try {
        const result = await window.electron.print.thermal(receipt);
        if (!result.success) {
          throw new Error(result.error || 'Thermal print failed');
        }
      } catch (error) {
        console.error('Thermal print error:', error);
        // Fallback to plain text
        this.printPlainText(receipt);
      }
    } else {
      // Fallback to plain text print
      this.printPlainText(receipt);
    }
  }

 
  /**
   * Print plain text (fallback)
   */
  private printPlainText(text: string): void {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                margin: 10px;
                white-space: pre;
              }
            </style>
          </head>
          <body>${text}</body>
        </html>
      `);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  }

  /**
   * Preview invoice in new window
   */
  preview(sale: Sale): void {
    const doc = this.generatePDF(sale);
    const pdfUrl = doc.output('bloburl');
    window.open(pdfUrl, '_blank');
  }
}

export const invoiceService = new InvoiceService();
