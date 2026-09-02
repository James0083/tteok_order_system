/* ============================================================
   전역 상태
   ============================================================ */
import { RITUAL_ITEMS } from './config.js';
import { addDays, todayStr } from './utils.js';

export function makeEmptyDraft(){
  return {
    items: [],                                        // 담긴 떡 목록 (장바구니)
    picker: { productId:'', unit:'', qty:1, cut:'' },  // 떡 담기 진행 중 선택값
    ritual: RITUAL_ITEMS.map(function(r){ return { id:r.id, sets:0 }; }),
  };
}

export const state = {
  tab: 'order',
  orders: [],
  stores: [],
  products: [],
  draft: makeEmptyDraft(),
  formFields: { phone:'', date: addDays(todayStr(), 3), memo:'', receiveMethod:'', storeName:'', address:'', inStore:false },
  editing: null,          // { orderId, returnTab }
  submitError: '',
  confirmation: null,
  /* 모니터링·관리자 탭 공용 직원 로그인 (Supabase Auth) */
  auth: {
    session: null,        // supabase-js session 객체, 로그인 전엔 null
    emailInput: '',
    passwordInput: '',
    error: '',
    busy: false,
  },
  admin: {
    view:'dashboard',     // 'dashboard' | 'settings'
    date: addDays(todayStr(), 1),
    deleteConfirmId:null,
    banner:'',
    search:'',            // 연락처 검색어 (비어있으면 날짜별 뷰)
    searched:false,       // 검색 실행됨 → 결과 카드 표시 중
    searchResults:[],
    settingsForm:{
      newStoreName:'', newStoreAddr:'', storeMsg:'', storeMsgType:'',
      prodName:'', prodMal:'', prodHalf:'', prodKg:'', prodPiece:'', prodCut:false, prodNote:'', prodSurcharge:false,
      prodMsg:'', prodMsgType:'', prodDeleteId:null,
      prodEdit:null,   // 수정 중인 떡: { id, name, mal, half, kg, piecePrice, cutSelect, note, surchargeEligible }
    },
  },
  monitor: { date: todayStr() },
};

export function resetFormFields(){
  state.formFields = { phone:'', date: addDays(todayStr(), 3), memo:'', receiveMethod:'', storeName:'', address:'', inStore:false };
}

export function isStaff(){
  return !!state.auth.session;
}
