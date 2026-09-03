/* ============================================================
   주문하기 탭 이벤트 (담기 / 제사용 편 / 수령방법 / 제출 / 수정)
   ============================================================ */
import { state, makeEmptyDraft, resetFormFields } from '../../core/state.js';
import { formatPhone } from '../../core/utils.js';
import { render } from '../../core/app.js';
import { findProduct } from './catalog.js';
import {
  renderReceiveDetail, renderPickerPanel, renderCartList,
  updateGrandTotal, updateRitualSub, refreshPickerAddButton, renderDateNotice,
} from './view.js';
import { submitOrder, startEditOrder, cancelMyOrder } from './actions.js';

export function handleClick(btn, e){
  var action = btn.getAttribute('data-action');
  var id = btn.getAttribute('data-id');

  switch (action){
    case 'pick-receive': {
      var method = btn.getAttribute('data-method');
      state.formFields.receiveMethod = method;
      state.formFields.storeName = ''; state.formFields.address = '';
      document.querySelectorAll('.method-btn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      document.getElementById('receive-detail').innerHTML = renderReceiveDetail();
      return true;
    }
    case 'add-cart-line': {
      var picker = state.draft.picker;
      var product = findProduct(Number(picker.productId));
      var minQ = picker.unit === 'kg' ? 0.5 : 1;
      var q = Number(picker.qty) > 0 ? Number(picker.qty) : minQ;
      if (picker.unit === 'piece') q = Math.max(1, Math.round(q));
      state.draft.items.push({ productId:product.id, unit:picker.unit, qty:q, cut:picker.cut || '' });
      state.draft.picker = { productId:'', unit:'', qty:1, cut:'' };
      document.getElementById('picker-panel').innerHTML = renderPickerPanel();
      document.getElementById('cart-list').innerHTML = renderCartList();
      updateGrandTotal();
      return true;
    }
    case 'remove-cart-line': {
      var idx = Number(btn.getAttribute('data-idx'));
      state.draft.items.splice(idx, 1);
      document.getElementById('cart-list').innerHTML = renderCartList();
      updateGrandTotal();
      return true;
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
      return true;
    }
    case 'reset-order': {
      state.draft = makeEmptyDraft();
      resetFormFields();
      state.submitError = '';
      render();
      return true;
    }
    case 'submit-order': { submitOrder(); return true; }
    case 'new-order': {
      state.confirmation = null;
      state.draft = makeEmptyDraft();
      resetFormFields();
      render();
      return true;
    }
    case 'cancel-edit': {
      var back = state.editing ? state.editing.returnTab : 'admin';
      state.editing = null;
      state.draft = makeEmptyDraft();
      resetFormFields();
      state.tab = back;
      render();
      return true;
    }
    case 'edit-order': { startEditOrder(id, btn.getAttribute('data-return') || 'admin'); return true; }
    case 'cancel-my-order': { cancelMyOrder(id); return true; }
  }
  return false;
}

export function handleInput(t){
  if (t.id === 'pick-qty'){
    var num = parseFloat(t.value);
    state.draft.picker.qty = isNaN(num) ? 0 : Math.max(0, num);
    refreshPickerAddButton();
    return true;
  }
  if (t.matches('input[data-field="rsets"]')){
    var rid = t.getAttribute('data-id');
    var rItem = state.draft.ritual.find(function(r){ return r.id === rid; });
    var n = parseInt(t.value, 10);
    rItem.sets = isNaN(n) ? 0 : Math.max(0, n);
    updateRitualSub(rid);
    updateGrandTotal();
    return true;
  }
  if (t.id === 'f-phone'){
    var fp = formatPhone(t.value);
    t.value = fp;
    try { t.setSelectionRange(fp.length, fp.length); } catch (err){ /* noop */ }
    state.formFields.phone = fp;
    return true;
  }
  if (t.id === 'f-memo'){ state.formFields.memo = t.value; return true; }
  if (t.id === 'f-date'){ state.formFields.date = t.value; renderDateNotice(); return true; }
  if (t.id === 'f-store-search'){ state.formFields.storeName = t.value; return true; }
  if (t.id === 'f-address'){ state.formFields.address = t.value; return true; }
  return false;
}

export function handleChange(t){
  if (t.id === 'pick-product'){
    state.draft.picker = { productId:t.value, unit:'', qty:1, cut:'' };
    document.getElementById('picker-panel').innerHTML = renderPickerPanel();
    return true;
  }
  if (t.id === 'pick-unit'){
    state.draft.picker.unit = t.value;
    state.draft.picker.qty = t.value === 'piece' ? 10 : 1;
    state.draft.picker.cut = '';
    document.getElementById('picker-panel').innerHTML = renderPickerPanel();
    return true;
  }
  if (t.id === 'pick-cut'){
    state.draft.picker.cut = t.value;
    refreshPickerAddButton();
    return true;
  }
  if (t.id === 'f-in-store'){
    state.formFields.inStore = t.checked;
    render();
    return true;
  }
  return false;
}
