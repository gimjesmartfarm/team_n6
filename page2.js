// ============================================
// page2.js — 농장 시뮬레이션
// ============================================

'use strict';

// ----- 설정 -----
const TOTAL_BEDS    = 18;
const BEDS_PER_SEC  = 6;
const NUM_SECTIONS  = 3;
const DAY_MS        = 1500;   // 모든 day 1.5초로 통일

function dayDuration(d) {
  return DAY_MS;
}

// ----- 상태 -----
let globalDay = 0;
let currentSection = 1;
let isFarmLoopActive = false;
const lastCut = new Array(TOTAL_BEDS + 1).fill(null);

// 농부 3명 참조
const FARMERS = ['farmer1', 'farmer2', 'farmer3'];

// ----- DOM -----
const bedArea     = document.getElementById('bedArea');
const dayCounter  = document.getElementById('dayCounter');
const sectionBadge = document.getElementById('sectionBadge');
const sunEl       = document.getElementById('sun');

// ----- 베드 영역 빌드 (6개 슬롯, JS가 데이터만 갱신) -----
function buildBeds() {
  bedArea.innerHTML = '';
  for (let slot = 0; slot < BEDS_PER_SEC; slot++) {
    const bed = document.createElement('div');
    bed.className = 'bed';
    bed.dataset.slot = slot;
    bed.dataset.bed = slot + 1;
    bed.dataset.stage = '18';

    const chives = document.createElement('div');
    chives.className = 'chives';
    bed.appendChild(chives);

    const stubble = document.createElement('div');
    stubble.className = 'stubble';
    bed.appendChild(stubble);

    const perlite = document.createElement('div');
    perlite.className = 'perlite';
    bed.appendChild(perlite);

    const num = document.createElement('div');
    num.className = 'bed-num';
    num.textContent = String(slot + 1).padStart(2, '0');
    bed.appendChild(num);

    bedArea.appendChild(bed);
  }
}

// ----- 베드 stage 계산 -----
function getStage(bedNum) {
  if (lastCut[bedNum] === null) return 18; // 첫 날엔 모두 가득
  const days = globalDay - lastCut[bedNum];
  return Math.max(0, Math.min(18, days));
}

// ----- 현재 섹션에 맞춰 베드 갱신 -----
function updateBedsForSection(sec) {
  const startBed = (sec - 1) * BEDS_PER_SEC + 1;
  document.querySelectorAll('.bed').forEach((bed, idx) => {
    const bedNum = startBed + idx;
    bed.dataset.bed = bedNum;
    bed.dataset.stage = getStage(bedNum);
    bed.querySelector('.bed-num').textContent = String(bedNum).padStart(2, '0');
    bed.classList.remove('next', 'cutting');
  });
  sectionBadge.textContent = `SECTION ${sec} / ${NUM_SECTIONS}`;
}

// ----- 해 애니메이션 (한 베드 작업 동안 오른쪽 → 왼쪽 100%) -----
let sunRAF = null;
function animateSun(durationMs) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const startX = W * 0.93;
  const endX   = W * 0.07;
  const baseY  = H * 0.10;
  const peakY  = H * 0.04;

  const t0 = performance.now();
  if (sunRAF) cancelAnimationFrame(sunRAF);
  function frame(now) {
    const t = Math.min(1, (now - t0) / durationMs);
    const x = startX + (endX - startX) * t;
    const u = (t - 0.5) * 2;
    const y = peakY + (baseY - peakY) * (u * u);
    sunEl.style.left = x + 'px';
    sunEl.style.top  = y + 'px';
    sunEl.style.opacity = 0.45 + 0.55 * (1 - Math.abs(u));
    if (t < 1) sunRAF = requestAnimationFrame(frame);
    else sunRAF = null;
  }
  sunRAF = requestAnimationFrame(frame);
}

// ----- 농부 헬퍼 -----
function f(id) { return document.getElementById(id); }
function moveFarmer(id, x, y, ms) {
  const el = f(id);
  el.style.transition = `left ${ms}ms ease-in-out, top ${ms}ms ease-in-out`;
  el.style.left = x + 'px';
  el.style.top  = y + 'px';
}
function snapFarmer(id, x, y) {
  const el = f(id);
  el.style.transition = 'none';
  el.style.left = x + 'px';
  el.style.top  = y + 'px';
  void el.offsetWidth;
}
function setFlip(id, flipped) {
  const el = f(id);
  if (flipped) el.classList.add('flipped');
  else el.classList.remove('flipped');
}

// ----- 작업 영역 / 베드 위치 좌표 -----
function depositPoint() {
  return {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.94
  };
}
function idleSpotForFarmer(idx, baseX) {
  // 활동 농부 외 2명을 화면에 분산 (베드 사이 빈 공간에 위치)
  const W = window.innerWidth;
  return {
    x: baseX,
    y: window.innerHeight * 0.74
  };
}
function bedHarvestPos(slot) {
  const beds = document.querySelectorAll('.bed');
  const bed = beds[slot];
  if (!bed) return depositPoint();
  const r = bed.getBoundingClientRect();
  return {
    x: r.left + r.width / 2,
    y: r.bottom + 42
  };
}

// ----- 코인 / 스파클 (사이즈 업) -----
function spawnCoin(x, y) {
  const c = document.createElement('div');
  c.className = 'coin';
  c.innerHTML = `
    <svg viewBox="0 0 16 16" shape-rendering="crispEdges">
      <g>
        <rect x="4" y="2" width="8" height="1"  fill="#ffe98a"/>
        <rect x="2" y="3" width="12" height="1" fill="#ffd23a"/>
        <rect x="1" y="4" width="14" height="8" fill="#ffd23a"/>
        <rect x="2" y="12" width="12" height="1" fill="#d99000"/>
        <rect x="4" y="13" width="8" height="1"  fill="#c9870a"/>
        <rect x="1" y="6" width="14" height="1"  fill="#ffe98a"/>
        <rect x="5" y="5" width="6" height="6"   fill="#c9870a"/>
        <rect x="6" y="6" width="4" height="4"   fill="#d99000"/>
        <rect x="7" y="7" width="2" height="2"   fill="#a86700"/>
      </g>
    </svg>`;
  const wiggle = (Math.random() - 0.5) * 40;
  c.style.left = (x + wiggle - 12) + 'px';
  c.style.top  = y + 'px';
  document.getElementById('page2').appendChild(c);
  setTimeout(() => c.remove(), 800);
}
function spawnSparkle(x, y) {
  const s = document.createElement('div');
  s.className = 'sparkle';
  s.textContent = '✦';
  const dx = (Math.random() - 0.5) * 70;
  const dy = -25 - Math.random() * 35;
  s.style.left = (x + dx) + 'px';
  s.style.top  = y + 'px';
  s.style.setProperty('--dx', dx + 'px');
  s.style.setProperty('--dy', dy + 'px');
  document.getElementById('page2').appendChild(s);
  setTimeout(() => s.remove(), 950);
}

async function playMoneyAndSmile(farmerId, totalMs) {
  const el = f(farmerId);
  const dp = depositPoint();
  el.classList.remove('holding');
  el.classList.add('smiling');

  for (let i = 0; i < 5; i++) spawnSparkle(dp.x, dp.y);
  const COINS = 7;
  for (let i = 0; i < COINS; i++) {
    setTimeout(() => spawnCoin(dp.x, dp.y), i * 50);
  }
  await sleep(Math.max(350, totalMs));
  el.classList.remove('smiling');
}

// ----- 작업대 채우기 -----
function fillCrate() {
  const crates = document.querySelectorAll('.crate');
  for (const c of crates) {
    if (!c.classList.contains('has-chives')) {
      c.classList.add('has-chives');
      return;
    }
  }
  setTimeout(() => crates.forEach(c => c.classList.remove('has-chives')), 700);
}

// ----- 한 베드 수확 (농부 3명 모두 같은 베드로 향함, 타이밍 랜덤) -----
async function harvestDay(slot, durationMs, activeIdx) {
  const beds = document.querySelectorAll('.bed');
  const bed = beds[slot];
  if (!bed) return;
  const bedNum = parseInt(bed.dataset.bed, 10);
  const activeId = FARMERS[activeIdx];

  // 오늘의 베드 강조
  document.querySelectorAll('.bed.next').forEach(b => b.classList.remove('next'));
  bed.classList.add('next');

  // 4단계 시간 배분
  const goMs    = Math.round(durationMs * 0.30);
  const cutMs   = Math.round(durationMs * 0.25);
  const backMs  = Math.round(durationMs * 0.25);
  const moneyMs = durationMs - goMs - cutMs - backMs;

  const bedPos = bedHarvestPos(slot);
  const dp = depositPoint();

  // 베드 주변 3개 위치 (왼/가운데/오른쪽). 약간의 jitter 추가
  const bedJitter = () => (Math.random() - 0.5) * 24;
  const bedPositions = [
    { x: bedPos.x - 55 + bedJitter(), y: bedPos.y + bedJitter() * 0.3 },
    { x: bedPos.x      + bedJitter(), y: bedPos.y + bedJitter() * 0.3 },
    { x: bedPos.x + 55 + bedJitter(), y: bedPos.y + bedJitter() * 0.3 }
  ];
  // 작업대 주변 3개 위치 (jitter)
  const workJitter = () => (Math.random() - 0.5) * 30;
  const workPositions = [
    { x: dp.x - 70 + workJitter(), y: dp.y + workJitter() * 0.2 },
    { x: dp.x      + workJitter(), y: dp.y + workJitter() * 0.2 },
    { x: dp.x + 70 + workJitter(), y: dp.y + workJitter() * 0.2 }
  ];

  // 1) 농부 3명이 베드로 이동 — 출발 시점/속도 랜덤
  FARMERS.forEach((fid, i) => {
    const el = f(fid);
    const startDelay = Math.floor(Math.random() * 180);          // 0~180ms 지연
    const dur = goMs - 60 + Math.floor(Math.random() * 140);     // ±70ms 속도 변동
    setTimeout(() => {
      el.classList.remove('holding', 'smiling', 'swing');
      el.classList.add('walk');
      const curLeft = parseFloat(el.style.left || '0');
      setFlip(fid, bedPositions[i].x < curLeft);
      moveFarmer(fid, bedPositions[i].x, bedPositions[i].y, Math.max(200, dur));
    }, startDelay);
  });
  await sleep(goMs + 200);   // 가장 느린 농부도 도착하도록 여유

  // 2) 농부 3명 낫질 — 시작 시점 랜덤
  FARMERS.forEach(fid => {
    const el = f(fid);
    el.classList.remove('walk');
    const swingDelay = Math.floor(Math.random() * 180);
    setTimeout(() => el.classList.add('swing'), swingDelay);
  });
  bed.classList.add('cutting');
  const steps = 4;
  const stepMs = cutMs / steps;
  for (let i = steps - 1; i >= 0; i--) {
    const stage = Math.max(0, Math.round(18 * (i / steps)));
    bed.dataset.stage = stage;
    await sleep(stepMs);
  }
  bed.dataset.stage = 0;
  bed.classList.remove('cutting', 'next');
  FARMERS.forEach(fid => f(fid).classList.remove('swing'));
  lastCut[bedNum] = globalDay;

  // 3) 활동 농부가 묶음 들고 3명이 작업대로 복귀 — 시작/속도 랜덤
  f(activeId).classList.add('holding');
  FARMERS.forEach((fid, i) => {
    const el = f(fid);
    const startDelay = Math.floor(Math.random() * 180);
    const dur = backMs - 60 + Math.floor(Math.random() * 140);
    setTimeout(() => {
      el.classList.add('walk');
      const curLeft = parseFloat(el.style.left || '0');
      setFlip(fid, workPositions[i].x < curLeft);
      moveFarmer(fid, workPositions[i].x, workPositions[i].y, Math.max(200, dur));
    }, startDelay);
  });
  await sleep(backMs + 250);
  FARMERS.forEach(fid => {
    f(fid).classList.remove('walk');
    setFlip(fid, false);
  });

  // 4) 활동 농부가 떨굼 + 돈 + 미소
  fillCrate();
  await playMoneyAndSmile(activeId, moneyMs);
}

// ----- 섹션 전환 -----
async function transitionToSection(newSec) {
  const ov = document.getElementById('sectionOverlay');
  const big = document.getElementById('sectionBig');
  const small = document.getElementById('sectionSmall');
  big.textContent = `SECTION ${newSec} / ${NUM_SECTIONS}`;
  const startBed = (newSec - 1) * BEDS_PER_SEC + 1;
  small.textContent = `Beds ${startBed} — ${startBed + 5}`;
  ov.classList.add('show');

  await sleep(900);

  currentSection = newSec;
  updateBedsForSection(currentSection);

  await sleep(700);
  ov.classList.remove('show');
  await sleep(300);
}

// ----- Q&A 전환 -----
function showQAScreen() {
  isFarmLoopActive = false;
  switchPage('page2', 'page3');
}

// ----- 메인 루프 (page1.js에서 호출) -----
async function startFarmLoop() {
  isFarmLoopActive = true;
  globalDay = 0;
  currentSection = 1;
  for (let i = 1; i <= TOTAL_BEDS; i++) lastCut[i] = null;

  buildBeds();
  updateBedsForSection(1);

  // 농부 3명 초기 배치 (작업대 주변)
  const dp = depositPoint();
  snapFarmer('farmer1', dp.x - 70, dp.y);
  snapFarmer('farmer2', dp.x,      dp.y);
  snapFarmer('farmer3', dp.x + 70, dp.y);

  for (let day = 1; day <= TOTAL_BEDS; day++) {
    if (!isFarmLoopActive) return;

    globalDay = day;
    const displayDay = ((day - 1) % TOTAL_BEDS) + 1;
    dayCounter.textContent = 'DAY ' + String(displayDay).padStart(2, '0');

    // 섹션 전환?
    const targetSec = Math.ceil(day / BEDS_PER_SEC);
    if (targetSec !== currentSection) {
      await transitionToSection(targetSec);
    } else {
      updateBedsForSection(currentSection);
    }

    // 활동 농부 결정 (하루마다 로테이션)
    const activeIdx = (day - 1) % 3;
    const dur = dayDuration(displayDay);
    const slotInSec = ((day - 1) % BEDS_PER_SEC);

    // 해는 한 베드 작업 동안 우→좌 100% 횡단
    animateSun(dur);

    // 농부 3명 모두 오늘 베드로 이동 → 작업 → 작업대 복귀
    await harvestDay(slotInSec, dur, activeIdx);
  }

  // 18일 끝 → Q&A 화면
  await sleep(700);
  showQAScreen();
}

// ============================================
// 네비게이션 버튼
// ============================================
const btnP1 = document.getElementById('btnToPage1');
if (btnP1) {
  btnP1.addEventListener('click', () => {
    isFarmLoopActive = false;
    const page1 = document.getElementById('page1');
    const startBtn = document.getElementById('startBtn');
    if (page1) page1.classList.remove('opening');
    if (startBtn) startBtn.classList.remove('hide');
    switchPage('page2', 'page1');
  });
}

const btnP3 = document.getElementById('btnToPage3');
if (btnP3) {
  btnP3.addEventListener('click', () => {
    isFarmLoopActive = false;
    const overlay = document.getElementById('sectionOverlay');
    if (overlay) overlay.classList.remove('show');
    showQAScreen();
  });
}
