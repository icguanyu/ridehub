import { asyncHandler } from '../utils/asyncHandler.js';
import { getFuelPrices } from '../services/fuelPriceService.js';

// GET /fuel-prices — 台灣參考油價（NT$/L），供前端顯示與預填
export const getFuelPricesHandler = asyncHandler(async (_req, res) => {
  const { prices, source, updatedAt } = await getFuelPrices();
  res.json({ prices, source, updatedAt });
});
