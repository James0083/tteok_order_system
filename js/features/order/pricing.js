/* ============================================================
   가격 계산
   ============================================================ */
import { SURCHARGE_PER_MAL } from '../../core/config.js';
import { findRitual } from '../../core/utils.js';
import { findProduct } from './catalog.js';
import { state } from '../../core/state.js';

export function unitPriceOf(product, unit){
  if (!product) return 0;
  if (unit === 'mal') return product.mal || 0;
  if (unit === 'half') return product.half || 0;
  if (unit === 'kg') return product.kg || 0;
  if (unit === 'piece') return product.piecePrice || 0;
  return 0;
}

/* half 있으면 half/5, 없으면 mal/10 */
export function computeKgPrice(mal, half){
  if (half != null && half > 0) return Math.round(half / 5);
  if (mal != null && mal > 0) return Math.round(mal / 10);
  return 0;
}

/* 수량 유효성: kg 는 0.5 단위, 그 외는 1 이상 정수 */
export function isValidQty(unit, qty){
  var n = Number(qty);
  if (!(n > 0)) return false;
  if (unit === 'kg') return n >= 0.5 && Math.round(n * 2) === n * 2;
  return n >= 1 && Number.isInteger(n);
}

/* 입력 수량을 담기 직전 규칙에 맞게 보정 */
export function normalizeQty(unit, qty){
  var n = Number(qty) || 0;
  if (unit === 'kg') return Math.max(0.5, Math.round(n * 2) / 2);
  return Math.max(1, Math.round(n));
}

/* 주문 단위 → 말(10kg) 환산 계수. 낱개는 0 (중량 무시). */
export function unitToMal(unit){
  if (unit === 'mal') return 1;
  if (unit === 'half') return 0.5;
  if (unit === 'kg') return 0.1;
  return 0;
}

export function computeSurcharge(items){
  if (!items.length) return { applies:false, units:0, amount:0 };
  var allEligible = items.every(function(i){
    var p = findProduct(i.productId);
    return !!(p && p.surchargeEligible);
  });
  if (!allEligible) return { applies:false, units:0, amount:0 };
  var units = items.reduce(function(s, i){ return s + i.qty * unitToMal(i.unit); }, 0);
  if (units <= 0) return { applies:false, units:0, amount:0 };
  return { applies:true, units:units, amount: Math.round(units * SURCHARGE_PER_MAL) };
}

export function collectOrderFromDraft(){
  var items = state.draft.items.map(function(line){
    var p = findProduct(line.productId);
    var price = unitPriceOf(p, line.unit);
    return {
      productId:p.id, name:p.name, unit:line.unit, qty:line.qty, cut:line.cut || null,
      lineTotal: price * line.qty,
    };
  });
  var ritual = [];
  state.draft.ritual.forEach(function(r){
    if ((r.sets || 0) > 0){
      var def = findRitual(r.id);
      ritual.push({ id:def.id, name:def.name, sets:r.sets, unitPrice:def.price, lineTotal:r.sets * def.price });
    }
  });
  var itemsTotal = items.reduce(function(s, i){ return s + i.lineTotal; }, 0)
    + ritual.reduce(function(s, i){ return s + i.lineTotal; }, 0);
  var surcharge = computeSurcharge(items);
  return { items:items, ritual:ritual, itemsTotal:itemsTotal, surcharge:surcharge, total: itemsTotal + surcharge.amount };
}
