// 台灣參考油價：優先抓中油 OpenData，失敗一律回退到 constants 的預設值。
// 結果快取在 fuel_prices 表（單列，id 固定），跨重啟保留；記憶體再快取 TTL。
import { supabaseAdmin } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { FUEL_PRICE_FALLBACK, FUEL_ENERGY_TYPES } from '../constants.js';

const ROW_ID = 'cpc';
const TTL_MS = 12 * 60 * 60 * 1000;
const SOURCE_URL =
  process.env.FUEL_PRICE_SOURCE_URL ||
  'https://vipmbr.cpc.com.tw/CPCSTN/OpenData/ListPriceWebService.asmx/getCPCMainProdListPrice';

let mem = null; // { prices, updatedAt, source }

function mapProductName(name = '') {
  if (name.includes('92')) return 'gasoline_92';
  if (name.includes('95')) return 'gasoline_95';
  if (name.includes('98')) return 'gasoline_98';
  if (name.includes('柴油')) return 'diesel';
  return null;
}

// 從中油 XML 粗解析（不引入 XML 套件；格式若變動就會回退預設）
function parseCpcXml(xml) {
  const out = {};
  const blocks = xml.match(/<MainProdListPrice>[\s\S]*?<\/MainProdListPrice>/g) || [];
  for (const block of blocks) {
    const name = (block.match(/<t_Product_Name>([\s\S]*?)<\/t_Product_Name>/) || [])[1];
    const price = Number((block.match(/<t_Price>([\s\S]*?)<\/t_Price>/) || [])[1]);
    const key = mapProductName(name);
    if (key && price > 0 && !out[key]) out[key] = price;
  }
  return out;
}

async function fetchLive() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(SOURCE_URL, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const prices = parseCpcXml(await res.text());
    // 至少要有一種常見油品才算成功
    if (!FUEL_ENERGY_TYPES.some((k) => prices[k] > 0)) throw new Error('解析不到油價');
    return { ...FUEL_PRICE_FALLBACK, ...prices };
  } finally {
    clearTimeout(timer);
  }
}

async function loadFromDb() {
  const { data } = await supabaseAdmin
    .from('fuel_prices')
    .select('prices, source, updated_at')
    .eq('id', ROW_ID)
    .maybeSingle();
  if (!data) return null;
  return { prices: data.prices, source: data.source, updatedAt: data.updated_at };
}

async function saveToDb(prices, source) {
  const { error } = await supabaseAdmin
    .from('fuel_prices')
    .upsert({ id: ROW_ID, prices, source, updated_at: new Date().toISOString() });
  if (error) logger.error('寫入 fuel_prices 失敗', error.message);
}

// 回傳 { prices: {gasoline_92,...}, source: 'live'|'fallback'|'cache', updatedAt }
export async function getFuelPrices() {
  if (mem && Date.now() - new Date(mem.updatedAt).getTime() < TTL_MS) return mem;

  const cached = await loadFromDb().catch(() => null);
  if (cached && Date.now() - new Date(cached.updatedAt).getTime() < TTL_MS) {
    mem = { ...cached, source: 'cache' };
    return mem;
  }

  try {
    const prices = await fetchLive();
    mem = { prices, source: 'live', updatedAt: new Date().toISOString() };
    await saveToDb(prices, 'live');
    return mem;
  } catch (err) {
    logger.warn('抓取油價失敗，改用回退值', err.message);
    const prices = cached?.prices ?? { ...FUEL_PRICE_FALLBACK };
    mem = { prices, source: cached ? 'cache' : 'fallback', updatedAt: new Date().toISOString() };
    return mem;
  }
}

// 司機該油種的每公升價（司機自填優先，否則用即時/回退油價；電車回 null）
export function resolveUnitPrice(driver, fuelPrices) {
  if (driver.energy_unit_price != null) return Number(driver.energy_unit_price);
  if (driver.energy_type === 'ev') return null;
  return fuelPrices?.[driver.energy_type] ?? null;
}
