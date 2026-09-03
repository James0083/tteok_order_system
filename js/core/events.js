/* ============================================================
   이벤트 위임 (#app 에 한 번만 바인딩)
   ------------------------------------------------------------
   각 기능의 events 모듈이 export 하는 handleClick /
   handleInput / handleChange / handleKeydown 에 순서대로 위임한다.
   핸들러는 자기가 처리한 경우 truthy 를 반환한다.
   탭 전환(go-tab)은 셸 레벨이라 여기서 직접 처리한다.
   ============================================================ */
import { state, isStaff } from './state.js';
import { render } from './app.js';
import { refreshOrders } from '../features/order/data.js';
import * as order from '../features/order/events.js';
import * as monitor from '../features/monitor/events.js';
import * as admin from '../features/admin/events.js';
import * as auth from '../features/auth/events.js';

var FEATURES = [order, monitor, admin, auth];

function handleGoTab(btn){
  var tab = btn.getAttribute('data-tab');
  state.tab = tab;
  state.submitError = '';
  if ((tab === 'admin' || tab === 'monitor') && isStaff()){
    refreshOrders().then(render);
    return;
  }
  render();
}

export function initEvents(){
  var app = document.getElementById('app');

  app.addEventListener('click', function(e){
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.getAttribute('data-action') === 'go-tab'){ handleGoTab(btn); return; }
    for (var i = 0; i < FEATURES.length; i++){
      if (FEATURES[i].handleClick && FEATURES[i].handleClick(btn, e)) return;
    }
  });

  app.addEventListener('input', function(e){
    for (var i = 0; i < FEATURES.length; i++){
      if (FEATURES[i].handleInput && FEATURES[i].handleInput(e.target, e)) return;
    }
  });

  app.addEventListener('change', function(e){
    for (var i = 0; i < FEATURES.length; i++){
      if (FEATURES[i].handleChange && FEATURES[i].handleChange(e.target, e)) return;
    }
  });

  app.addEventListener('keydown', function(e){
    for (var i = 0; i < FEATURES.length; i++){
      if (FEATURES[i].handleKeydown && FEATURES[i].handleKeydown(e)) return;
    }
  });
}
