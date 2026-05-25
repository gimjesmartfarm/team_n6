// ============================================
// page1.js — 입구 페이지 로직
//   START 버튼 → 문 스윙 오픈 → 페이지 2 전환
// ============================================

(function () {
  const page1   = document.getElementById('page1');
  const startBtn = document.getElementById('startBtn');

  startBtn.addEventListener('click', () => {
    startBtn.classList.add('hide');
    page1.classList.add('opening');   // ← 양쪽 도어 스윙 오픈 트리거

    setTimeout(() => {
      switchPage('page1', 'page2');
      if (typeof startFarmLoop === 'function') {
        startFarmLoop();
      }
    }, 1500);
  });
})();
