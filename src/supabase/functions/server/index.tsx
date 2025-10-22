import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Helper function to parse CSV
function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    rows.push(row);
  }
  
  return rows;
}

// Validate trade row
function validateTrade(trade: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!trade.trade_id) errors.push('trade_id is required');
  if (!trade.trade_date) errors.push('trade_date is required');
  if (!trade.instrument) errors.push('instrument is required');
  if (!trade.side || !['BUY', 'SELL'].includes(trade.side.toUpperCase())) {
    errors.push('side must be BUY or SELL');
  }
  if (!trade.quantity || isNaN(parseFloat(trade.quantity))) {
    errors.push('quantity must be a valid number');
  }
  if (!trade.trade_price || isNaN(parseFloat(trade.trade_price))) {
    errors.push('trade_price must be a valid number');
  }
  
  return { valid: errors.length === 0, errors };
}

// POST /make-server-65269444/trades/upload - Upload CSV file
app.post('/make-server-65269444/trades/upload', async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body.file;
    
    let csvText: string;
    
    if (file && typeof file !== 'string') {
      csvText = await file.text();
    } else if (typeof file === 'string') {
      csvText = file;
    } else {
      return c.json({ error: 'No file provided' }, 400);
    }
    
    const rows = parseCSV(csvText);
    
    if (rows.length === 0) {
      return c.json({ error: 'CSV file is empty or invalid' }, 400);
    }
    
    const validTrades = [];
    const invalidTrades = [];
    
    for (const row of rows) {
      const validation = validateTrade(row);
      if (validation.valid) {
        validTrades.push({
          trade_id: row.trade_id,
          trade_date: row.trade_date,
          trader: row.trader || 'Unknown',
          instrument: row.instrument,
          side: row.side.toUpperCase(),
          quantity: parseFloat(row.quantity),
          trade_price: parseFloat(row.trade_price),
          currency: row.currency || 'USD'
        });
      } else {
        invalidTrades.push({
          row,
          errors: validation.errors
        });
      }
    }
    
    // Store valid trades
    if (validTrades.length > 0) {
      const existingTrades = await kv.get('trades') || [];
      const allTrades = [...existingTrades, ...validTrades];
      await kv.set('trades', allTrades);
    }
    
    return c.json({
      success: true,
      message: `Uploaded ${validTrades.length} trades successfully`,
      validCount: validTrades.length,
      invalidCount: invalidTrades.length,
      invalidTrades: invalidTrades.slice(0, 10) // Return first 10 invalid trades
    });
    
  } catch (error) {
    console.log('Error uploading trades:', error);
    return c.json({ error: `Failed to upload trades: ${error.message}` }, 500);
  }
});

// POST /make-server-65269444/trades - Add single trade via JSON
app.post('/make-server-65269444/trades', async (c) => {
  try {
    const trade = await c.req.json();
    const validation = validateTrade(trade);
    
    if (!validation.valid) {
      return c.json({ error: 'Invalid trade data', errors: validation.errors }, 400);
    }
    
    const newTrade = {
      trade_id: trade.trade_id,
      trade_date: trade.trade_date,
      trader: trade.trader || 'Unknown',
      instrument: trade.instrument,
      side: trade.side.toUpperCase(),
      quantity: parseFloat(trade.quantity),
      trade_price: parseFloat(trade.trade_price),
      currency: trade.currency || 'USD'
    };
    
    const existingTrades = await kv.get('trades') || [];
    await kv.set('trades', [...existingTrades, newTrade]);
    
    return c.json({ success: true, trade: newTrade });
  } catch (error) {
    console.log('Error creating trade:', error);
    return c.json({ error: `Failed to create trade: ${error.message}` }, 500);
  }
});

// GET /make-server-65269444/trades - Get all trades with filters
app.get('/make-server-65269444/trades', async (c) => {
  try {
    const fromDate = c.req.query('from');
    const toDate = c.req.query('to');
    const instrument = c.req.query('instrument');
    const trader = c.req.query('trader');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');
    
    let trades = await kv.get('trades') || [];
    
    // Apply filters
    if (fromDate) {
      trades = trades.filter((t: any) => t.trade_date >= fromDate);
    }
    if (toDate) {
      trades = trades.filter((t: any) => t.trade_date <= toDate);
    }
    if (instrument) {
      trades = trades.filter((t: any) => t.instrument.toLowerCase().includes(instrument.toLowerCase()));
    }
    if (trader) {
      trades = trades.filter((t: any) => t.trader.toLowerCase().includes(trader.toLowerCase()));
    }
    
    // Sort by trade_id ascending (sequential order)
    trades.sort((a: any, b: any) => {
      // Try to sort by numeric part of trade_id if possible
      const aNum = parseInt(a.trade_id.replace(/\D/g, ''));
      const bNum = parseInt(b.trade_id.replace(/\D/g, ''));
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      // Fallback to string comparison
      return a.trade_id.localeCompare(b.trade_id);
    });
    
    // Pagination
    const total = trades.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedTrades = trades.slice(start, end);
    
    return c.json({
      trades: paginatedTrades,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.log('Error fetching trades:', error);
    return c.json({ error: `Failed to fetch trades: ${error.message}` }, 500);
  }
});

// GET /make-server-65269444/pnl - Calculate P&L
app.get('/make-server-65269444/pnl', async (c) => {
  try {
    const fromDate = c.req.query('from');
    const toDate = c.req.query('to');
    const instrument = c.req.query('instrument');
    
    const trades = await kv.get('trades') || [];
    const marketPrices = await kv.get('market_prices') || [];
    
    // Filter trades
    let filteredTrades = trades;
    if (fromDate) {
      filteredTrades = filteredTrades.filter((t: any) => t.trade_date >= fromDate);
    }
    if (toDate) {
      filteredTrades = filteredTrades.filter((t: any) => t.trade_date <= toDate);
    }
    if (instrument) {
      filteredTrades = filteredTrades.filter((t: any) => t.instrument === instrument);
    }
    
    // Calculate MtM for each trade
    let totalPnL = 0;
    const dailyPnL: { [key: string]: number } = {};
    const tradesPnL = [];
    
    for (const trade of filteredTrades) {
      // Find latest market price for this instrument
      const instrumentPrices = marketPrices
        .filter((p: any) => p.instrument === trade.instrument)
        .sort((a: any, b: any) => new Date(b.price_date).getTime() - new Date(a.price_date).getTime());
      
      const latestPrice = instrumentPrices[0];
      
      if (latestPrice) {
        const marketPrice = parseFloat(latestPrice.close_price);
        const tradePrice = parseFloat(trade.trade_price);
        const quantity = parseFloat(trade.quantity);
        
        // Simple MtM: MtM = (market_price - trade_price) * quantity
        const mtm = (marketPrice - tradePrice) * quantity;
        
        totalPnL += mtm;
        
        // Group by date
        const date = trade.trade_date;
        dailyPnL[date] = (dailyPnL[date] || 0) + mtm;
        
        tradesPnL.push({
          ...trade,
          market_price: marketPrice,
          mtm: mtm
        });
      }
    }
    
    // Convert dailyPnL to array and sort
    const dailyPnLArray = Object.entries(dailyPnL)
      .map(([date, pnl]) => ({ date, pnl }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return c.json({
      totalPnL,
      dailyPnL: dailyPnLArray,
      tradeCount: filteredTrades.length,
      valuedTradeCount: tradesPnL.length,
      trades: tradesPnL  // Include trades with MtM calculations
    });
  } catch (error) {
    console.log('Error calculating P&L:', error);
    return c.json({ error: `Failed to calculate P&L: ${error.message}` }, 500);
  }
});

// POST /make-server-65269444/market-prices/upload - Upload market prices CSV
app.post('/make-server-65269444/market-prices/upload', async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body.file;
    
    let csvText: string;
    
    if (file && typeof file !== 'string') {
      csvText = await file.text();
    } else if (typeof file === 'string') {
      csvText = file;
    } else {
      return c.json({ error: 'No file provided' }, 400);
    }
    
    const rows = parseCSV(csvText);
    
    if (rows.length === 0) {
      return c.json({ error: 'CSV file is empty or invalid' }, 400);
    }
    
    const prices = rows.map(row => ({
      instrument: row.instrument,
      price_date: row.price_date,
      close_price: parseFloat(row.close_price)
    }));
    
    await kv.set('market_prices', prices);
    
    return c.json({
      success: true,
      message: `Uploaded ${prices.length} market prices successfully`,
      count: prices.length
    });
    
  } catch (error) {
    console.log('Error uploading market prices:', error);
    return c.json({ error: `Failed to upload market prices: ${error.message}` }, 500);
  }
});

// GET /make-server-65269444/market-prices - Get market prices
app.get('/make-server-65269444/market-prices', async (c) => {
  try {
    const prices = await kv.get('market_prices') || [];
    return c.json({ prices });
  } catch (error) {
    console.log('Error fetching market prices:', error);
    return c.json({ error: `Failed to fetch market prices: ${error.message}` }, 500);
  }
});

// GET /make-server-65269444/instruments - Get unique instruments
app.get('/make-server-65269444/instruments', async (c) => {
  try {
    const trades = await kv.get('trades') || [];
    const instruments = [...new Set(trades.map((t: any) => t.instrument))];
    return c.json({ instruments });
  } catch (error) {
    console.log('Error fetching instruments:', error);
    return c.json({ error: `Failed to fetch instruments: ${error.message}` }, 500);
  }
});

// GET /make-server-65269444/traders - Get unique traders
app.get('/make-server-65269444/traders', async (c) => {
  try {
    const trades = await kv.get('trades') || [];
    const traders = [...new Set(trades.map((t: any) => t.trader))];
    return c.json({ traders });
  } catch (error) {
    console.log('Error fetching traders:', error);
    return c.json({ error: `Failed to fetch traders: ${error.message}` }, 500);
  }
});

// DELETE /make-server-65269444/trades - Clear all trades (for testing)
app.delete('/make-server-65269444/trades', async (c) => {
  try {
    await kv.set('trades', []);
    return c.json({ success: true, message: 'All trades cleared' });
  } catch (error) {
    console.log('Error clearing trades:', error);
    return c.json({ error: `Failed to clear trades: ${error.message}` }, 500);
  }
});

// DELETE /make-server-65269444/market-prices - Clear all market prices
app.delete('/make-server-65269444/market-prices', async (c) => {
  try {
    await kv.set('market_prices', []);
    return c.json({ success: true, message: 'All market prices cleared' });
  } catch (error) {
    console.log('Error clearing market prices:', error);
    return c.json({ error: `Failed to clear market prices: ${error.message}` }, 500);
  }
});

// DELETE /make-server-65269444/all-data - Clear all data (trades + market prices)
app.delete('/make-server-65269444/all-data', async (c) => {
  try {
    await kv.set('trades', []);
    await kv.set('market_prices', []);
    return c.json({ success: true, message: 'All data cleared successfully' });
  } catch (error) {
    console.log('Error clearing all data:', error);
    return c.json({ error: `Failed to clear all data: ${error.message}` }, 500);
  }
});

// GET /make-server-65269444/health - Check database connection
app.get('/make-server-65269444/health', async (c) => {
  try {
    // Test KV store connection
    await kv.get('trades');
    return c.json({ 
      success: true, 
      message: 'Database connection healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.log('Database health check failed:', error);
    return c.json({ 
      success: false, 
      error: `Database connection failed: ${error.message}` 
    }, 500);
  }
});

// GET /make-server-65269444/stats - Get dashboard statistics
app.get('/make-server-65269444/stats', async (c) => {
  try {
    const trades = await kv.get('trades') || [];
    const marketPrices = await kv.get('market_prices') || [];
    
    const totalTrades = trades.length;
    const uniqueInstruments = new Set(trades.map((t: any) => t.instrument)).size;
    const uniqueTraders = new Set(trades.map((t: any) => t.trader)).size;
    
    // Calculate total volume
    const totalVolume = trades.reduce((sum: number, t: any) => sum + parseFloat(t.quantity), 0);
    
    // Calculate total notional
    const totalNotional = trades.reduce((sum: number, t: any) => 
      sum + (parseFloat(t.quantity) * parseFloat(t.trade_price)), 0);
    
    return c.json({
      totalTrades,
      uniqueInstruments,
      uniqueTraders,
      totalVolume,
      totalNotional,
      marketPricesCount: marketPrices.length
    });
  } catch (error) {
    console.log('Error fetching stats:', error);
    return c.json({ error: `Failed to fetch stats: ${error.message}` }, 500);
  }
});

Deno.serve(app.fetch);
