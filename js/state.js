/* ============================================================
   전역 상태
   ============================================================ */
import { RITUAL_ITEMS, DEFAULT_ADMIN_PIN, DEFAULT_STAFF_PIN } from './config.js';
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
  config: { adminPin: DEFAULT_ADMIN_PIN, staffPin: DEFAULT_STAFF_PIN },
  draft: makeEmptyDraft(),
  formFields: { phone:'', date: addDays(todayStr(), 3), memo:'', receiveMethod:'', storeName:'', address:'', inStore:false },
  editing: null,          // { orderId, returnTab }
  submitError: '',
  confirmation: null,
  lookup: { phone:'', searched:false, results:[] },
  admin: {
    unlocked:false, pinInput:'', pinError:'',
    view:'dashboard',     // 'dashboard' | 'settings'
    date: addDays(todayStr(), 1),
    deleteConfirmId:null,
    banner:'',
    settingsForm:{
      adminPinNew:'', adminPinConfirm:'', staffPinNew:'', staffPinConfirm:'', pinMsg:'', pinMsgType:'',
      newStoreName:'', newStoreAddr:'', storeMsg:'', storeMsgType:'',
      prodName:'', prodMal:'', prodHalf:'', prodCut:false, prodNote:'', prodSurcharge:false,
      prodMsg:'', prodMsgType:'', prodDeleteId:null,
      prodEdit:null,   // 수정 중인 떡: { id, name, mal, half, cutSelect, note, surchargeEligible }
    },
  },
  monitor: { unlocked:false, pinInput:'', pinError:'', date: todayStr() },
};

export function resetFormFields(){
  state.formFields = { phone:'', date: addDays(todayStr(), 3), memo:'', receiveMethod:'', storeName:'', address:'', inStore:false };
}
