/* ============================================================
   주문 저장소 (Supabase orders 테이블)
   ------------------------------------------------------------
   주문 1건 = 1 row. 모든 함수는 Promise 를 반환합니다.
   ============================================================ */
import { supabase } from '../../core/supabase.js';
import { state } from '../../core/state.js';

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
