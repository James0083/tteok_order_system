/* ============================================================
   생산분 집계 (모니터링 화면 · 관리자 화면 · 인쇄물 공용)
   ------------------------------------------------------------
   주문 목록에서 품목별 총 중량 / 낱개 / 쪽수, 제사용 편 세트,
   추가요금 대상 건수를 계산한다. 렌더링은 하지 않는다.
   ============================================================ */
import { formatMal } from '../../core/utils.js';
import { findProduct } from '../order/catalog.js';
import { unitToMal } from '../order/pricing.js';

/* 주문들의 총 생산 중량(kg) + 낱개 개수 */
export function weightSummary(orders){
  var kg = 0, pieces = 0;
  orders.forEach(function(o){
    o.items.forEach(function(i){
      if (i.unit === 'piece'){ pieces += i.qty; }
      else { kg += i.qty * unitToMal(i.unit) * 10; }
    });
  });
  return { kg: Math.round(kg * 10) / 10, pieces: pieces };
}

export function weightText(orders){
  var w = weightSummary(orders);
  return w.kg.toLocaleString('ko-KR') + 'kg' + (w.pieces ? ' + 낱개 ' + w.pieces + '개' : '');
}

/* 품목별 집계 + 제사용 편 + 추가요금 건수 */
export function aggregateProduction(orders){
  var totals = {};
  orders.forEach(function(o){
    o.items.forEach(function(i){
      if (!totals[i.productId]){
        var p = findProduct(i.productId);
        totals[i.productId] = { name: (p && p.name) || i.name || ('#' + i.productId), malEq:0, pieces:0, cuts:{} };
      }
      totals[i.productId].malEq += i.qty * unitToMal(i.unit);
      if (i.unit === 'piece'){ totals[i.productId].pieces += i.qty; }
      if (i.cut){ totals[i.productId].cuts[i.cut] = (totals[i.productId].cuts[i.cut] || 0) + 1; }
    });
  });
  var items = Object.keys(totals).map(function(k){ return totals[k]; })
    .sort(function(a, b){ return a.name.localeCompare(b.name, 'ko'); });

  var ritualTotals = {};
  orders.forEach(function(o){
    o.ritual.forEach(function(r){
      if (!ritualTotals[r.id]) ritualTotals[r.id] = { sets:0, name:r.name };
      ritualTotals[r.id].sets += r.sets;
    });
  });
  var rituals = Object.keys(ritualTotals).map(function(k){ return ritualTotals[k]; });

  var surchargeCount = orders.filter(function(o){ return o.surchargeApplies; }).length;
  return { items: items, rituals: rituals, surchargeCount: surchargeCount };
}

/* 집계 품목 1건의 "수량 (중량)" 문구 */
export function productionQtyText(t){
  var kg = Math.round(t.malEq * 10 * 10) / 10;
  var parts = [];
  if (kg > 0){ parts.push(kg + 'kg (' + formatMal(t.malEq) + ')'); }
  if (t.pieces > 0){ parts.push('낱개 ' + t.pieces + '개'); }
  return parts.join(' + ') || '-';
}

export function productionCutNote(t){
  return Object.keys(t.cuts).length
    ? Object.keys(t.cuts).map(function(k){ return k + ' x' + t.cuts[k]; }).join(', ')
    : '';
}
