/* ============================================================
   이벤트 위임 (#app 에 한 번만 바인딩)
   ============================================================ */
import { state, makeEmptyDraft, resetFormFields } from './state.js';
import { addDays, todayStr, formatPhone } from './utils.js';
import { findProduct } from './catalog.js';
import { refreshOrders } from './store.js';
import { render } from './render/index.js';
import {
  renderReceiveDetail, renderPickerPanel, renderCartList,
  updateGrandTotal, updateRitualSub, refreshPickerAddButton, renderDateNotice,
} from './render/order.js';
import { submitOrder, doLookup, startEditOrder, cancelMyOrder } from './orders.js';
import {
  adminUnlock, monitorUnlock, changeOrderStatus, deleteOrder,
  saveAdminPin, saveStaffPin, addStore, deleteStore,
  addProduct, deleteProduct, saveProductEdit,
} from './admin.js';

export function initEvents(){
  var app = document.getElementById('app');

  app.addEventListener('click', function(e){
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.getAttribute('data-action');
    var id = btn.getAttribute('data-id');

    switch (action){
      case 'go-tab': {
        var tab = btn.getAttribute('data-tab');
        state.tab = tab;
        state.submitError = '';
        if (tab === 'admin' && state.admin.unlocked){ refreshOrders().then(render); return; }
        if (tab === 'monitor' && state.monitor.unlocked){ refreshOrders().then(render); return; }
        render();
        break;
      }
      case 'pick-receive': {
        var method = btn.getAttribute('data-method');
        state.formFields.receiveMethod = method;
        state.formFields.storeName = ''; state.formFields.address = '';
        document.querySelectorAll('.method-btn').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        document.getElementById('receive-detail').innerHTML = renderReceiveDetail();
        break;
      }
      case 'add-cart-line': {
        var picker = state.draft.picker;
        var product = findProduct(Number(picker.productId));
        state.draft.items.push({ productId:product.id, unit:picker.unit, qty:Math.max(1, picker.qty || 1), cut:picker.cut || '' });
        state.draft.picker = { productId:'', unit:'', qty:1, cut:'' };
        document.getElementById('picker-panel').innerHTML = renderPickerPanel();
        document.getElementById('cart-list').innerHTML = renderCartList();
        updateGrandTotal();
        break;
      }
      case 'remove-cart-line': {
        var idx = Number(btn.getAttribute('data-idx'));
        state.draft.items.splice(idx, 1);
        document.getElementById('cart-list').innerHTML = renderCartList();
        updateGrandTotal();
        break;
      }
      case 'inc-ritual':
      case 'dec-ritual': {
        var rItem = state.draft.ritual.find(function(r){ return r.id === id; });
        var d = action.indexOf('inc') > -1 ? 1 : -1;
        rItem.sets = Math.max(0, (rItem.sets || 0) + d);
        var rInput = document.querySelector('input[data-field="rsets"][data-id="' + id + '"]');
        if (rInput) rInput.value = rItem.sets;
        updateRitualSub(id);
        updateGrandTotal();
        break;
      }
      case 'reset-order': {
        state.draft = makeEmptyDraft();
        resetFormFields();
        state.submitError = '';
        render();
        break;
      }
      case 'submit-order': { submitOrder(); break; }
      case 'new-order': {
        state.confirmation = null;
        state.draft = makeEmptyDraft();
        resetFormFields();
        render();
        break;
      }
      case 'cancel-edit': {
        var back = state.editing ? state.editing.returnTab : 'lookup';
        state.editing = null;
        state.draft = makeEmptyDraft();
        resetFormFields();
        state.tab = back;
        render();
        break;
      }
      case 'do-lookup': { doLookup(); break; }
      case 'edit-order': { startEditOrder(id, btn.getAttribute('data-return') || 'lookup'); break; }
      case 'cancel-my-order': { cancelMyOrder(id); break; }

      case 'admin-unlock': { adminUnlock(); break; }
      case 'admin-date-prev': { state.admin.date = addDays(state.admin.date, -1); render(); break; }
      case 'admin-date-next': { state.admin.date = addDays(state.admin.date, 1); render(); break; }
      case 'admin-date-today': { state.admin.date = addDays(todayStr(), 1); render(); break; }
      case 'admin-refresh': { refreshOrders().then(function(){ state.admin.banner = ''; render(); }); break; }
      case 'admin-print': { window.print(); break; }
      case 'admin-open-settings': { state.admin.view = 'settings'; render(); break; }
      case 'admin-back-dashboard': { state.admin.view = 'dashboard'; render(); break; }
      case 'admin-delete': { state.admin.deleteConfirmId = id; render(); break; }
      case 'admin-delete-cancel': { state.admin.deleteConfirmId = null; render(); break; }
      case 'admin-delete-confirm': { deleteOrder(id); break; }
      case 'save-admin-pin': { saveAdminPin(); break; }
      case 'save-staff-pin': { saveStaffPin(); break; }
      case 'add-store': { addStore(); break; }
      case 'delete-store': { deleteStore(id); break; }
      case 'add-product': { addProduct(); break; }
      case 'delete-product': { state.admin.settingsForm.prodDeleteId = id; render(); break; }
      case 'delete-product-cancel': { state.admin.settingsForm.prodDeleteId = null; render(); break; }
      case 'delete-product-confirm': { deleteProduct(id); break; }
      case 'edit-product': {
        var ep = findProduct(Number(id));
        if (ep){
          state.admin.settingsForm.prodDeleteId = null;
          state.admin.settingsForm.prodEdit = {
            id: ep.id,
            name: ep.name,
            mal: String(ep.mal),
            half: ep.half == null ? '' : String(ep.half),
            note: ep.note || '',
            cutSelect: !!ep.cutSelect,
            surchargeEligible: !!ep.surchargeEligible,
          };
          render();
        }
        break;
      }
      case 'edit-product-cancel': { state.admin.settingsForm.prodEdit = null; render(); break; }
      case 'save-product': { saveProductEdit(); break; }

      case 'monitor-unlock': { monitorUnlock(); break; }
      case 'monitor-date-prev': { state.monitor.date = addDays(state.monitor.date, -1); render(); break; }
      case 'monitor-date-next': { state.monitor.date = addDays(state.monitor.date, 1); render(); break; }
      case 'monitor-date-today': { state.monitor.date = todayStr(); render(); break; }
      case 'monitor-refresh': { refreshOrders().then(render); break; }
      case 'monitor-print': { window.print(); break; }
    }
  });

  app.addEventListener('input', function(e){
    var t = e.target;
    if (t.id === 'pick-qty'){
      var num = parseInt(t.value, 10);
      state.draft.picker.qty = isNaN(num) ? 0 : Math.max(0, num);
      refreshPickerAddButton();
    } else if (t.matches('input[data-field="rsets"]')){
      var rid = t.getAttribute('data-id');
      var rItem2 = state.draft.ritual.find(function(r){ return r.id === rid; });
      var num2 = parseInt(t.value, 10);
      rItem2.sets = isNaN(num2) ? 0 : Math.max(0, num2);
      updateRitualSub(rid);
      updateGrandTotal();
    } else if (t.id === 'f-phone'){
      var fp = formatPhone(t.value);
      t.value = fp;
      try { t.setSelectionRange(fp.length, fp.length); } catch (err){ /* noop */ }
      state.formFields.phone = fp;
    } else if (t.id === 'f-memo'){
      state.formFields.memo = t.value;
    } else if (t.id === 'f-date'){
      state.formFields.date = t.value;
      renderDateNotice();
    } else if (t.id === 'f-store-search'){
      state.formFields.storeName = t.value;
    } else if (t.id === 'f-address'){
      state.formFields.address = t.value;
    } else if (t.id === 'admin-date'){
      state.admin.date = t.value; render();
    } else if (t.id === 'monitor-date'){
      state.monitor.date = t.value; render();
    } else if (t.id === 'admin-pin'){
      state.admin.pinInput = t.value;
    } else if (t.id === 'monitor-pin'){
      state.monitor.pinInput = t.value;
    } else if (t.id === 'lookup-phone'){
      var lp = formatPhone(t.value);
      t.value = lp;
      try { t.setSelectionRange(lp.length, lp.length); } catch (err){ /* noop */ }
      state.lookup.phone = lp;
    } else if (t.id === 'set-admin-pin-new'){
      state.admin.settingsForm.adminPinNew = t.value;
    } else if (t.id === 'set-admin-pin-confirm'){
      state.admin.settingsForm.adminPinConfirm = t.value;
    } else if (t.id === 'set-staff-pin-new'){
      state.admin.settingsForm.staffPinNew = t.value;
    } else if (t.id === 'set-staff-pin-confirm'){
      state.admin.settingsForm.staffPinConfirm = t.value;
    } else if (t.id === 'set-store-name'){
      state.admin.settingsForm.newStoreName = t.value;
    } else if (t.id === 'set-store-addr'){
      state.admin.settingsForm.newStoreAddr = t.value;
    } else if (t.id === 'set-prod-name'){
      state.admin.settingsForm.prodName = t.value;
    } else if (t.id === 'set-prod-mal'){
      state.admin.settingsForm.prodMal = t.value;
    } else if (t.id === 'set-prod-half'){
      state.admin.settingsForm.prodHalf = t.value;
    } else if (t.id === 'set-prod-note'){
      state.admin.settingsForm.prodNote = t.value;
    } else if (t.id.indexOf('edit-prod-') === 0 && state.admin.settingsForm.prodEdit){
      var ef = t.id.slice('edit-prod-'.length);
      var pe = state.admin.settingsForm.prodEdit;
      if (ef === 'name') pe.name = t.value;
      else if (ef === 'mal') pe.mal = t.value;
      else if (ef === 'half') pe.half = t.value;
      else if (ef === 'note') pe.note = t.value;
    }
  });

  app.addEventListener('change', function(e){
    var t = e.target;
    if (t.id === 'pick-product'){
      state.draft.picker = { productId:t.value, unit:'', qty:1, cut:'' };
      document.getElementById('picker-panel').innerHTML = renderPickerPanel();
    } else if (t.id === 'pick-unit'){
      state.draft.picker.unit = t.value;
      state.draft.picker.qty = state.draft.picker.qty || 1;
      document.getElementById('picker-panel').innerHTML = renderPickerPanel();
    } else if (t.id === 'pick-cut'){
      state.draft.picker.cut = t.value;
      refreshPickerAddButton();
    } else if (t.id === 'f-in-store'){
      state.formFields.inStore = t.checked;
      render();
    } else if (t.id === 'set-prod-cut'){
      state.admin.settingsForm.prodCut = t.checked;
    } else if (t.id === 'set-prod-surcharge'){
      state.admin.settingsForm.prodSurcharge = t.checked;
    } else if (t.id === 'edit-prod-cut' && state.admin.settingsForm.prodEdit){
      state.admin.settingsForm.prodEdit.cutSelect = t.checked;
    } else if (t.id === 'edit-prod-surcharge' && state.admin.settingsForm.prodEdit){
      state.admin.settingsForm.prodEdit.surchargeEligible = t.checked;
    } else if (t.matches('select[data-action-select="status"]')){
      changeOrderStatus(t.getAttribute('data-id'), t.value);
    }
  });

  app.addEventListener('keydown', function(e){
    if (e.key === 'Enter' && e.target && e.target.id === 'admin-pin'){ adminUnlock(); }
    if (e.key === 'Enter' && e.target && e.target.id === 'monitor-pin'){ monitorUnlock(); }
    if (e.key === 'Enter' && e.target && e.target.id === 'lookup-phone'){ doLookup(); }
  });
}
