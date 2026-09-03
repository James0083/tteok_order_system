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
  submitErrorField: '',   // 제출 에러 시 스크롤/포커스할 필드 셀렉터 (1회성)
  confirmation: null,
  /* 모니터링·관리자 탭 공용 직원 로그인 (Supabase Auth) */
  auth: {
    session: null,        // supabase-js session 객체, 로그인 전엔 null
    emailInput: '',
    passwordInput: '',
    error: '',
    busy: false,
    returnTab: '',        // 로그아웃 직전의 직원 탭 → 재로그인 시 복귀
  },
  admin: {
    view:'dashboard',     // 'dashboard' | 'settings'
    date: addDays(todayStr(), 1),
    deleteConfirmId:null,
    cancelConfirmId:null,  // 검색결과 카드에서 "취소 처리" 2단계 확인
    banner:'',
    search:'',            // 연락처 검색어 (비어있으면 날짜별 뷰)
    searched:false,       // 검색 실행됨 → 결과 카드 표시 중
    searchResults:[],
    settingsForm:{
      newStoreName:'', newStoreAddr:'', storeMsg:'', storeMsgType:'', storeDeleteId:null,
      storeSearch:'',  // 매장 목록 필터
      prodName:'', prodMal:'', prodHalf:'', prodKg:'', prodPiece:'', prodCut:false, prodNote:'', prodSurcharge:false,
      prodMsg:'', prodMsgType:'', prodDeleteId:null,
      prodSearch:'',   // 떡 목록 필터
      focusId:'',      // 렌더 후 다시 포커스할 입력 id (필터 입력용, 1회성)
      prodEdit:null,   // 수정 중인 떡: { id, name, mal, half, kg, piecePrice, cutSelect, note, surchargeEligible, active }
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
