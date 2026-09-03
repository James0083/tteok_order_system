/* ============================================================
   떡 종류 카탈로그 (Supabase products 테이블 기반, 런타임 조회)
   ------------------------------------------------------------
   실제 목록은 state.products 에 로드되어 있고, 여기서는
   조회 헬퍼만 제공합니다. RITUAL_ITEMS(제사용 편)는 고정이라
   utils.findRitual 을 그대로 사용합니다.
   ============================================================ */
import { state } from '../../core/state.js';

/* 판매중 상품만, 이름 가나다순 */
export function activeProducts(){
  return state.products
    .filter(function(p){ return p.active !== false; })
    .slice()
    .sort(function(a, b){ return a.name.localeCompare(b.name, 'ko'); });
}

/* 판매중지 포함 전체, 이름 가나다순 (관리자 설정용) */
export function allProducts(){
  return state.products.slice().sort(function(a, b){ return a.name.localeCompare(b.name, 'ko'); });
}

export function findProduct(id){
  var pid = Number(id);
  for (var i = 0; i < state.products.length; i++){
    if (state.products[i].id === pid) return state.products[i];
  }
  return null;
}

export function nextProductId(){
  var max = 0;
  state.products.forEach(function(p){ if (p.id > max) max = p.id; });
  return max + 1;
}
