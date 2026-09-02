/* ============================================================
   기본값 / 상수 / 상품 데이터
   ------------------------------------------------------------
   PIN 방식 직원 인증은 폐지되었습니다. 주문조회·모니터링·관리자
   탭은 Supabase Auth 로그인(js/auth.js)으로 보호됩니다.
   ============================================================ */

export const CONTACT = {
  phone1: '031-774-2452',
  phone2: '010-9023-2452',
  hours: '9:30 ~ 15:00',
};

/* ============================================================
   상품 기본 데이터 (2026.08 가격표 기준)
   ------------------------------------------------------------
   실제 상품 목록은 Supabase `products` 테이블에서 관리되고,
   관리자 설정 화면에서 추가/수정/삭제할 수 있습니다.
   이 배열은 products 테이블이 비어 있을 때 시딩 / 오프라인 폴백용.
   Supabase 로 통째 넣을 CSV: supabase/products.csv

   필드:
     mal          1말(10kg) 가격
     half         1/2말(5kg) 가격 (없으면 null)
     kg           1kg 가격 (half 있으면 half/5, 없으면 mal/10)
     piecePrice   낱개(1개) 가격, 0 이면 낱개 주문 불가
     cutSelect    쪽수(40/50/60쪽) 선택 필요
     surchargeEligible  이 품목들만으로 주문 시 1말당 10,000원 추가
   ============================================================ */
var NOTE_120 = '1말 낱개 120개로 제공됩니다.';
export const DEFAULT_PRODUCTS = [
  {id:1,  name:'가래떡',              mal:60000,  half:30000, kg:6000},
  {id:2,  name:'떡국떡',              mal:70000,  half:35000, kg:7000},
  {id:3,  name:'떡볶이떡',            mal:60000,  half:30000, kg:6000},
  {id:4,  name:'혼합절편',            mal:70000,  half:35000, kg:7000,  surchargeEligible:true},
  {id:5,  name:'약식',                mal:120000, half:60000, kg:12000, piecePrice:1000, note:NOTE_120},
  {id:6,  name:'바람떡',              mal:100000, half:50000, kg:10000, surchargeEligible:true},
  {id:7,  name:'꿀떡',                mal:100000, half:50000, kg:10000},
  {id:8,  name:'고사떡(메시루 7:3)',  mal:110000, half:60000, kg:12000},
  {id:9,  name:'찰고사떡(찰시루떡)',  mal:120000, half:65000, kg:13000},
  {id:10, name:'흑임자인절미',        mal:130000, half:65000, kg:13000},
  {id:11, name:'영양찰떡(호박)',      mal:120000, half:60000, kg:12000, piecePrice:1000, note:NOTE_120},
  {id:12, name:'영양찰떡(흑미)',      mal:120000, half:60000, kg:12000, piecePrice:1000, note:NOTE_120},
  {id:13, name:'영양찰떡(흰쌀)',      mal:120000, half:60000, kg:12000, piecePrice:1000, note:NOTE_120},
  {id:14, name:'동부인절미(흰쌀)',    mal:120000, half:60000, kg:12000},
  {id:15, name:'동부인절미(쑥)',      mal:120000, half:60000, kg:12000},
  {id:16, name:'콩가루인절미(흰쌀)',  mal:120000, half:60000, kg:12000},
  {id:17, name:'콩가루인절미(쑥)',    mal:120000, half:60000, kg:12000},
  {id:18, name:'수수팥단지',          mal:130000, half:65000, kg:13000},
  {id:19, name:'동부편',              mal:110000, half:60000, kg:12000},
  {id:20, name:'콩시루편',            mal:110000, half:60000, kg:12000},
  {id:21, name:'쑥개떡',              mal:120000, half:60000, kg:12000, surchargeEligible:true},
  {id:22, name:'송편(모시)',          mal:120000, half:60000, kg:12000},
  {id:23, name:'송편(동부)',          mal:120000, half:60000, kg:12000},
  {id:24, name:'송편(깨)',            mal:120000, half:60000, kg:12000},
  {id:25, name:'무지개떡',            mal:100000, half:50000, kg:10000, cutSelect:true},
  {id:26, name:'콩설기',              mal:100000, half:50000, kg:10000, cutSelect:true},
  {id:27, name:'모찌떡',              mal:130000, half:65000, kg:13000},
  {id:28, name:'백설기',              mal:80000,  half:40000, kg:8000,  cutSelect:true},
  {id:29, name:'수리취찰떡',          mal:130000, half:65000, kg:13000},
  {id:30, name:'증편',                mal:120000, half:60000, kg:12000},
  {id:31, name:'마구설기(콩)',        mal:100000, half:50000, kg:10000, cutSelect:true},
  {id:32, name:'밥알쑥찰떡',          mal:120000, half:60000, kg:12000, piecePrice:1000, note:NOTE_120},
  {id:33, name:'찐밥',                mal:80000,  half:null,  kg:8000},
  {id:34, name:'오곡밥',              mal:120000, half:null,  kg:12000},
  {id:35, name:'마구설기(쑥)',        mal:100000, half:50000, kg:10000, cutSelect:true},
  {id:36, name:'마구설기(호박)',      mal:100000, half:50000, kg:10000, cutSelect:true},
  {id:37, name:'마구설기(흑미)',      mal:100000, half:50000, kg:10000, cutSelect:true},
];

export const RITUAL_ITEMS = [
  {id:'r1', name:'동부편(제사용 3쪽)',       price:12000},
  {id:'r2', name:'콩시루편(제사용 3쪽)',     price:12000},
  {id:'r3', name:'동부인절미편(제사용 3쪽)', price:15000},
  {id:'r4', name:'콩인절미편(제사용 3쪽)',   price:15000},
];

export const CUT_OPTIONS = ['40쪽', '50쪽', '60쪽'];

/* surchargeEligible 상품들만으로 주문 시 1말 기준 10,000원 자동 추가 */
export const SURCHARGE_PER_MAL = 10000;
