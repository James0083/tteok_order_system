/* ============================================================
   매장 / 떡 종류 저장소 (Supabase stores · products 테이블)
   ------------------------------------------------------------
   매장 1개 = 1 row, 떡 종류 1개 = 1 row. 모두 Promise 반환.
   ============================================================ */
import { supabase } from '../../core/supabase.js';
import { DEFAULT_PRODUCTS } from '../../core/config.js';
import { state } from '../../core/state.js';

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
  // id 는 stores 테이블 default 로 자동 생성됩니다.
  const { error } = await supabase
    .from('stores')
    .insert({ name: store.name, address: store.address || null });
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
    kg: r.kg || 0,
    piecePrice: r.piece_price || 0,
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
    kg: p.kg || 0,
    piece_price: p.piecePrice || 0,
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
   이 함수와 main.js 의 호출/임포트를 되살리세요.
   const rows = DEFAULT_PRODUCTS.map(productToRow); 로 insert. */

export async function insertProduct(p){
  if (!supabase) return false;
  const { error } = await supabase.from('products').insert(productToRow(p));
  if (error){ console.error('insertProduct', error); return false; }
  return true;
}

export async function updateProduct(id, patch){
  if (!supabase) return false;
  const map = {
    name:'name', mal:'mal', half:'half', kg:'kg', piecePrice:'piece_price',
    cutSelect:'cut_select', note:'note', surchargeEligible:'surcharge_eligible', active:'active',
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
