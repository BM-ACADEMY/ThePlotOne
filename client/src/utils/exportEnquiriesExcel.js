import ExcelJS from 'exceljs';
import moment from 'moment';

/**
 * Exports enquiries to an Excel file with a status dropdown.
 * @param {Array} data - The filtered enquiries data.
 * @param {boolean} isAdmin - Whether the export is for an admin (includes seller info).
 */
export const exportEnquiriesExcel = async (data, isAdmin = false) => {
  if (!data || data.length === 0) {
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Property Enquiries');

  // Define columns
  const columns = [
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Property Title', key: 'property', width: 35 },
  ];

  if (isAdmin) {
    columns.push({ header: 'Seller Name', key: 'seller', width: 25 });
    columns.push({ header: 'Seller Phone', key: 'sellerPhone', width: 15 });
  }

  columns.push(
    { header: 'Enquirer Name', key: 'enquirerName', width: 25 },
    { header: 'Enquirer Phone', key: 'enquirerPhone', width: 15 },
    { header: 'Message', key: 'message', width: 40 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Status', key: 'status', width: 15 }
  );

  worksheet.columns = columns;

  // Add rows
  data.forEach((item) => {
    const rowData = {
      date: moment(item.createdAt).format('DD/MM/YYYY hh:mm A'),
      property: item.property_id?.basicInfo?.title || item.property_id?.title || item.property_title || 'N/A',
      enquirerName: item.enquirer_name || 'Guest',
      enquirerPhone: item.enquirer_phone || 'N/A',
      message: item.message || '',
      type: item.type === 'whatsapp_lead' ? 'WhatsApp' : 'Portal',
      status: (item.status || 'new').toUpperCase(),
    };

    if (isAdmin) {
      rowData.seller = item.seller_id?.name || 'N/A';
      rowData.sellerPhone = item.seller_id?.phone || 'N/A';
    }

    const row = worksheet.addRow(rowData);

    // Add data validation (dropdown) to the Status cell
    const statusCell = row.getCell('status');
    statusCell.dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"NEW,CONTACTED,CLOSED"'],
      showErrorMessage: true,
      errorTitle: 'Invalid Status',
      error: 'Please select a status from the dropdown list.',
    };
  });

  // Styling
  // Header styling
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }, // Indigo-600
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Alignment for all cells
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      if (rowNumber > 1) {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      }
    });
  });

  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Enquiries_Export_${moment().format('YYYYMMDD_HHmm')}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};
