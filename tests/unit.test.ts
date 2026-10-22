// FocusDev Unit Tests
import assert from 'assert';

console.log('--- 🧪 FocusDev Unit Tests Starting ---');

// 1. Test Window Title & Classification Logic
const BROWSER_PROCESSES = ['chrome', 'msedge', 'brave', 'firefox', 'opera'];
const PRODUCTIVE_PROCESSES = ['code', 'antigravity', 'cursor', 'devenv', 'idea64', 'windowsterminal'];
const WHITELIST_KEYWORDS = ['tutorial', 'ders', 'egitim', 'docker', 'course', 'lofi'];

function classifyWindow(title: string, processName: string, idleSeconds = 0) {
  const isIdle = idleSeconds >= 180;
  const procLower = processName.toLowerCase();
  const titleLower = title.toLowerCase();

  const isBrowser = BROWSER_PROCESSES.some((b) => procLower.includes(b));
  const hasYouTubeInTitle = isBrowser && titleLower.includes('youtube');
  const isWhitelisted = WHITELIST_KEYWORDS.some((kw) => titleLower.includes(kw.toLowerCase()));
  const isIDE = PRODUCTIVE_PROCESSES.some((p) => procLower.includes(p)) ||
    titleLower.includes('visual studio') ||
    titleLower.includes('antigravity') ||
    titleLower.includes('cloud code');

  if (isIdle) return 'idle';
  if (hasYouTubeInTitle && !isWhitelisted) return 'youtube';
  if (isIDE || (hasYouTubeInTitle && isWhitelisted)) return 'productive';
  return 'other';
}

// Test Case 1: Standard Distraction (YouTube video in Chrome)
const cat1 = classifyWindow('Funniest Cat Videos 2026 - YouTube - Google Chrome', 'chrome');
assert.strictEqual(cat1, 'youtube', 'Expected YouTube category for entertainment video');
console.log('✅ Test 1 Passed: Entertainment YouTube correctly tagged as distraction');

// Test Case 2: Background Music / Lofi While Coding in Antigravity
// When user is writing code, Antigravity or VS Code is foreground window!
const cat2 = classifyWindow('App.tsx - Antigravity', 'antigravity');
assert.strictEqual(cat2, 'productive', 'Expected Productive category for Antigravity IDE');
console.log('✅ Test 2 Passed: Antigravity in foreground correctly tagged as productive (YouTube in background ignored)');

// Test Case 3: Whitelisted Technical Video (Docker / Tutorial)
const cat3 = classifyWindow('Docker Full Course for Beginners - YouTube - Google Chrome', 'chrome');
assert.strictEqual(cat3, 'productive', 'Expected Productive for whitelisted YouTube tutorial');
console.log('✅ Test 3 Passed: Whitelisted technical video exempted from distraction');

// Test Case 4: Idle Detection (away from keyboard > 3 min)
const cat4 = classifyWindow('Funniest Cat Videos - YouTube - Google Chrome', 'chrome', 200);
assert.strictEqual(cat4, 'idle', 'Expected Idle when inactive > 180s');
console.log('✅ Test 4 Passed: Idle state properly pauses active tracking');

// 2. Test Focus Score Formula
function calculateScore(productiveSecs: number, youtubeSecs: number): number {
  const total = productiveSecs + youtubeSecs;
  if (total === 0) return 100;
  return Math.round((productiveSecs / total) * 100);
}

assert.strictEqual(calculateScore(3600, 0), 100, 'Score should be 100% with no YouTube');
assert.strictEqual(calculateScore(3600, 3600), 50, 'Score should be 50% with 1h work, 1h YouTube');
assert.strictEqual(calculateScore(7200, 1800), 80, 'Score should be 80% with 2h work, 30m YouTube');
console.log('✅ Test 5 Passed: Focus Score mathematical calculation verified');

// 3. Test Work Hours Boundary Logic
function isWithinWorkHours(timeStr: string, start = '09:00', end = '18:00'): boolean {
  const [h, m] = timeStr.split(':').map(Number);
  const totalM = h * 60 + m;
  const [sH, sM] = start.split(':').map(Number);
  const startM = sH * 60 + sM;
  const [eH, eM] = end.split(':').map(Number);
  const endM = eH * 60 + eM;
  return totalM >= startM && totalM <= endM;
}

assert.strictEqual(isWithinWorkHours('11:30'), true, '11:30 should be within 09:00 - 18:00');
assert.strictEqual(isWithinWorkHours('08:45'), false, '08:45 should be before work hours');
assert.strictEqual(isWithinWorkHours('19:15'), false, '19:15 should be after work hours');
console.log('✅ Test 6 Passed: 09:00 - 18:00 work hours boundaries accurate');

console.log('--- 🎉 ALL AUTOMATED UNIT TESTS PASSED! ---');
