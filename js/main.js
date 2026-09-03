/* ============================================================
   앱 진입점
   ------------------------------------------------------------
   index.html 에서 <script type="module" src="./js/main.js"> 로 로드.
   모듈 스크립트는 defer 로 동작하므로 DOM 준비 후 실행됩니다.
   ============================================================ */
import { state, resetFormFields } from './core/state.js';
import { render } from './core/app.js';
import { initEvents } from './core/events.js';
import { isConfigured } from './core/supabase.js';
import { getSession, onAuthChange } from './features/auth/data.js';
import { loadOrders, refreshOrders } from './features/order/data.js';
import { loadStores, loadProducts } from './features/admin/data.js';

initEvents();
render();

/* 로그인/로그아웃을 실시간으로 반영 */
onAuthChange(function(session){
  var wasLoggedIn = !!state.auth.session;
  state.auth.session = session;
  if (session){
    state.auth.emailInput = ''; state.auth.passwordInput = ''; state.auth.error = ''; state.auth.busy = false;
    refreshOrders().then(render);
  } else if (wasLoggedIn){
    // 로그아웃: 직원 화면에 있던 데이터를 메모리에서 비우고 주문 탭으로.
    state.orders = [];
    state.admin.view = 'dashboard';
    state.admin.deleteConfirmId = null;
    state.admin.search = '';
    state.admin.searched = false;
    state.admin.searchResults = [];
    state.tab = 'order';
    resetFormFields();
    render();
  }
});

(async function init(){
  try {
    // products 최초 1회 시딩 완료됨. 매 로드마다 count 쿼리를 날리지 않도록 주석 처리.
    // 다시 시딩이 필요하면 아래 줄과 features/admin/data.js 의 시딩 코드를 되살리세요.
    // await seedProductsIfEmpty();

    // stores/products 는 주문 폼에서 누구나 봐야 하므로 로그인 여부와 무관하게 로드.
    const [stores, products, session] = await Promise.all([
      loadStores(), loadProducts(), getSession(),
    ]);
    state.stores = stores;
    state.products = products;
    state.auth.session = session;
    if (session){
      state.orders = await loadOrders();
    }
    render();
    if (!isConfigured){
      console.warn('[tteok] 백엔드 미설정 상태로 실행 중입니다. 데이터가 저장되지 않습니다.');
    }
  } catch (err){
    console.error('[tteok] 초기 데이터 로드 실패', err);
    render();
  }
})();
