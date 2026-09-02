/* ============================================================
   렌더 : 관리자 탭 (대시보드 / 설정) — 직원 로그인 필요 (render/index.js 게이트)
   ============================================================ */
import { state } from '../state.js';
import { esc, fmtWon, fmtDateLong } from '../utils.js';
import { statCard, renderProductionSummary, renderOrderStatusTable, renderTrend, renderOrderCard, weightText } from './shared.js';
import { renderStaffBar } from './auth.js';
import { computeKgPrice } from '../pricing.js';

function digits(v){ return String(v == null ? '' : v).replace(/[^0-9]/g, ''); }

function renderSearchBar(){
  var a = state.admin;
  return '<div class="panel no-print" style="padding:12px 16px;">' +
    '<div class="field-row" style="margin-bottom:0; align-items:flex-end;">' +
      '<div class="field" style="flex:2;"><label>연락처로 주문 검색 <span class="muted">(전 기간 · 날짜 무관)</span></label>' +
        '<input id="admin-search" type="tel" inputmode="numeric" placeholder="010-0000-0000" value="' + esc(a.search) + '"></div>' +
      '<div class="field" style="flex:0 0 auto; flex-direction:row; gap:6px;">' +
        '<button class="btn btn-primary" data-action="admin-search">검색</button>' +
        (a.searched ? '<button class="btn btn-outline" data-action="admin-search-clear">날짜별 보기</button>' : '') +
      '</div>' +
    '</div>' +
  '</div>';
}

export function renderAdminTab(){
  if (state.admin.view === 'settings'){ return renderAdminSettings(); }

  var a = state.admin;

  var html = '<div class="wrap-wide">';
  html += renderStaffBar();
  if (a.banner){ html += '<div class="notice notice-info no-print" style="margin-bottom:12px;">' + esc(a.banner) + '</div>'; }

  html += renderSearchBar();

  if (a.searched){
    var r = a.searchResults;
    if (!r.length){
      html += '<div class="empty-state">"' + esc(a.search) + '" 연락처로 접수된 주문이 없습니다.</div>';
    } else {
      html += '<h2 style="margin:4px 0 12px;">검색 결과 ' + r.length + '건</h2>';
      html += r.map(renderOrderCard).join('');
    }
    html += '</div>';
    return html;
  }

  var dateOrders = state.orders.filter(function(o){ return o.deliveryDate === a.date; });
  var activeOrders = dateOrders.filter(function(o){ return o.status !== '취소'; });

  html += '<div class="date-nav no-print">';
  html += '<button class="btn btn-outline btn-sm" data-action="admin-date-prev">◀</button>';
  html += '<input type="date" id="admin-date" value="' + a.date + '">';
  html += '<button class="btn btn-outline btn-sm" data-action="admin-date-next">▶</button>';
  html += '<button class="btn btn-outline btn-sm" data-action="admin-date-today">내일</button>';
  html += '<span class="dtitle" style="margin-left:6px;">' + esc(fmtDateLong(a.date)) + ' 생산분</span>';
  html += '<span style="flex:1;"></span>';
  html += '<button class="btn btn-outline btn-sm" data-action="admin-refresh">새로고침</button>';
  html += '<button class="btn btn-jade btn-sm" data-action="admin-print">인쇄</button>';
  html += '<button class="btn btn-outline btn-sm" data-action="admin-open-settings">설정</button>';
  html += '</div>';

  var totalRevenue = activeOrders.reduce(function(s, o){ return s + o.total; }, 0);

  html += '<div class="stat-cards">';
  html += statCard('주문 건수', activeOrders.length + '건');
  html += statCard('매출 합계', fmtWon(totalRevenue));
  html += statCard('총 생산 중량', weightText(activeOrders));
  html += '</div>';

  html += '<div class="panel" id="print-area">';
  html += '<h2 style="margin-bottom:10px;">생산분 요약 — ' + esc(fmtDateLong(a.date)) + '</h2>';
  html += renderProductionSummary(activeOrders);
  html += '<h2 style="margin:20px 0 10px;">주문 목록</h2>';
  html += renderOrderStatusTable(dateOrders, true);
  html += '</div>';

  html += '<div class="panel no-print">';
  html += '<h2 style="margin-bottom:10px;">최근 일별 통계</h2>';
  html += renderTrend();
  html += '</div>';

  html += '</div>';
  return html;
}

/* ---------- 관리자 설정 (매장·떡 종류 관리) ---------- */
export function renderAdminSettings(){
  var sf = state.admin.settingsForm;
  var html = '<div class="wrap-wide">';
  html += renderStaffBar();
  html += '<div class="date-nav no-print"><span class="dtitle">관리자 설정</span><span style="flex:1;"></span>' +
    '<button class="btn btn-outline btn-sm" data-action="admin-back-dashboard">← 대시보드로</button></div>';

  html += '<div class="settings-grid">';

  html += '<div class="panel">';
  html += '<h2>매장 관리</h2>';
  html += '<p class="panel-sub">고객이 "매장 수령"에서 검색할 수 있는 매장 목록입니다.</p>';
  if (sf.storeMsg){ html += '<div class="notice ' + (sf.storeMsgType === 'error' ? 'notice-error' : 'notice-ok') + '">' + esc(sf.storeMsg) + '</div>'; }
  html += '<div class="store-list">';
  if (!state.stores.length){
    html += '<div class="empty-state">등록된 매장이 없습니다.</div>';
  } else {
    html += state.stores.map(function(s){
      return '<div class="store-row"><div><strong>' + esc(s.name) + '</strong>' + (s.address ? ('<br><span class="muted" style="font-size:12px;">' + esc(s.address) + '</span>') : '') + '</div>' +
        '<button class="link-btn" data-action="delete-store" data-id="' + s.id + '">삭제</button></div>';
    }).join('');
  }
  html += '</div>';
  html += '<div class="field-row" style="margin-top:6px;">';
  html += '<div class="field"><label>매장명</label><input id="set-store-name" type="text" placeholder="예: 산본점" value="' + esc(sf.newStoreName) + '"></div>';
  html += '<div class="field"><label>주소 (선택)</label><input id="set-store-addr" type="text" placeholder="선택 입력" value="' + esc(sf.newStoreAddr) + '"></div>';
  html += '</div>';
  html += '<button class="btn btn-outline btn-sm" data-action="add-store">매장 추가</button>';
  html += '</div>';

  html += '<div class="panel">';
  html += '<h2>직원 계정</h2>';
  html += '<p class="panel-sub">주문조회·모니터링·관리자 화면 로그인은 Supabase Auth 계정으로 관리합니다.</p>';
  html += '<div class="notice notice-info">직원 계정 추가·삭제·비밀번호 재설정은 Supabase 대시보드 → Authentication → Users 에서 합니다. 이 앱에는 회원가입 화면이 없습니다.</div>';
  html += '</div>';

  html += '</div>'; // settings-grid

  html += renderProductManager();

  html += '</div>';
  return html;
}

/* ---------- 떡 종류 관리 ---------- */
function renderProductManager(){
  var sf = state.admin.settingsForm;
  var list = state.products.slice().sort(function(a, b){ return a.name.localeCompare(b.name, 'ko'); });

  var editId = sf.prodEdit ? sf.prodEdit.id : null;

  var html = '<div class="panel">';
  html += '<h2>떡 종류 관리</h2>';
  html += '<p class="panel-sub">주문서의 "떡 담기" 드롭다운에 나오는 목록입니다. 가나다순으로 표시됩니다.</p>';
  if (sf.prodMsg){ html += '<div class="notice ' + (sf.prodMsgType === 'error' ? 'notice-error' : 'notice-ok') + '">' + esc(sf.prodMsg) + '</div>'; }

  html += '<div class="table-scroll" style="margin-bottom:12px;"><table class="dtab" style="min-width:0;">';
  html += '<thead><tr><th>떡 이름</th><th class="num">1말</th><th class="num">1/2말</th><th class="num">1kg</th><th class="num">개당</th><th>쪽수선택</th><th>추가요금</th><th class="no-print">관리</th></tr></thead><tbody>';
  if (!list.length){
    html += '<tr><td colspan="8" class="empty-state">등록된 떡이 없습니다.</td></tr>';
  } else {
    list.forEach(function(p){
      var confirming = sf.prodDeleteId === String(p.id) || sf.prodDeleteId === p.id;
      var editing = editId === p.id;
      var actions;
      if (confirming){
        actions = '<button class="btn btn-danger btn-sm no-print" data-action="delete-product-confirm" data-id="' + p.id + '">삭제 확정</button> ' +
          '<button class="btn btn-outline btn-sm no-print" data-action="delete-product-cancel">취소</button>';
      } else if (editing){
        actions = '<span class="muted" style="font-size:11.5px;">아래에서 수정 중</span>';
      } else {
        actions = '<button class="link-btn" data-action="edit-product" data-id="' + p.id + '">수정</button> · ' +
          '<button class="link-btn" data-action="delete-product" data-id="' + p.id + '">삭제</button>';
      }
      html += '<tr' + (editing ? ' style="background:var(--paper-2);"' : '') + '>' +
        '<td>' + esc(p.name) + (p.note ? ('<br><span class="muted" style="font-size:11.5px;">' + esc(p.note) + '</span>') : '') + '</td>' +
        '<td class="num tabular">' + fmtWon(p.mal) + '</td>' +
        '<td class="num tabular">' + (p.half == null ? '-' : fmtWon(p.half)) + '</td>' +
        '<td class="num tabular">' + (p.kg > 0 ? fmtWon(p.kg) : '-') + '</td>' +
        '<td class="num tabular">' + (p.piecePrice > 0 ? fmtWon(p.piecePrice) : '-') + '</td>' +
        '<td>' + (p.cutSelect ? 'O' : '-') + '</td>' +
        '<td>' + (p.surchargeEligible ? 'O' : '-') + '</td>' +
        '<td>' + actions + '</td>' +
      '</tr>';
    });
  }
  html += '</tbody></table></div>';

  if (sf.prodEdit){
    html += renderProductForm('edit', sf.prodEdit);
  } else {
    html += renderProductForm('add', {
      name: sf.prodName, mal: sf.prodMal, half: sf.prodHalf, kg: sf.prodKg, piecePrice: sf.prodPiece,
      note: sf.prodNote, cutSelect: sf.prodCut, surchargeEligible: sf.prodSurcharge,
    });
  }

  html += '</div>';
  return html;
}

function renderProductForm(mode, v){
  var isEdit = mode === 'edit';
  var pfx = isEdit ? 'edit-prod-' : 'set-prod-';
  var html = '';
  html += '<h3 style="font-size:13.5px; margin:4px 0 8px;">' + (isEdit ? ('떡 수정 — ' + esc(v.name || '')) : '새 떡 추가') + '</h3>';
  html += '<div class="field-row">';
  html += '<div class="field" style="flex:2;"><label class="req">떡 이름</label><input id="' + pfx + 'name" type="text" placeholder="예: 백년초설기" value="' + esc(v.name) + '"></div>';
  html += '<div class="field"><label class="req">1말 가격</label><input id="' + pfx + 'mal" type="text" inputmode="numeric" placeholder="예: 120000" value="' + esc(v.mal) + '"></div>';
  html += '<div class="field"><label>1/2말 가격 (선택)</label><input id="' + pfx + 'half" type="text" inputmode="numeric" placeholder="없으면 비움" value="' + esc(v.half) + '"></div>';
  html += '</div>';
  html += '<div class="field-row">';
  var autoKg = computeKgPrice(parseInt(digits(v.mal), 10) || 0, digits(v.half) === '' ? null : (parseInt(digits(v.half), 10) || 0));
  html += '<div class="field"><label>1kg 가격 (선택)</label><input id="' + pfx + 'kg" type="text" inputmode="numeric" placeholder="비우면 자동: ' + (autoKg ? autoKg.toLocaleString('ko-KR') : '-') + '" value="' + esc(v.kg) + '"></div>';
  html += '<div class="field"><label>개당 가격 (선택)</label><input id="' + pfx + 'piece" type="text" inputmode="numeric" placeholder="0 또는 비움 = 낱개 주문 불가" value="' + esc(v.piecePrice) + '"></div>';
  html += '</div>';
  html += '<div class="field" style="margin-bottom:10px;"><label>안내 문구 (선택)</label><input id="' + pfx + 'note" type="text" placeholder="예: 1말 낱개 120개로 제공됩니다." value="' + esc(v.note) + '"></div>';
  html += '<label class="checkline"><input type="checkbox" id="' + pfx + 'cut" ' + (v.cutSelect ? 'checked' : '') + '> 쪽수(40/50/60쪽) 선택이 필요한 떡</label>';
  html += '<label class="checkline"><input type="checkbox" id="' + pfx + 'surcharge" ' + (v.surchargeEligible ? 'checked' : '') + '> 단독 주문 시 1말당 10,000원 추가요금 대상 (절편·바람떡류)</label>';
  if (isEdit){
    html += '<div style="margin-top:8px; display:flex; gap:6px;">';
    html += '<button class="btn btn-primary btn-sm" data-action="save-product">수정 저장</button>';
    html += '<button class="btn btn-outline btn-sm" data-action="edit-product-cancel">취소</button>';
    html += '</div>';
  } else {
    html += '<button class="btn btn-outline btn-sm" style="margin-top:8px;" data-action="add-product">떡 추가</button>';
  }
  return html;
}
