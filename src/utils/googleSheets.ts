/**
 * Google Sheets & Drive API helper utilities
 */

/**
 * Searches user's Google Drive for an existing spreadsheet named 'Aetheria Parfums Ledger'
 */
export async function findLedgerSpreadsheet(token: string): Promise<string | null> {
  const query = encodeURIComponent("name='Aetheria Parfums Ledger' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;
  
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error('Failed to search Drive:', res.statusText);
      return null;
    }
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (error) {
    console.error('Error finding ledger spreadsheet:', error);
    return null;
  }
}

/**
 * Creates a new Google Spreadsheet named 'Aetheria Parfums Ledger' with standard sheets
 */
export async function createLedgerSpreadsheet(token: string): Promise<string> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      properties: {
        title: 'Aetheria Parfums Ledger'
      },
      sheets: [
        { properties: { title: 'Orders' } },
        { properties: { title: 'Custom Formulas' } }
      ]
    })
  });

  if (!res.ok) {
    throw new Error(`Failed to create spreadsheet: ${res.statusText}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;

  // Initialize the header rows
  await initializeHeaders(token, spreadsheetId);

  return spreadsheetId;
}

/**
 * Initializes header columns for both Orders and Custom Formulas sheets
 */
async function initializeHeaders(token: string, spreadsheetId: string) {
  // 1. Orders sheet headers
  const ordersUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Orders!A1:K1?valueInputOption=USER_ENTERED`;
  await fetch(ordersUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      values: [
        ["Order ID", "Date", "Type", "Product Name", "Size", "Quantity", "Price Paid", "Currency", "Status", "Customer Name", "Address"]
      ]
    })
  });

  // 2. Custom Formulas sheet headers
  const formulasUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Custom%20Formulas!A1:I1?valueInputOption=USER_ENTERED`;
  await fetch(formulasUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      values: [
        ["Formula Name", "Date Curated", "Description", "Vibe", "Intensity", "Top Notes", "Heart Notes", "Base Notes", "Match Score"]
      ]
    })
  });
}

export interface OrderRow {
  orderId: string;
  date: string;
  type: string;
  productName: string;
  size: string;
  quantity: number;
  pricePaid: string;
  currency: string;
  status: string;
  customerName: string;
  address: string;
}

/**
 * Appends a list of order items to the Google Sheet
 */
export async function appendOrders(token: string, spreadsheetId: string, orders: OrderRow[]) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Orders!A:K:append?valueInputOption=USER_ENTERED`;
  
  const values = orders.map(order => [
    order.orderId,
    order.date,
    order.type,
    order.productName,
    order.size,
    order.quantity,
    order.pricePaid,
    order.currency,
    order.status,
    order.customerName,
    order.address
  ]);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ values })
  });

  if (!res.ok) {
    throw new Error(`Failed to log orders to sheet: ${res.statusText}`);
  }
}

export interface FormulaRow {
  name: string;
  date: string;
  description: string;
  vibe: string;
  intensity: string;
  topNotes: string;
  heartNotes: string;
  baseNotes: string;
  matchScore: string;
}

/**
 * Appends a custom formula to the Google Sheet
 */
export async function appendFormula(token: string, spreadsheetId: string, formula: FormulaRow) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Custom%20Formulas!A:I:append?valueInputOption=USER_ENTERED`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      values: [[
        formula.name,
        formula.date,
        formula.description,
        formula.vibe,
        formula.intensity,
        formula.topNotes,
        formula.heartNotes,
        formula.baseNotes,
        formula.matchScore
      ]]
    })
  });

  if (!res.ok) {
    throw new Error(`Failed to log custom formula to sheet: ${res.statusText}`);
  }
}

/**
 * Fetches all row data for a specific sheet/tab name
 */
export async function fetchSheetRows(token: string, spreadsheetId: string, sheetName: string): Promise<string[][]> {
  // Fetch up to 500 records
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A2:K500`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error(`Failed to fetch sheet ${sheetName}:`, res.statusText);
      return [];
    }
    const data = await res.json();
    return data.values || [];
  } catch (error) {
    console.error(`Error fetching sheet ${sheetName}:`, error);
    return [];
  }
}
