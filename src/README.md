# ETRM Trade Capture & Dashboard

A full-stack Energy Trading and Risk Management (ETRM) micro-application for capturing trades, managing market data, and calculating Mark-to-Market (MtM) P&L in real-time.

## 🎯 Overview

This application provides a simplified ETRM workflow that enables energy traders to:
- Upload trade data via CSV files
- Manage market pricing data
- Calculate and visualize Mark-to-Market P&L
- Filter and analyze trade positions
- Track portfolio statistics in real-time

## 🏗️ Architecture

The application follows a three-tier architecture:

```
┌─────────────────────┐
│   React Frontend    │  ← User Interface (Tailwind CSS)
└──────────┬──────────┘
           │ HTTPS/REST
┌──────────▼──────────┐
│   Hono Web Server   │  ← Supabase Edge Function (Deno Runtime)
└──────────┬──────────┘
           │ KV API
┌──────────▼──────────┐
│  PostgreSQL (KV)    │  ← Supabase Key-Value Store
└─────────────────────┘
```

### Components

1. **Frontend** (`/App.tsx`, `/components/*`)
   - React 18 with TypeScript
   - Tailwind CSS v4 for styling
   - ShadCN UI component library
   - Recharts for data visualization
   - Lucide React for icons

2. **Backend** (`/supabase/functions/server/index.tsx`)
   - Hono web framework running on Deno
   - RESTful API endpoints
   - CSV parsing and validation
   - P&L calculation engine
   - CORS-enabled for cross-origin requests

3. **Database** (Supabase KV Store)
   - Key-Value storage on PostgreSQL
   - Two primary data stores:
     - `trades`: Trade records
     - `market_prices`: Daily closing prices

## 🚀 Features

### ✅ Implemented

- **CSV Upload**: Bulk import trades and market prices
- **Trade Management**: View, filter, and paginate trade records
- **P&L Calculation**: Real-time MtM calculations using latest market prices
- **Advanced Filtering**: Filter by date range, instrument, and trader
- **Dashboard Analytics**:
  - Total trades count
  - Total P&L (aggregated)
  - Unique instruments and traders
  - Total volume and notional value
- **Data Visualization**: Daily P&L performance charts
- **Data Management**: Clear trades, prices, or all data
- **Multi-Currency Support**: Currency field in trade records
- **Responsive Design**: Dark gradient theme (purple-to-pink-to-orange)
- **Health Monitoring**: Database connection status checks

### 📋 CSV Schemas

**Trades CSV Format:**
```csv
trade_id,trade_date,trader,instrument,side,quantity,trade_price,currency
T001,2025-01-15,John Doe,WTI-CRUDE,BUY,1000,75.50,USD
T002,2025-01-15,Jane Smith,BRENT,SELL,500,78.25,USD
```

**Market Prices CSV Format:**
```csv
instrument,price_date,close_price
WTI-CRUDE,2025-01-15,76.00
BRENT,2025-01-15,79.50
```

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + TypeScript | UI framework |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| UI Components | ShadCN UI | Accessible component library |
| Charts | Recharts | Data visualization |
| Backend Runtime | Deno | Modern JavaScript/TypeScript runtime |
| Web Framework | Hono | Lightweight, fast web framework |
| Database | Supabase PostgreSQL | Managed PostgreSQL with KV API |
| Hosting | Supabase Edge Functions | Serverless function deployment |

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+ or compatible runtime
- Supabase account and project
- Modern web browser

### Environment Variables

The application requires the following Supabase configuration (auto-configured in deployment):

```
SUPABASE_URL=<your-project-url>
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd etrm-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Supabase**
   - Create a new Supabase project at https://supabase.com
   - Copy your project URL and API keys
   - Update `/utils/supabase/info.tsx` with your credentials

4. **Deploy Edge Function**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   
   # Link to your project
   supabase link --project-ref <your-project-ref>
   
   # Deploy the server function
   supabase functions deploy make-server-65269444
   ```

5. **Run the application**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173` (or your dev server port).

## 📚 API Documentation

### Base URL
```
https://<project-id>.supabase.co/functions/v1/make-server-65269444
```

### Authentication
All requests require the `Authorization` header:
```
Authorization: Bearer <SUPABASE_ANON_KEY>
```

### Endpoints

#### Trades

**Upload Trades (CSV)**
```http
POST /trades/upload
Content-Type: multipart/form-data

file: <csv-file>
```

**Create Trade (JSON)**
```http
POST /trades
Content-Type: application/json

{
  "trade_id": "T001",
  "trade_date": "2025-01-15",
  "trader": "John Doe",
  "instrument": "WTI-CRUDE",
  "side": "BUY",
  "quantity": 1000,
  "trade_price": 75.50,
  "currency": "USD"
}
```

**Get Trades (with filters)**
```http
GET /trades?from=2025-01-01&to=2025-01-31&instrument=WTI-CRUDE&trader=John&page=1&limit=20
```

**Delete All Trades**
```http
DELETE /trades
```

#### Market Prices

**Upload Market Prices (CSV)**
```http
POST /market-prices/upload
Content-Type: multipart/form-data

file: <csv-file>
```

**Get Market Prices**
```http
GET /market-prices
```

**Delete All Market Prices**
```http
DELETE /market-prices
```

#### Analytics

**Get P&L Calculation**
```http
GET /pnl?from=2025-01-01&to=2025-01-31&instrument=WTI-CRUDE
```

Response:
```json
{
  "totalPnL": 500.00,
  "dailyPnL": [
    { "date": "2025-01-15", "pnl": 300.00 },
    { "date": "2025-01-16", "pnl": 200.00 }
  ],
  "tradeCount": 10,
  "valuedTradeCount": 8,
  "trades": [...]
}
```

**Get Dashboard Stats**
```http
GET /stats
```

**Get Unique Instruments**
```http
GET /instruments
```

**Get Unique Traders**
```http
GET /traders
```

#### System

**Health Check**
```http
GET /health
```

**Delete All Data**
```http
DELETE /all-data
```

## 🧪 Testing Guide

### Manual Testing

#### 1. Upload Test Data

**Sample Trades CSV** (`test-trades.csv`):
```csv
trade_id,trade_date,trader,instrument,side,quantity,trade_price,currency
T001,2025-01-15,Alice Johnson,WTI-CRUDE,BUY,1000,75.50,USD
T002,2025-01-15,Bob Smith,BRENT,SELL,500,78.25,USD
T003,2025-01-16,Alice Johnson,NATURAL-GAS,BUY,2000,3.45,USD
T004,2025-01-16,Charlie Brown,WTI-CRUDE,BUY,750,75.75,USD
T005,2025-01-17,Bob Smith,BRENT,BUY,600,78.50,USD
```

**Sample Market Prices CSV** (`test-prices.csv`):
```csv
instrument,price_date,close_price
WTI-CRUDE,2025-01-15,76.00
WTI-CRUDE,2025-01-16,76.50
WTI-CRUDE,2025-01-17,77.00
BRENT,2025-01-15,79.50
BRENT,2025-01-16,79.75
BRENT,2025-01-17,80.00
NATURAL-GAS,2025-01-16,3.50
NATURAL-GAS,2025-01-17,3.55
```

#### 2. Test Workflow

1. **Navigate to Upload Tab**
   - Upload `test-trades.csv`
   - Verify success message shows "Uploaded 5 trades successfully"

2. **Upload Market Prices**
   - Upload `test-prices.csv`
   - Verify success message

3. **View Dashboard**
   - Check stats cards show correct counts
   - Verify Total P&L is calculated
   - View Daily P&L chart

4. **Test Filters**
   - Filter by date range: `2025-01-15` to `2025-01-16`
   - Filter by instrument: `WTI-CRUDE`
   - Filter by trader: `Alice`
   - Verify trade list updates correctly

5. **View Trades Tab**
   - Verify pagination works
   - Check trade data displays correctly

6. **Test Data Management**
   - Navigate to Manage Data tab
   - Verify database connection shows as "Connected"
   - Test clearing trades (use with caution!)

### API Testing with cURL

**Upload Trades:**
```bash
curl -X POST \
  https://<project-id>.supabase.co/functions/v1/make-server-65269444/trades/upload \
  -H "Authorization: Bearer <ANON_KEY>" \
  -F "file=@test-trades.csv"
```

**Get Trades:**
```bash
curl -X GET \
  "https://<project-id>.supabase.co/functions/v1/make-server-65269444/trades?page=1&limit=10" \
  -H "Authorization: Bearer <ANON_KEY>"
```

**Calculate P&L:**
```bash
curl -X GET \
  "https://<project-id>.supabase.co/functions/v1/make-server-65269444/pnl" \
  -H "Authorization: Bearer <ANON_KEY>"
```

### Expected Behavior

| Test Case | Expected Result |
|-----------|----------------|
| Upload valid CSV | Success message with count |
| Upload invalid CSV | Error message with validation errors |
| Filter by date | Only trades in date range shown |
| Calculate P&L without prices | 0 valued trades |
| Calculate P&L with prices | Correct MtM calculation |
| Pagination | Correct page of results |
| Clear data | All data removed, stats reset to 0 |

### P&L Calculation Validation

The MtM formula is:
```
MtM = (Market Price - Trade Price) × Quantity
```

**Example:**
- Trade: BUY 1000 WTI-CRUDE @ $75.50
- Market Price: $76.00
- MtM = (76.00 - 75.50) × 1000 = **$500.00**

## 🎨 UI/UX Features

- **Dark Gradient Theme**: Purple → Pink → Orange gradient background
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Stats and charts update after data changes
- **Loading States**: Skeleton loaders and spinners for async operations
- **Error Handling**: User-friendly error messages
- **Confirmation Dialogs**: Prevents accidental data deletion
- **Accessible Components**: ARIA-compliant ShadCN components

## 🔧 Configuration

### Customizing the Theme

Edit `/styles/globals.css` to modify colors, spacing, and typography:

```css
:root {
  --color-primary: oklch(0.646 0.222 41.116);
  --radius: 0.625rem;
  /* ... other CSS variables */
}
```

### Adjusting Pagination

Default page size is 20 trades. Modify in `/App.tsx`:

```typescript
const params = new URLSearchParams({
  page: currentPage.toString(),
  limit: '20', // Change this value
});
```

## 📊 Data Model

### Trade Object
```typescript
{
  trade_id: string;        // Unique identifier
  trade_date: string;      // ISO date (YYYY-MM-DD)
  trader: string;          // Trader name
  instrument: string;      // Instrument symbol
  side: 'BUY' | 'SELL';   // Trade direction
  quantity: number;        // Volume
  trade_price: number;     // Execution price
  currency: string;        // Currency code (e.g., 'USD')
}
```

### Market Price Object
```typescript
{
  instrument: string;      // Instrument symbol
  price_date: string;      // ISO date
  close_price: number;     // Closing/mark price
}
```

### P&L Response
```typescript
{
  totalPnL: number;                    // Aggregate P&L
  dailyPnL: Array<{                    // Daily breakdown
    date: string;
    pnl: number;
  }>;
  tradeCount: number;                  // Total trades filtered
  valuedTradeCount: number;            // Trades with market prices
  trades: Array<Trade & {              // Trades with MtM
    market_price?: number;
    mtm?: number;
  }>;
}
```

## 🚨 Limitations & Considerations

1. **Data Persistence**: Uses Supabase KV Store (in-memory cache with PostgreSQL backing)
2. **Scalability**: Optimized for prototyping; may need optimization for production scale
3. **Currency Conversion**: Multi-currency support exists but FX conversion not implemented
4. **Authentication**: Currently uses public anon key; production should implement JWT auth
5. **Validation**: Basic CSV validation; production should add more robust checks
6. **Backup**: No built-in backup/restore; use Supabase backups or export data regularly

## 🤝 Contributing

This is an interview/demo project. For production use, consider:
- Implementing proper authentication (JWT with role-based access)
- Adding comprehensive unit and integration tests
- Setting up CI/CD pipelines
- Implementing data backup strategies
- Adding audit logging
- Optimizing database queries for scale
- Implementing rate limiting
- Adding WebSocket support for real-time updates

## 📝 License

This is a demonstration project created for interview purposes.

## 🔗 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Hono Framework](https://hono.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [ShadCN UI](https://ui.shadcn.com)
- [Recharts](https://recharts.org)

---

**Built with** React, TypeScript, Tailwind CSS, Supabase, and Hono
