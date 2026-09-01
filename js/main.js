/* ============================================================
   앱 진입점
   ------------------------------------------------------------
   index.html 에서 <script type="module" src="./js/main.js"> 로 로드.
   모듈 스크립트는 defer 로 동작하므로 DOM 준비 후 실행됩니다.
   ============================================================ */
import { state } from './state.js';
import { render } from './render/index.js';
import { initEvents } from './events.js';
import { isConfigured } from './supabaseClient.js';
import { loadOrders, loadConfig, loadStores, loadProducts /*, seedProductsIfEmpty */ } from './store.js';

initEvents();
render();

(async function init(){
  try {
    // 최초 1회 시딩 완료됨. 매 로드마다 count 쿼리를 날리지 않도록 주석 처리.
    // products 테이블을 비우고 다시 채우려면 아래 줄과 store.js 의 import 를 되살리세요.
    // await seedProductsIfEmpty();
    const [orders, config, stores, products] = await Promise.all([
      loadOrders(), loadConfig(), loadStores(), loadProducts(),
    ]);
    state.orders = orders;
    state.config = config;
    state.stores = stores;
    state.products = products;
    render();
    if (!isConfigured){
      console.warn('[tteok] 백엔드 미설정 상태로 실행 중입니다. 데이터가 저장되지 않습니다.');
    }
  } catch (err){
    console.error('[tteok] 초기 데이터 로드 실패', err);
    render();
  }
})();
