// ============================================
// common.js — 페이지 전환 유틸 / 공통 상태
// ============================================

// 전역 페이지 참조 (각 페이지 스크립트에서 사용)
const Pages = {
  p1: document.getElementById('page1'),
  p2: document.getElementById('page2'),
  p3: document.getElementById('page3'),
};

// 페이지 전환 헬퍼
function switchPage(fromId, toId) {
  document.getElementById(fromId).classList.remove('active');
  document.getElementById(toId).classList.add('active');
}

// 작은 sleep 유틸
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
