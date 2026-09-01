/* ============================================================
   저장소 (Supabase / 별도 서버 DB)
   ------------------------------------------------------------
   기존 Claude 아티팩트 window.storage 를 대체합니다.
   - orders   : 주문 1건 = 1 row
   - config   : id=1 단일 row (PIN 보관)
   - stores   : 매장 1개 = 1 row
   - products : 떡 종류 1개 = 1 row
   모든 함수는 Promise 를 반환합니다.
   ============================================================ */
import { supabase } from './supabaseClient.js';
import { DEFAULT_ADMIN_PIN, DEFAULT_STAFF_PIN, DEFAULT_PRODUCTS } from './config.js';
import { state } from './state.js';

/* ---------- row <-> 앱 객체 매핑 ---------- */
const ORDER_FIELD_MAP = {
  status: 'status',
  phone: 'phone',
  inStore: 'in_store',
  deliveryDate: 'delivery_date',
  memo: 'memo',
  receiveMethod: 'receive_method',
  storeName: 'store_name',
  address: 'address',
  items: 'items',
  ritual: 'ritual',
  itemsTotal: 'items_total',
  surchargeApplies: 'surcharge_applies',
  surchargeUnits: 'surcharge_units',
  surchargeAmount: 'surcharge_amount',
  total: 'total',
};

function rowToOrder(r){
  return {
    id: r.id,
    createdAt: r.created_at,
    status: r.status,
    phone: r.phone || '',
    inStore: !!r.in_store,
    deliveryDate: r.delivery_date,
    memo: r.memo || '',
    receiveMethod: r.receive_method || '',
    storeName: r.store_name || '',
    address: r.address || '',
    items: r.items || [],
    ritual: r.ritual || [],
    itemsTotal: r.items_total || 0,
    surchargeApplies: !!r.surcharge_applies,
    surchargeUnits: r.surcharge_units || 0,
    surchargeAmount: r.surcharge_amount || 0,
    total: r.total || 0,
  };
}

function orderToRow(o){
  return {
    id: o.id,
    created_at: o.createdAt,
    status: o.status,
    phone: o.phone || '',
    in_store: !!o.inStore,
    delivery_date: o.deliveryDate,
    memo: o.memo || null,
    receive_method: o.receiveMethod || null,
    store_name: o.storeName || null,
    address: o.address || null,
    items: o.items || [],
    ritual: o.ritual || [],
    items_total: o.itemsTotal || 0,
    surcharge_applies: !!o.surchargeApplies,
    surcharge_units: o.surchargeUnits || 0,
    surcharge_amount: o.surchargeAmount || 0,
    total: o.total || 0,
  };
}

function patchToRow(patch){
  var row = {};
  Object.keys(patch).forEach(function(k){
    if (ORDER_FIELD_MAP[k]) row[ORDER_FIELD_MAP[k]] = patch[k];
  });
  return row;
}

/* ---------- 주문 ---------- */
export async function loadOrders(){
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: true });
  if (error){ console.error('loadOrders', error); return []; }
  return (data || []).map(rowToOrder);
}

export async function refreshOrders(){
  state.orders = await loadOrders();
  return state.orders;
}

export async function insertOrder(order){
  if (!supabase) return false;
  const { error } = await supabase.from('orders').insert(orderToRow(order));
  if (error){ console.error('insertOrder', error); return false; }
  return true;
}

export async function updateOrder(id, patch){
  if (!supabase) return false;
  const { error } = await supabase.from('orders').update(patchToRow(patch)).eq('id', id);
  if (error){ console.error('updateOrder', error); return false; }
  return true;
}

export async function removeOrder(id){
  if (!supabase) return false;
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error){ console.error('removeOrder', error); return false; }
  return true;
}

/* ---------- 설정(PIN) ---------- */
export async function loadConfig(){
  const fallback = { adminPin: DEFAULT_ADMIN_PIN, staffPin: DEFAULT_STAFF_PIN };
  if (!supabase) return fallback;
  const { data, error } = await supabase.from('config').select('*').eq('id', 1).maybeSingle();
  if (error){ console.error('loadConfig', error); return fallback; }
  if (!data) return fallback;
  return {
    adminPin: data.admin_pin || DEFAULT_ADMIN_PIN,
    staffPin: data.staff_pin || DEFAULT_STAFF_PIN,
  };
}

export async function saveConfig(cfg){
  if (!supabase) return false;
  const { error } = await supabase
    .from('config')
    .upsert({ id: 1, admin_pin: cfg.adminPin, staff_pin: cfg.staffPin });
  if (error){ console.error('saveConfig', error); return false; }
  return true;
}

/* ---------- 매장 ---------- */
export async function loadStores(){
  if (!supabase) return [];
  const { data, error } = await supabase.from('stores').select('*').order('name', { ascending: true });
  if (error){ console.error('loadStores', error); return []; }
  return (data || []).map(function(s){ return { id: s.id, name: s.name, address: s.address || '' }; });
}

export async function refreshStores(){
  state.stores = await loadStores();
  return state.stores;
}

export async function insertStore(store){
  if (!supabase) return false;
  const { error } = await supabase
    .from('stores')
    .insert({ id: store.id, name: store.name, address: store.address || null });
  if (error){ console.error('insertStore', error); return false; }
  return true;
}

export async function removeStore(id){
  if (!supabase) return false;
  const { error } = await supabase.from('stores').delete().eq('id', id);
  if (error){ console.error('removeStore', error); return false; }
  return true;
}

/* ---------- 떡 종류 (products) ---------- */
function rowToProduct(r){
  return {
    id: r.id,
    name: r.name,
    mal: r.mal || 0,
    half: r.half == null ? null : r.half,
    cutSelect: !!r.cut_select,
    note: r.note || '',
    surchargeEligible: !!r.surcharge_eligible,
    active: r.active !== false,
  };
}

function productToRow(p){
  return {
    id: p.id,
    name: p.name,
    mal: p.mal || 0,
    half: p.half == null ? null : p.half,
    cut_select: !!p.cutSelect,
    note: p.note || null,
    surcharge_eligible: !!p.surchargeEligible,
    active: p.active !== false,
  };
}

export async function loadProducts(){
  if (!supabase) return DEFAULT_PRODUCTS.map(function(p){ return rowToProduct(productToRow(p)); });
  const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
  if (error){ console.error('loadProducts', error); return []; }
  return (data || []).map(rowToProduct);
}

export async function refreshProducts(){
  state.products = await loadProducts();
  return state.products;
}

/* products 테이블 최초 시딩 — 이미 완료됨.
   매 로드마다 count 쿼리를 날리지 않도록 비활성화. 다시 시딩이 필요하면
   이 함수와 main.js 의 호출/임포트를 되살리세요. */
/*
export async function seedProductsIfEmpty(){
  if (!supabase) return false;
  const { count, error } = await supabase.from('products').select('id', { count: 'exact', head: true });
  if (error){ console.error('seedProducts(count)', error); return false; }
  if (count && count > 0) return false;
  const rows = DEFAULT_PRODUCTS.map(productToRow);
  const { error: insErr } = await supabase.from('products').insert(rows);
  if (insErr){ console.error('seedProducts(insert)', insErr); return false; }
  return true;
}
*/

export async function insertProduct(p){
  if (!supabase) return false;
  const { error } = await supabase.from('products').insert(productToRow(p));
  if (error){ console.error('insertProduct', error); return false; }
  return true;
}

export async function updateProduct(id, patch){
  if (!supabase) return false;
  const map = {
    name:'name', mal:'mal', half:'half', cutSelect:'cut_select',
    note:'note', surchargeEligible:'surcharge_eligible', active:'active',
  };
  const row = {};
  Object.keys(patch).forEach(function(k){ if (map[k]) row[map[k]] = patch[k]; });
  const { error } = await supabase.from('products').update(row).eq('id', id);
  if (error){ console.error('updateProduct', error); return false; }
  return true;
}

export async function removeProduct(id){
  if (!supabase) return false;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error){ console.error('removeProduct', error); return false; }
  return true;
}
