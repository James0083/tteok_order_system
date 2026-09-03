/* ============================================================
   공용 유틸
   ============================================================ */
import { RITUAL_ITEMS } from './config.js';

export function fmtWon(n){ return (n || 0).toLocaleString('ko-KR') + '원'; }
export function pad2(n){ return String(n).padStart(2, '0'); }
export function fmtDate(d){ return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
export function todayStr(){ return fmtDate(new Date()); }

export function addDays(dateStr, n){
  var p = dateStr.split('-').map(Number);
  var dt = new Date(p[0], p[1] - 1, p[2]);
  dt.setDate(dt.getDate() + n);
  return fmtDate(dt);
}

export function fmtDateLong(dateStr){
  var p = dateStr.split('-').map(Number);
  var dt = new Date(p[0], p[1] - 1, p[2]);
  var days = ['일', '월', '화', '수', '목', '금', '토'];
  return p[0] + '년 ' + p[1] + '월 ' + p[2] + '일 (' + days[dt.getDay()] + ')';
}

export function esc(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
}

export function genId(prefix){
  return (prefix || 'ID') + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}

export function val(sel){
  var elx = document.querySelector(sel);
  return elx ? elx.value : '';
}

export function findRitual(id){
  for (var i = 0; i < RITUAL_ITEMS.length; i++){ if (RITUAL_ITEMS[i].id === id) return RITUAL_ITEMS[i]; }
  return null;
}

export function formatMal(n){
  var r = Math.round(n * 10) / 10;
  return r + '말';
}

export function unitName(unit){
  if (unit === 'mal') return '1말';
  if (unit === 'half') return '1/2말';
  if (unit === 'kg') return '1kg';
  if (unit === 'piece') return '낱개';
  return unit || '';
}

/* 장바구니/요약에 쓰는 "단위 × 수량" 문구 */
export function lineQtyText(item){
  if (item.unit === 'kg') return item.qty + 'kg';
  if (item.unit === 'piece') return '낱개 ' + item.qty + '개';
  return unitName(item.unit) + ' × ' + item.qty;
}

export function receiveMethodLabel(order){
  if (order.receiveMethod === 'store'){ return '매장수령 · ' + (order.storeName || '미지정'); }
  if (order.receiveMethod === 'factory'){ return '공장수령'; }
  if (order.receiveMethod === 'delivery'){
    var addr = order.address || '';
    return '배송 · ' + (addr.length > 22 ? addr.slice(0, 22) + '…' : addr);
  }
  return '-';
}

export function shortId(id){ return id ? id.slice(-8) : ''; }

/* 숫자만 입력해도 자동으로 하이픈을 넣어 전화번호 형태로 만든다.
   02(서울) 국번은 2자리, 그 외는 3자리로 처리. */
export function formatPhone(raw){
  var d = String(raw == null ? '' : raw).replace(/[^0-9]/g, '').slice(0, 11);
  if (!d) return '';
  if (d.slice(0, 2) === '02'){
    if (d.length <= 2) return d;
    if (d.length <= 5) return d.slice(0, 2) + '-' + d.slice(2);
    if (d.length <= 9) return d.slice(0, 2) + '-' + d.slice(2, d.length - 4) + '-' + d.slice(d.length - 4);
    return d.slice(0, 2) + '-' + d.slice(2, 6) + '-' + d.slice(6, 10);
  }
  if (d.length <= 3) return d;
  if (d.length <= 7) return d.slice(0, 3) + '-' + d.slice(3);
  if (d.length <= 10) return d.slice(0, 3) + '-' + d.slice(3, d.length - 4) + '-' + d.slice(d.length - 4);
  return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7, 11);
}

export function phoneDigits(raw){ return String(raw == null ? '' : raw).replace(/[^0-9]/g, ''); }

export function orderItemsSummary(order){
  var parts = [];
  order.items.forEach(function(i){
    parts.push(i.name + ' ' + lineQtyText(i) + (i.cut ? (' (' + i.cut + ')') : ''));
  });
  order.ritual.forEach(function(r){ parts.push(r.name + ' ' + r.sets + '세트'); });
  return parts.map(function(t, idx){ return (idx + 1) + '. ' + t; }).join('\n');
}
