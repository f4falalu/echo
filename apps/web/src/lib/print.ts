export const printHTMLPage = ({
  html,
  filename,
  closeOnPrint = true
}: {
  html: string;
  filename: string;
  closeOnPrint?: boolean;
}) => {
  // Open a print window with the rendered HTML so the user can save as PDF
  const printWindow = window.open('', '_blank');
  if (!printWindow) throw new Error('Unable to open print window');

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  // Close the print window after the user prints or cancels
  const handleAfterPrint = () => {
    try {
      if (closeOnPrint) {
        printWindow.close();
      }
    } catch (e) {
      console.error('Failed to close print window', e);
    }
  };
  printWindow.addEventListener('afterprint', handleAfterPrint, { once: true });

  // Trigger print when resources are loaded
  const triggerPrint = () => {
    try {
      printWindow.focus();
      // Set the title for the print window so the OS save dialog suggests it
      printWindow.document.title = filename;
      printWindow.print();
    } catch (e) {
      console.error('Failed to trigger print dialog', e);
    }
  };

  if (printWindow.document.readyState === 'complete') {
    // Give a brief moment for styles to apply
    setTimeout(triggerPrint, 100);
  } else {
    printWindow.addEventListener('load', () => setTimeout(triggerPrint, 100), { once: true });
  }
};
