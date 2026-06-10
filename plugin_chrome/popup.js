// ── popup.js — ICP-enabled Vyral plugin popup ───────────────────────────────

// ── CONFIG ───────────────────────────────────────────────────────────────────
const ICP_CANISTER_ID = 'YOUR_CANISTER_ID_HERE'; // Set when canister is deployed
const IDENTITY_PROVIDER = 'https://identity.ic0.app';

// ── DOM REFERENCES ──────────────────────────────────────────────────────────
const authContainer = document.getElementById('authContainer');
const userContainer = document.getElementById('userContainer');
const authBtn = document.getElementById('authBtn');
const refreshBalanceBtn = document.getElementById('refreshBalanceBtn');
const statusText = document.getElementById('statusText');
const vyralStatusText = document.getElementById('vyralStatusText');
const tikTokHandle = document.getElementById('tikTokHandle');
const unfollowedCount = document.getElementById('unfollowedCount');
const toUnfollowCount = document.getElementById('toUnfollowCount');
const unfollowedProgress = document.getElementById('unfollowedProgress');
const icpBalance = document.getElementById('icpBalance');
const progressFill = document.getElementById('progressFill');
const progressPercent = document.getElementById('progressPercent');
const logDiv = document.getElementById('log');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const clearLogsBtn = document.getElementById('clearLogsBtn');
const depositBtn = document.getElementById('depositBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const lockTabCheckbox = document.getElementById('lockTabCheckbox');
const pricePerUnfollowIcp = document.getElementById('pricePerUnfollowIcp');
const icpPriceUsd = document.getElementById('icpPriceUsd');
const alertContainer = document.getElementById('alertContainer');

const FIXED_PRICE_USD = 0.03;
const VYRAL_CONNECT_URL = 'https://vyrall.buzz/wallet';

// ── STATE ────────────────────────────────────────────────────────────────────
let vyralConnected = false;
let vyralUser = null;
let vyralTabId = null;
let userProfile = null;
const state = {
  isRunning: false,
  unfollowedCount: 0,
  totalNonFriends: 0,
  status: 'Ready',
  logHistory: [],
  icpPriceUSD: null,
  pricePerUnfollowICP: null,
};

// ── TAB SWITCHING ────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(tabName).classList.add('active');
  });
});

// ── LOGGING ──────────────────────────────────────────────────────────────────
function addLog(message, type = 'info') {
  const now = new Date().toLocaleTimeString();
  const entry = { message, type, time: now };
  state.logHistory.push(entry);
  if (state.logHistory.length > 100) state.logHistory.shift();

  const p = document.createElement('p');
  p.className = `log-${type}`;
  p.textContent = `[${now}] ${message}`;
  logDiv.insertBefore(p, logDiv.firstChild);
  while (logDiv.children.length > 50) logDiv.removeChild(logDiv.lastChild);
}

// ── ALERTS ───────────────────────────────────────────────────────────────────
function showAlert(message, type = 'info') {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.innerHTML = `
    <div class="alert-title">${type.toUpperCase()}</div>
    <div class="alert-message">${message}</div>
  `;
  alertContainer.appendChild(alert);
  setTimeout(() => alert.remove(), 5000);
}
function replayLogs(entries = []) {
  logDiv.innerHTML = '';
  entries.slice(-50).forEach(entry => {
    const p = document.createElement('p');
    p.className = `log-${entry.type || 'info'}`;
    p.textContent = `[${entry.time || new Date().toLocaleTimeString()}] ${entry.message}`;
    logDiv.appendChild(p);
  });
}
// ── Vyral connection UI handler ──────────────────────────────────────────────
authBtn.addEventListener('click', openVyralConnectTab);
refreshBalanceBtn.addEventListener('click', async () => {
  authBtn.disabled = true;
  refreshBalanceBtn.disabled = true;
  await refreshVyralBalance();
  authBtn.disabled = false;
  refreshBalanceBtn.disabled = false;
});

async function openVyralConnectTab() {
  try {
    const tabs = await chrome.tabs.query({ url: '*://vyral.buzz/*' });
    let tab;
    if (tabs && tabs.length > 0) {
      tab = tabs[0];
      await chrome.tabs.update(tab.id, { active: true });
      await chrome.windows.update(tab.windowId, { focused: true });
      addLog('Activated existing Vyral Buzz connection tab', 'info');
    } else {
      tab = await new Promise(resolve => chrome.tabs.create({ url: VYRAL_CONNECT_URL }, resolve));
      addLog('Opened Vyral Buzz connection tab', 'info');
    }
    vyralTabId = tab.id;
    showAlert('Vyral Buzz is open. Sign in there, then refresh your Vyral balance here.', 'info');
  } catch (error) {
    addLog(`Failed to open Vyral Buzz: ${error.message}`, 'error');
    showAlert(`Could not open Vyral Buzz: ${error.message}`, 'error');
  }
}

// ── UPDATE UI WITH USER DATA ─────────────────────────────────────────────────
async function updateUI() {
  vyralStatusText.textContent = vyralConnected ? 'Connected' : 'Not connected';

  if (vyralConnected) {
    userProfile = {
      tikTokHandle: userProfile?.tikTokHandle || vyralUser || '@demo_user',
      balanceICP: typeof userProfile?.balanceICP === 'number' ? userProfile.balanceICP : 0,
      totalUnfollows: userProfile?.totalUnfollows ?? 0,
      lockTab: userProfile?.lockTab ?? false,
    };

    authContainer.style.display = 'none';
    userContainer.style.display = 'block';

    tikTokHandle.textContent = userProfile.tikTokHandle || '—';
    unfollowedCount.textContent = userProfile.totalUnfollows;
    icpBalance.textContent = userProfile.balanceICP.toFixed(4);
    lockTabCheckbox.checked = userProfile.lockTab;

    if (!unfollowedProgress.textContent) {
      unfollowedProgress.textContent = '0';
    }
    if (!toUnfollowCount.textContent) {
      toUnfollowCount.textContent = '0';
    }
    progressFill.style.width = progressPercent.textContent ? progressFill.style.width : '0%';

    if (state.pricePerUnfollowICP) {
      pricePerUnfollowIcp.textContent = `${state.pricePerUnfollowICP.toFixed(6)} ICP`;
    }
    if (state.icpPriceUSD) {
      icpPriceUsd.textContent = `$${state.icpPriceUSD.toFixed(4)}`;
    }

    startBtn.disabled = false;
    stopBtn.disabled = true;

    addLog(`User ${userProfile.tikTokHandle} loaded`, 'success');
  } else {
    authContainer.style.display = 'block';
    userContainer.style.display = 'none';
    startBtn.disabled = true;
  }
}

async function findTikTokTab() {
  const tabs = await chrome.tabs.query({ url: '*://*.tiktok.com/*' });
  return tabs.length ? tabs[0] : null;
}

async function findVyralTab() {
  const tabs = await chrome.tabs.query({ url: '*://*.vyrall.buzz/*' });
  return tabs.length ? tabs[0] : null;
}

function parseVyralBalance(raw) {
  if (!raw) return null;
  const sanitized = raw.replace(/[,\s₿$]/g, '').trim();
  const match = sanitized.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
}

async function refreshVyralBalance() {
  try {
    const tab = await findVyralTab();
    if (!tab) {
      throw new Error('Vyral Buzz is not open. Please connect first.');
    }

    vyralTabId = tab.id;
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });

    const data = await inTab(tab.id, () => {
      const selectors = [
        '#vyral-balance',
        '[data-vyral-balance]',
        '.balance-value',
        '.account-balance',
        '.balance',
      ];
      const usernameSelectors = [
        '#vyral-username',
        '[data-vyral-username]',
        '.username',
        '.account-name',
      ];

      const balanceText = selectors
        .map(sel => document.querySelector(sel)?.textContent?.trim())
        .find(Boolean);
      const username = usernameSelectors
        .map(sel => document.querySelector(sel)?.textContent?.trim())
        .find(Boolean);
      let localStorageBalance = null;
      try {
        localStorageBalance = window.localStorage.getItem('vyralBalance') || window.localStorage.getItem('balance') || window.localStorage.getItem('accountBalance');
      } catch (e) {
        localStorageBalance = null;
      }
      return { balanceText, username, localStorageBalance };
    });

    const balance = parseVyralBalance(data.balanceText || data.localStorageBalance);
    if (balance === null) {
      throw new Error('Could not read your Vyral ICP balance. Make sure you are logged in and the account page displays a numeric balance.');
    }

    vyralConnected = true;
    vyralUser = data.username || vyralUser || '@vyral_user';
    userProfile = {
      ...(userProfile || {}),
      tikTokHandle: userProfile?.tikTokHandle || vyralUser,
      balanceICP: balance,
      totalUnfollows: userProfile?.totalUnfollows ?? 0,
      lockTab: userProfile?.lockTab ?? false,
    };

    chrome.storage.sync.set({ vyralConnected: true, vyralHandle: vyralUser, balanceICP: balance });
    addLog(`Connected to Vyral as ${vyralUser} with ${balance.toFixed(4)} ICP`, 'success');
    showAlert('Vyral account connected and balance refreshed.', 'success');
    await updateUI();
  } catch (err) {
    addLog(`Vyral refresh failed: ${err.message}`, 'error');
    showAlert(err.message, 'error');
  }
}

// ── START BUTTON HANDLER ─────────────────────────────────────────────────────
startBtn.addEventListener('click', async () => {
  if (!vyralConnected) {
    showAlert('Please connect to Vyral first.', 'error');
    return;
  }

  const tab = await findTikTokTab();
  if (!tab) {
    showAlert('No TikTok tab found. Opening TikTok and waiting for you to log in.', 'error');
    await chrome.tabs.create({ url: 'https://www.tiktok.com/' });
    return;
  }

  const proceed = confirm(
    'The extension will scroll through your Following list and unfollow everyone who is not a Friend.\n\n' +
    'This will deduct ICP from your balance.\n\n' +
    'Continue?'
  );
  
  if (!proceed) return;
  
  startBtn.disabled = true;
  stopBtn.disabled = false;
  statusText.textContent = 'Running...';
  addLog('Unfollowing session started', 'success');
  state.isRunning = true;
  // start remote unfollow session (canister) — mock for now
  const session = await startRemoteUnfollowSessionMock(state.totalNonFriends || 0, state.pricePerUnfollowICP || 0);
  chrome.storage.sync.set({ currentSessionId: session.sessionId });
  startAutomation(tab.id);
});

// ── STOP BUTTON HANDLER ──────────────────────────────────────────────────────
stopBtn.addEventListener('click', () => {
  stopBtn.disabled = true;
  updateStatus('Stopping...');
  state.isRunning = false;
  addLog('Unfollowing session stopped', 'warning');
});

// ── DEPOSIT HANDLER ──────────────────────────────────────────────────────────
depositBtn.addEventListener('click', () => {
  const amount = prompt('Enter amount to deposit (ICP):', '0.1');
  if (!amount) return;
  
  const icpAmount = parseFloat(amount);
  if (isNaN(icpAmount) || icpAmount <= 0) {
    showAlert('Invalid amount', 'error');
    return;
  }

  userProfile = userProfile || {};
  userProfile.balanceICP = (userProfile.balanceICP || 0) + icpAmount;
  chrome.storage.sync.set({ balanceICP: userProfile.balanceICP }, () => {
    icpBalance.textContent = userProfile.balanceICP.toFixed(4);
    showAlert(`Deposited ${icpAmount.toFixed(4)} ICP`, 'success');
    addLog(`Deposited ${icpAmount.toFixed(4)} ICP`, 'success');
  });
});

// ── SAVE SETTINGS HANDLER ────────────────────────────────────────────────────
saveSettingsBtn.addEventListener('click', () => {
  const handle = document.getElementById('tikTokInput').value;
  const lockTab = lockTabCheckbox.checked;
  
  if (!handle) {
    showAlert('Fill in all fields', 'error');
    return;
  }
  
  chrome.storage.sync.set({
    tikTokHandle: handle,
    lockTab,
  }, () => {
    userProfile = { ...(userProfile || {}), tikTokHandle: handle, lockTab };
    tikTokHandle.textContent = handle;
    showAlert('Settings saved! ✓', 'success');
    addLog(`Updated TikTok handle: ${handle}`, 'info');
  });
});

// ── CLEAR LOGS HANDLER ───────────────────────────────────────────────────────
clearLogsBtn.addEventListener('click', () => {
  logDiv.innerHTML = '';
  addLog('Logs cleared', 'info');
});

// ── AUTOMATION HELPERS ─────────────────────────────────────────────────────
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function inTab(tabId, func, args = []) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func,
      args,
    });
    return results[0]?.result ?? null;
  } catch (error) {
    addLog(`Script injection failed: ${error.message}`, 'error');
    return null;
  }
}

async function waitForElement(tabId, selector, timeoutMs = 12000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const found = await inTab(tabId, sel => !!document.querySelector(sel), [selector]);
    if (found) return true;
    await sleep(600);
  }
  return false;
}

async function navigateTo(tabId, url) {
  const tab = await chrome.tabs.get(tabId);
  const current = (tab.url || '').split('?')[0].replace(/\/$/, '');
  const target = url.replace(/\/$/, '');
  if (current === target) {
    addLog('Already on correct page, skipping navigation', 'info');
    return;
  }

  addLog(`Navigating to ${url}…`, 'info');
  await new Promise(resolve => {
    chrome.tabs.update(tabId, { url }, () => {
      const listener = (id, info) => {
        if (id === tabId && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
      setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }, 15000);
    });
  });
  await sleep(1500);
}

async function getUsername(tabId) {
  const tab = await chrome.tabs.get(tabId);
  const m = (tab.url || '').match(/tiktok\.com\/@([^/?#]+)/);
  if (m) return m[1];

  return inTab(tabId, () => {
    for (const script of document.querySelectorAll('script')) {
      const m = script.textContent?.match(/"uniqueId"\s*:\s*"([^"]+)"/);
      if (m) return m[1];
    }
    for (const a of document.querySelectorAll('a[href*="/@"]')) {
      if (/profile/i.test(a.getAttribute('aria-label') || '')) {
        const m = a.getAttribute('href').match(/\/\@([^/?#]+)/);
        if (m) return m[1];
      }
    }
    const m = location.href.match(/tiktok\.com\/@([^/?#]+)/);
    return m ? m[1] : null;
  });
}

async function isModalOpen(tabId) {
  return inTab(tabId, () => {
    const dlg = document.querySelector('[role="dialog"], [class*="Modal"]');
    if (!dlg) return false;
    return !!document.querySelector('[data-e2e="follow-button"]');
  });
}

async function openModal(tabId) {
  if (await isModalOpen(tabId)) {
    addLog('Following modal already open', 'info');
    return;
  }

  addLog('Waiting for Following count button…', 'info');
  const found = await waitForElement(tabId, '[data-e2e="following-count"]', 10000);
  if (!found) throw new Error('Could not find the Following count button on your profile.');

  addLog('Clicking Following count to open modal…', 'info');
  await inTab(tabId, () => document.querySelector('[data-e2e="following-count"]')?.click());

  const appeared = await waitForElement(tabId, '[data-e2e="follow-button"]', 8000);
  if (!appeared) throw new Error('Modal did not open. Try opening it manually first, then press Start.');

  addLog('Modal is open', 'success');
  await sleep(800);
}

async function scrollModal(tabId) {
  return inTab(tabId, () => {
    const selectors = [
      '[class*="DivUserListContainer"]',
      '[class*="UserListContainer"]',
      '[class*="ModalBody"]',
      '[class*="ScrollableContent"]',
      '[role="dialog"]',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.scrollHeight > el.clientHeight + 10) {
        const before = el.scrollTop;
        el.scrollTop = el.scrollHeight;
        if (el.scrollTop !== before) return true;
      }
    }
    for (const div of document.querySelectorAll('[role="dialog"] div')) {
      if (div.scrollHeight > div.clientHeight + 20 && div.scrollHeight > 300) {
        const before = div.scrollTop;
        div.scrollTop = div.scrollHeight;
        if (div.scrollTop !== before) return true;
      }
    }
    return false;
  });
}

async function countNonFriends(tabId) {
  return inTab(tabId, () => {
    let n = 0;
    for (const btn of document.querySelectorAll('[data-e2e="follow-button"]')) {
      if ((btn.textContent || '').trim() === 'Following') n++;
    }
    return n;
  });
}

async function clickFirstNonFriend(tabId) {
  return inTab(tabId, () => {
    for (const btn of document.querySelectorAll('[data-e2e="follow-button"]')) {
      if ((btn.textContent || '').trim() === 'Following') {
        const aria = btn.getAttribute('aria-label') || '';
        const username = aria.replace(/^Following\s+/i, '').trim() || '(unknown)';
        btn.click();
        return username;
      }
    }
    return null;
  });
}

async function confirmUnfollow(tabId) {
  await sleep(700);
  return inTab(tabId, () => {
    for (const btn of document.querySelectorAll('button, [role="button"]')) {
      if ((btn.textContent || '').trim() === 'Unfollow') {
        btn.click();
        return true;
      }
    }
    return false;
  });
}

function updateStatus(status) {
  state.status = status;
  statusText.textContent = status;
}

function updateProgress() {
  unfollowedProgress.textContent = state.unfollowedCount;
  toUnfollowCount.textContent = state.totalNonFriends;
  const percent = state.totalNonFriends > 0
    ? ((state.unfollowedCount / state.totalNonFriends) * 100).toFixed(0)
    : 0;
  progressFill.style.width = `${percent}%`;
  progressPercent.textContent = `${percent}%`;
}

function updatePricingUI() {
  if (state.pricePerUnfollowICP) {
    pricePerUnfollowIcp.textContent = `${state.pricePerUnfollowICP.toFixed(6)} ICP`;
  }
  if (state.icpPriceUSD) {
    icpPriceUsd.textContent = `$${state.icpPriceUSD.toFixed(4)}`;
  }
}

async function fetchIcpUsdPrice() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd');
    const data = await response.json();
    return data?.['internet-computer']?.usd ?? null;
  } catch (error) {
    addLog(`CoinGecko price fetch failed: ${error.message}`, 'error');
    return null;
  }
}

// --- Canister client helpers (attempt real calls, fallback to mocks)
async function createCanisterActor() {
  try {
    const { Actor, HttpAgent } = await import('@dfinity/agent');
    const { IDL } = await import('@dfinity/candid');

    const idlFactory = (IDLParam) => {
      const UnfollowRequest = IDLParam.Record({ count: IDLParam.Nat, costPerUnfollow: IDLParam.Nat64 });
      const StartRet = IDLParam.Record({ ok: IDLParam.Bool, sessionId: IDLParam.Opt(IDLParam.Text), message: IDLParam.Text });

      const Follower = IDLParam.Record({
        id: IDLParam.Text,
        displayName: IDLParam.Opt(IDLParam.Text),
        profileBio: IDLParam.Opt(IDLParam.Text),
        followerCount: IDLParam.Nat64,
        followingCount: IDLParam.Nat64,
        verified: IDLParam.Bool,
        accountType: IDLParam.Opt(IDLParam.Text),
        location: IDLParam.Opt(IDLParam.Text),
        language: IDLParam.Opt(IDLParam.Text),
        joinDate: IDLParam.Opt(IDLParam.Int),
        mutual: IDLParam.Bool,
        engagementWithYou: IDLParam.Nat64,
        lastActive: IDLParam.Int,
        topInterests: IDLParam.Vec(IDLParam.Text),
        topVideos: IDLParam.Vec(IDLParam.Text),
        createdAt: IDLParam.Int,
        updatedAt: IDLParam.Int,
        riskFlags: IDLParam.Vec(IDLParam.Text),
      });

      const TopRet = IDLParam.Record({ ok: IDLParam.Bool, followers: IDLParam.Vec(Follower), message: IDLParam.Text });
      const CompleteRet = IDLParam.Record({ ok: IDLParam.Bool, message: IDLParam.Text });

      return IDLParam.Service({
        'startUnfollowSession': IDLParam.Func([UnfollowRequest], [StartRet], []),
        'completeUnfollowSession': IDLParam.Func([IDLParam.Text, IDLParam.Nat], [CompleteRet], []),
        'topFollowers': IDLParam.Func([IDLParam.Nat], [TopRet], ['query']),
      });
    };

    const agent = new HttpAgent({ host: 'https://ic0.app' });
    await agent.fetchRootKey().catch(() => {});
    const actor = Actor.createActor(idlFactory, { agent, canisterId: ICP_CANISTER_ID });
    return actor;
  } catch (err) {
    addLog(`Canister actor creation failed: ${err?.message || err}`, 'warning');
    return null;
  }
}

async function startRemoteUnfollowSessionReal(count, costPerUnfollowICP) {
  const actor = await createCanisterActor();
  if (!actor) return startRemoteUnfollowSessionMock(count, costPerUnfollowICP);

  try {
    // convert ICP to e8s (Nat64 expected by canister)
    const e8 = BigInt(Math.round(costPerUnfollowICP * 1e8));
    const req = { count: BigInt(count), costPerUnfollow: e8 };
    const res = await actor.startUnfollowSession(req);
    const sessionId = Array.isArray(res.sessionId) && res.sessionId.length ? res.sessionId[0] : (typeof res.sessionId === 'string' ? res.sessionId : null);
    addLog(`Canister started session: ${sessionId}`, 'success');
    return { ok: res.ok, sessionId };
  } catch (err) {
    addLog(`Canister start session failed: ${err?.message || err}`, 'warning');
    return startRemoteUnfollowSessionMock(count, costPerUnfollowICP);
  }
}

async function completeRemoteUnfollowSessionReal(sessionId, successCount) {
  const actor = await createCanisterActor();
  if (!actor) return completeRemoteUnfollowSessionMock(sessionId, successCount);

  try {
    const res = await actor.completeUnfollowSession(sessionId, BigInt(successCount));
    addLog(`Canister completed session ${sessionId}: ${res.message}`, 'success');
    return { ok: res.ok };
  } catch (err) {
    addLog(`Canister complete session failed: ${err?.message || err}`, 'warning');
    return completeRemoteUnfollowSessionMock(sessionId, successCount);
  }
}

// --- Mock canister session helpers (fallback)
async function startRemoteUnfollowSessionMock(count, costPerUnfollow) {
  addLog(`(mock) reserving ${count} unfollows at ${costPerUnfollow} ICP each`, 'info');
  const sessionId = 'session_' + Date.now();
  // simulate async delay
  await sleep(200);
  addLog(`(mock) session started ${sessionId}`, 'success');
  return { ok: true, sessionId };
}

async function completeRemoteUnfollowSessionMock(sessionId, successCount) {
  addLog(`(mock) completing session ${sessionId} with ${successCount} successes`, 'info');
  await sleep(200);
  addLog(`(mock) session ${sessionId} completed`, 'success');
  return { ok: true };
}

async function lockTikTokTab(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    await chrome.tabs.update(tabId, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
  } catch (error) {
    addLog(`Unable to lock tab: ${error.message}`, 'warning');
  }
}

async function runLoop(tabId) {
  const MIN = 3000;
  const MAX = 5500;
  let noProgressStreak = 0;

  while (state.isRunning) {
    if (userProfile?.lockTab) {
      await lockTikTokTab(tabId);
    }
    const username = await clickFirstNonFriend(tabId);

    if (username) {
      noProgressStreak = 0;
      addLog(`Unfollowing @${username}…`, 'info');
      await confirmUnfollow(tabId);

      state.unfollowedCount++;
      updateProgress();
      addLog(`✓ Unfollowed @${username} (${state.unfollowedCount} done)`, 'success');

      const delay = MIN + Math.random() * (MAX - MIN);
      addLog(`Waiting ${(delay / 1000).toFixed(1)}s…`, 'info');
      await sleep(delay);

      const remaining = await countNonFriends(tabId);
      state.totalNonFriends = Math.max(state.totalNonFriends, state.unfollowedCount + remaining);
      updateProgress();

    } else {
      const scrolled = await scrollModal(tabId);
      await sleep(1500);

      const after = await countNonFriends(tabId);
      if (after > 0) {
        noProgressStreak = 0;
        continue;
      }

      if (!scrolled) noProgressStreak++;
      else noProgressStreak = 0;

      if (noProgressStreak >= 3) {
        addLog('No more non-friends found in the list.', 'success');
        break;
      }
    }
  }
}

async function startAutomation(tabId) {
  try {
    state.isRunning = true;
    state.unfollowedCount = 0;
    state.totalNonFriends = 0;
    updateStatus('Starting…');

    addLog('Fetching ICP price from CoinGecko…', 'info');
    const priceUSD = await fetchIcpUsdPrice();
    if (!priceUSD) throw new Error('Unable to load ICP price. Check your internet connection.');
    state.icpPriceUSD = priceUSD;
    state.pricePerUnfollowICP = FIXED_PRICE_USD / priceUSD;
    updatePricingUI();
    addLog(`Current ICP price: $${priceUSD.toFixed(4)} USD`, 'info');
    addLog(`Charge per unfollow: ${state.pricePerUnfollowICP.toFixed(6)} ICP`, 'info');

    if ((userProfile.balanceICP || 0) < state.pricePerUnfollowICP) {
      throw new Error(`Not enough ICP balance to start. Deposit at least ${state.pricePerUnfollowICP.toFixed(6)} ICP.`);
    }

    addLog('Detecting your TikTok username…', 'info');
    let username = await getUsername(tabId);
    if (!username) {
      await navigateTo(tabId, 'https://www.tiktok.com/');
      username = await getUsername(tabId);
    }
    if (!username) throw new Error('Could not detect your username. Make sure you are logged into TikTok.');

    addLog(`Logged in as @${username}`, 'success');
    tikTokHandle.textContent = `@${username}`;
    userProfile = { ...(userProfile || {}), tikTokHandle: `@${username}` };

    if (!(await isModalOpen(tabId))) {
      await navigateTo(tabId, `https://www.tiktok.com/@${username}`);
    }

    updateStatus('Opening modal…');
    await openModal(tabId);

    const initial = await countNonFriends(tabId);
    state.totalNonFriends = initial;
    addLog(`Non-friends visible at top: ${initial}. Scanning full list…`, 'info');
    updateProgress();

    updateStatus('Running…');
    await runLoop(tabId);

    const chargeICP = state.pricePerUnfollowICP ? state.pricePerUnfollowICP * state.unfollowedCount : 0;
    if (chargeICP > 0) {
      userProfile.balanceICP = Math.max(0, (userProfile.balanceICP || 0) - chargeICP);
      chrome.storage.sync.set({ balanceICP: userProfile.balanceICP });
      icpBalance.textContent = userProfile.balanceICP.toFixed(4);
      addLog(`Debited ${chargeICP.toFixed(6)} ICP for ${state.unfollowedCount} unfollows`, 'success');
    }

    userProfile.totalUnfollows = (userProfile.totalUnfollows || 0) + state.unfollowedCount;
    chrome.storage.sync.set({ totalUnfollows: userProfile.totalUnfollows });
    unfollowedCount.textContent = userProfile.totalUnfollows;

    const finalStatus = state.isRunning ? 'Done ✓' : 'Stopped';
    updateStatus(finalStatus);
    addLog(`Finished! Unfollowed ${state.unfollowedCount} users total.`, 'success');
    showAlert('Unfollowing session completed!', 'success');

    // complete remote session (mock)
    const sid = await new Promise(resolve => chrome.storage.sync.get('currentSessionId', r => resolve(r.currentSessionId)));
    if (sid) {
      await completeRemoteUnfollowSessionMock(sid, state.unfollowedCount);
      chrome.storage.sync.remove('currentSessionId');
    }

  } catch (err) {
    addLog(`Error: ${err.message}`, 'error');
    updateStatus('Error');
    showAlert(err.message, 'error');
  } finally {
    state.isRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
}

// ── RESTORE STATE ON POPUP OPEN ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  addLog('Vyral plugin loaded', 'info');

  chrome.storage.sync.get(['vyralConnected', 'vyralHandle', 'balanceICP', 'totalUnfollows', 'lockTab', 'tikTokHandle'], async (result) => {
    vyralConnected = !!result.vyralConnected;
    vyralUser = result.vyralHandle || null;
    userProfile = {
      ...(userProfile || {}),
      tikTokHandle: result.tikTokHandle || result.vyralHandle || userProfile?.tikTokHandle,
      balanceICP: typeof result.balanceICP === 'number' ? result.balanceICP : 0,
      totalUnfollows: result.totalUnfollows ?? 0,
      lockTab: result.lockTab ?? false,
    };
    if (result.tikTokHandle) {
      document.getElementById('tikTokInput').value = result.tikTokHandle;
    }
    if (result.lockTab) {
      lockTabCheckbox.checked = result.lockTab;
    }
    await updateUI();

    const priceUSD = await fetchIcpUsdPrice();
    if (priceUSD) {
      state.icpPriceUSD = priceUSD;
      state.pricePerUnfollowICP = FIXED_PRICE_USD / priceUSD;
      updatePricingUI();
    }
  });
});
