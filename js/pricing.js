/* ============================================================
   가격 계산
   ============================================================ */
import { SURCHARGE_PER_MAL } from './config.js';
import { findRitual } from './utils.js';
import { findProduct } from './catalog.js';
import { state } from './state.js';

export function unitPriceOf(product, unit){ return unit === 'mal' ? product.mal : product.half; }

export function computeSurcharge(items){
  if (!items.length) return { applies:false, units:0, amount:0 };
  var allEligible = items.every(function(i){
    var p = findProduct(i.productId);
    return !!(p && p.surchargeEligible);
  });
  if (!allEligible) return { applies:false, units:0, amount:0 };
  var units = items.reduce(function(s, i){ return s + (i.unit === 'mal' ? i.qty : i.qty * 0.5); }, 0);
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
