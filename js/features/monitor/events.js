/* ============================================================
   모니터링 탭 이벤트 (날짜 이동 / 새로고침 / 인쇄)
   ============================================================ */
import { state } from '../../core/state.js';
import { addDays, todayStr } from '../../core/utils.js';
import { render } from '../../core/app.js';
import { refreshOrders } from '../order/data.js';
import { printProductionSheets } from '../production/print.js';

export function handleClick(btn){
  switch (btn.getAttribute('data-action')){
    case 'monitor-date-prev': { state.monitor.date = addDays(state.monitor.date, -1); render(); return true; }
    case 'monitor-date-next': { state.monitor.date = addDays(state.monitor.date, 1); render(); return true; }
    case 'monitor-date-today': { state.monitor.date = todayStr(); render(); return true; }
    case 'monitor-refresh': { refreshOrders().then(render); return true; }
    case 'monitor-print': {
      printProductionSheets({
        date: state.monitor.date,
        orders: state.orders.filter(function(o){ return o.deliveryDate === state.monitor.date; }),
        mode: 'monitor',
      });
      return true;
    }
  }
  return false;
}

export function handleInput(t){
  if (t.id === 'monitor-date'){ state.monitor.date = t.value; render(); return true; }
  return false;
}
