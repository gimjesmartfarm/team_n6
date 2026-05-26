// ============================================
// page1.js — 입구 페이지 로직
//   START 버튼 → 문 스윙 오픈 → 페이지 2 전환
// ============================================

(function () {
  const page1   = document.getElementById('page1');
  const startBtn = document.getElementById('startBtn');

  startBtn.addEventListener('click', () => {
    startBtn.classList.add('hide');
    page1.classList.add('opening');   // ← 양쪽 도어 스윙 오픈 트리거 (1.2s)

    // 문이 열리기 시작한 0.5s 후 → 카메라 줌인 시작 (2.5s 진행)
    setTimeout(() => {
      page1.classList.add('zooming');
    }, 500);

    // 클릭 후 총 3.0s → 페이지 2 로 전환 (이때 플래시가 화면을 거의 덮은 상태)
    setTimeout(() => {
      switchPage('page1', 'page2');
      const page2 = document.getElementById('page2');
      page2.classList.add('fade-in-from-door');
      if (typeof startFarmLoop === 'function') {
        startFarmLoop();
      }
    }, 3000);
  });
})();
