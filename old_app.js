// ---------- Icons (inline, no external icon font needed) ----------
const ICONS = {
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
  arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  mark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 6 8 4 8 20 5 18"/><line x1="8" y1="4" x2="18" y2="20"/><line x1="8" y1="20" x2="18" y2="4"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
  more: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
};

// ---------- Storage ----------
function loadToken() { return localStorage.getItem("evenly_token"); }
function saveToken(t) { if (t) localStorage.setItem("evenly_token", t); else localStorage.removeItem("evenly_token"); }

function loadActiveGroup() {
  return localStorage.getItem("evenly_active_group") || null;
}
function saveActiveGroup(id) {
  localStorage.setItem("evenly_active_group", id);
}

const cache = { group: {}, activity: {} };

function loadMemberships() {
  try {
    return JSON.parse(localStorage.getItem("evenly_memberships") || "{}");
  } catch (e) {
    return {};
  }
}

const state = {
  token: loadToken(),
  memberships: loadMemberships(), // Populated from local cache, then updated from server
  activeGroupId: loadActiveGroup(),
  group: null,
  activity: [],
};

// ---------- API ----------
async function api(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    if (!state.token) throw new Error("Not logged in");
    headers["Authorization"] = "Bearer " + state.token;
  }
  const res = await fetch("/api" + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail = "Something went wrong";
    try {
      detail = (await res.json()).detail || detail;
    } catch {}
    throw new Error(detail);
  }
  return res.json();
}

// ---------- Helpers ----------
const root = document.getElementById("app");
const fmt = (n) => {
  const sign = n < 0 ? "-" : "";
  return sign + "₹" + Math.abs(n).toFixed(2).replace(/\.00$/, "");
};
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2400);
}
function initials(name) {
  return name.trim().slice(0, 2).toUpperCase();
}
function timeAgo(iso) {
  // If the ISO string doesn't have a timezone indicator (Z or +/- offset), assume UTC.
  const dateStr = (iso.endsWith("Z") || iso.includes("+") || (iso.includes("-") && iso.lastIndexOf("-") > 10)) ? iso : iso + "Z";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff / 60) + "m ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  return Math.floor(diff / 86400) + "d ago";
}

// ---------- Auth screen (create or join) ----------
function renderAuth(prefillCode) {
  renderSidebar(); // Update sidebar state
  const hasCode = !!prefillCode;
  const hasTabs = Object.keys(state.memberships).length > 0;
  
  root.innerHTML = `
    <div class="topbar" style="gap: 12px; padding: 16px 20px; display: flex; align-items: center;">
      <button class="icon-btn menu-btn" aria-label="Menu" style="flex-shrink: 0; background: transparent; padding: 0; width: 28px; justify-content: flex-start;" onclick="openSidebar()">${ICONS.menu}</button>
      <h2 style="font-family: var(--font-display); font-size: 24px; margin: 0; color: var(--ink); flex: 1;">${hasTabs ? 'New Tab' : 'Welcome'}</h2>
      <button class="icon-btn theme-toggle-btn" aria-label="Toggle Theme" style="flex-shrink: 0; width: 38px; height: 38px;"></button>
    </div>
    
    <div class="section" style="padding: 20px; max-width: 440px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; min-height: 60vh; justify-content: center;">
      ${!hasTabs ? `
      <div class="auth-mark" style="margin: 0 auto; width: 40px; height: 40px; color: var(--brass);">
        <svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
          <line x1="10" y1="8" x2="10" y2="32"/><line x1="16" y1="8" x2="16" y2="32"/>
          <line x1="22" y1="8" x2="22" y2="32"/><line x1="28" y1="8" x2="28" y2="32"/>
          <line x1="7" y1="30" x2="31" y2="10"/>
        </svg>
      </div>
      <div style="text-align: center; margin-bottom: 8px;">
        <h1 style="font-family: var(--font-display); font-size: 32px; margin: 0 0 8px; color: var(--ink);">Evenly</h1>
        <p style="color: var(--on-dark-soft); margin: 0; font-size: 15px;">A running tab for your people.</p>
      </div>
      ` : ''}

      <div class="auth-toggle">
        <button id="tab-join" class="${hasCode ? "active" : ""}">Join with a code</button>
        <button id="tab-create" class="${hasCode ? "" : "active"}">Start a tab</button>
      </div>
      
      <div id="auth-card"></div>
      
      ${!hasTabs ? `
      <div style="text-align: center; margin-top: 16px;">
        <a href="#" id="auth-logout-btn" style="color: var(--on-dark-soft); text-decoration: none; font-size: 14px;">Not you? Log Out</a>
      </div>
      ` : ''}
    </div>
  `;
  
  updateThemeIcons();
  
  if (!hasTabs) {
    document.getElementById("auth-logout-btn").onclick = (e) => { 
      e.preventDefault(); 
      saveToken(null); 
      state.token = null; 
      location.reload(); 
    };
  }
  
  document.getElementById("tab-join").onclick = () => renderJoinCard();
  document.getElementById("tab-create").onclick = () => renderCreateCard();
  if (hasCode) renderJoinCard(prefillCode);
  else renderCreateCard();

  function setActive(id) {
    document.getElementById("tab-join").classList.toggle("active", id === "join");
    document.getElementById("tab-create").classList.toggle("active", id === "create");
  }

  function renderCreateCard() {
    setActive("create");
    document.getElementById("auth-card").innerHTML = `
      <form class="auth-card" id="create-form">
        <div class="field">
          <label for="c-group">Tab name</label>
          <input id="c-group" placeholder="Flat 4B, Goa trip, Roommates…" required maxlength="60" />
        </div>
        <div class="field">
          <label for="c-name">Your name</label>
          <input id="c-name" placeholder="How your name should show up" required maxlength="40" />
        </div>
        <p class="form-error hidden" id="create-error"></p>
        <button class="btn-primary" type="submit">Start the tab</button>
      </form>
    `;
    updateThemeIcons();
    document.getElementById("create-form").onsubmit = async (e) => {
      e.preventDefault();
      const groupName = document.getElementById("c-group").value.trim();
      const yourName = document.getElementById("c-name").value.trim();
      const btn = e.target.querySelector("button");
      const err = document.getElementById("create-error");
      err.classList.add("hidden");
      btn.disabled = true;
      const prevHTML = root.innerHTML;
      showSkeleton();
      try {
        const data = await api("/groups", { method: "POST", auth: true, body: { name: groupName, your_name: yourName } });
        adoptMembership(data);
      } catch (ex) {
        root.innerHTML = prevHTML;
        // re-bind form because it was destroyed
        renderAuth();
        // and show error
        setTimeout(() => {
           document.getElementById("tab-create").click();
           const newErr = document.getElementById("create-error");
           newErr.textContent = ex.message;
           newErr.classList.remove("hidden");
        }, 0);
      }
    };
  }

  function renderJoinCard(code) {
    setActive("join");
    document.getElementById("auth-card").innerHTML = `
      <form class="auth-card" id="join-form">
        <div class="field">
          <label for="j-code">Invite code</label>
          <input id="j-code" placeholder="e.g. a1b2c3" required maxlength="12" value="${code || ""}" autocapitalize="off" />
        </div>
        <div class="field">
          <label for="j-name">Your name</label>
          <input id="j-name" placeholder="How your name should show up" required maxlength="40" />
        </div>
        <p class="form-error hidden" id="join-error"></p>
        <button class="btn-primary" type="submit">Join the tab</button>
      </form>
    `;
    document.getElementById("join-form").onsubmit = async (e) => {
      e.preventDefault();
      const inviteCode = document.getElementById("j-code").value.trim().toLowerCase();
      const yourName = document.getElementById("j-name").value.trim();
      const btn = e.target.querySelector("button");
      const err = document.getElementById("join-error");
      err.classList.add("hidden");
      btn.disabled = true;
      try {
        const data = await api(`/groups/by-code/${encodeURIComponent(inviteCode)}/join`, {
          method: "POST",
          auth: true,
          body: { name: yourName },
        });
        adoptMembership(data);
      } catch (ex) {
        err.textContent = ex.message;
        err.classList.remove("hidden");
        btn.disabled = false;
      }
    };
  }
}

function adoptMembership(data) {
  state.memberships[data.group.id] = { 
    group_name: data.group.name, 
    invite_code: data.group.invite_code, 
    member_id: data.member.id, 
    name: data.member.name, 
    color: data.member.color 
  };
  state.activeGroupId = data.group.id;
  saveActiveGroup(data.group.id);
  history.pushState(null, "", "/group-" + data.group.id);
  loadDashboard();
}

// ---------- Dashboard ----------
async function loadDashboard() {
  const gId = state.activeGroupId;
  
  if (cache.group[gId] && cache.activity[gId]) {
    state.group = cache.group[gId];
    state.activity = cache.activity[gId];
    renderDashboard();
  } else {
    showSkeleton();
  }
  
  try {
    const [group, activity] = await Promise.all([
      api(`/groups/${gId}`, { auth: true }),
      api(`/groups/${gId}/activity`, { auth: true }),
    ]);
    
    const isCached = !!(cache.group[gId] && cache.activity[gId]);
    const isUnchanged = isCached && 
      JSON.stringify(cache.group[gId]) === JSON.stringify(group) && 
      JSON.stringify(cache.activity[gId]) === JSON.stringify(activity);
      
    cache.group[gId] = group;
    cache.activity[gId] = activity;
    state.group = group;
    state.activity = activity;
    
    if (!isUnchanged) {
      renderDashboard();
    }
  } catch (ex) {
    if (ex.message.includes("validate credentials")) {
      delete state.memberships[gId];
      state.activeGroupId = null;
      renderAuth();
      toast("Please log in again.");
      return;
    }
    // Show nice error page
    const root = document.getElementById("app");
    root.innerHTML = `
      <div style="padding: 40px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 70vh;">
        <div style="color: var(--debit); margin-bottom: 16px;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h2 style="font-family: var(--font-display); font-size: 24px; margin: 0 0 8px;">Something went wrong</h2>
        <p style="color: var(--on-dark-soft); margin: 0 0 24px;">${escapeHtml(ex.message)}</p>
        <button class="btn-primary" onclick="loadDashboard()">Try Again</button>
      </div>
    `;
  }
}

function clearGroupCache(gId) { delete cache.group[gId]; delete cache.activity[gId]; }

function showSkeleton() {
  root.innerHTML = `
    <div class="topbar">
      <div style="width: 80px; height: 24px; background: var(--skeleton); border-radius: 4px; animation: pulse 1.5s infinite;"></div>
      <div style="width: 24px; height: 24px; background: var(--skeleton); border-radius: 50%; animation: pulse 1.5s infinite;"></div>
    </div>
    <div class="hero">
      <div style="width: 120px; height: 60px; background: var(--skeleton); border-radius: 8px; animation: pulse 1.5s infinite; margin: 0 auto;"></div>
      <div style="width: 150px; height: 16px; background: var(--skeleton); border-radius: 4px; animation: pulse 1.5s infinite; margin: 16px auto 0;"></div>
    </div>
    <div class="members-row" style="opacity: 0.5; display: flex; justify-content: center; gap: 16px;">
      <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--skeleton); animation: pulse 1.5s infinite;"></div>
      <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--skeleton); animation: pulse 1.5s infinite;"></div>
      <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--skeleton); animation: pulse 1.5s infinite;"></div>
    </div>
    
    <div class="totals-summary" style="opacity: 0.5;">
      <div style="width: 100px; height: 32px; background: var(--skeleton); border-radius: 4px; animation: pulse 1.5s infinite;"></div>
      <div style="width: 100px; height: 32px; background: var(--skeleton); border-radius: 4px; animation: pulse 1.5s infinite;"></div>
    </div>

    <div class="section" style="opacity: 0.5;">
      <div style="width: 100px; height: 20px; background: var(--skeleton); border-radius: 4px; margin-bottom: 16px; animation: pulse 1.5s infinite;"></div>
      <div style="width: 100%; height: 60px; background: var(--skeleton); border-radius: 14px; animation: pulse 1.5s infinite;"></div>
    </div>

    <div class="section" style="opacity: 0.5;">
      <div style="width: 80px; height: 20px; background: var(--skeleton); border-radius: 4px; margin-bottom: 16px; animation: pulse 1.5s infinite;"></div>
      <div class="ledger">
        <div class="ledger-row" style="border-bottom-color: var(--skeleton);">
          <div style="display: flex; gap: 12px; align-items: center; width: 100%;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--skeleton); animation: pulse 1.5s infinite; flex-shrink: 0;"></div>
            <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
               <div style="width: 60%; height: 16px; background: var(--skeleton); border-radius: 4px; animation: pulse 1.5s infinite;"></div>
               <div style="width: 40%; height: 12px; background: var(--skeleton); border-radius: 4px; animation: pulse 1.5s infinite;"></div>
            </div>
            <div style="width: 40px; height: 16px; background: var(--skeleton); border-radius: 4px; animation: pulse 1.5s infinite;"></div>
          </div>
        </div>
        <div class="ledger-row" style="border-bottom: none;">
          <div style="display: flex; gap: 12px; align-items: center; width: 100%;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--skeleton); animation: pulse 1.5s infinite; flex-shrink: 0;"></div>
            <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
               <div style="width: 50%; height: 16px; background: var(--skeleton); border-radius: 4px; animation: pulse 1.5s infinite;"></div>
               <div style="width: 30%; height: 12px; background: var(--skeleton); border-radius: 4px; animation: pulse 1.5s infinite;"></div>
            </div>
            <div style="width: 50px; height: 16px; background: var(--skeleton); border-radius: 4px; animation: pulse 1.5s infinite;"></div>
          </div>
        </div>
      </div>
    </div>
    <button class="fab" style="background: var(--skeleton); animation: pulse 1.5s infinite; pointer-events: none; opacity: 0.5; color: transparent;">+</button>
  `;
}


function renderHub() {
  renderSidebar();
  const groupIds = Object.keys(state.memberships);
  const rows = groupIds
    .map(
      (id) =>
        `<button class="group-hub-card" data-id="${id}" style="width: 100%; padding: 16px 20px; margin-bottom: 12px; background: var(--skeleton); border: 1px solid var(--line-dark); border-radius: var(--radius); color: var(--ink); font-size: 16px; font-weight: 500; text-align: left; display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
          ${escapeHtml(state.memberships[id].group_name)}
          <span style="color: var(--on-dark-soft); display: flex; transform: rotate(-90deg);">${ICONS.chevron}</span>
        </button>`
    )
    .join("");

  const emptyState = groupIds.length === 0 ? `<p style="color: var(--on-dark-soft); margin-bottom: 24px; text-align: center; font-size: 15px;">You haven't joined any tabs yet.</p>` : "";

  root.innerHTML = `
    <div class="topbar" style="padding: 16px 20px; display: flex; align-items: center; gap: 12px;">
      <button class="icon-btn menu-btn" aria-label="Menu" style="flex-shrink: 0; background: transparent; padding: 0; width: 28px; justify-content: flex-start;" onclick="openSidebar()">${ICONS.menu}</button>
      <h2 style="font-family: var(--font-display); font-size: 24px; margin: 0; color: var(--ink); flex: 1;">Your tabs</h2>
      <div style="display: flex; gap: 8px;">
        <button class="icon-btn theme-toggle-btn" aria-label="Toggle Theme"></button>
        <button class="icon-btn" id="logout-btn" aria-label="Log Out" style="color: var(--debit); padding: 8px;">${ICONS.logout}</button>
      </div>
    </div>
    <div style="padding: 20px;">
      ${emptyState}
      <div style="margin-bottom: 24px;">${rows}</div>
      <button class="btn-primary" id="hub-new-btn" style="width: 100%;">Join or start a tab</button>
    </div>
  `;

  updateThemeIcons();
  document.getElementById("logout-btn").onclick = () => {
    saveToken(null);
    localStorage.removeItem("evenly_memberships");
    saveActiveGroup(null);
    localStorage.removeItem("evenly_active_group"); // Just in case saveActiveGroup(null) saves "null" as string
    state.token = null;
    state.memberships = {};
    state.activeGroupId = null;
    showLogin();
  };

  document.querySelectorAll(".group-hub-card").forEach(btn => {
    btn.onclick = () => {
      state.activeGroupId = btn.dataset.id;
      saveActiveGroup(state.activeGroupId);
      history.pushState(null, "", "/group-" + state.activeGroupId);
      loadDashboard();
    };
  });

  document.getElementById("hub-new-btn").onclick = () => {
    history.pushState(null, "", "/new");
    renderAuth();
  };
}


function renderSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;
  
  const groupIds = Object.keys(state.memberships);
  let userName = "You";
  if (groupIds.length > 0) {
    userName = state.memberships[groupIds[0]].name;
  }
  
  const rows = groupIds.map(id => {
    const m = state.memberships[id];
    const isActive = id === state.activeGroupId;
    return `<button class="sidebar-link ${isActive ? 'active' : ''}" data-id="${id}">
      <div class="sidebar-link-icon">${m.group_name.charAt(0).toUpperCase()}</div>
      <div style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(m.group_name)}</div>
      ${isActive ? `<div style="width:6px;height:6px;border-radius:50%;background:var(--brass);margin-left:auto;"></div>` : ''}
    </button>`;
  }).join("");

  sidebar.innerHTML = `
    <div class="sidebar-header" id="sidebar-logo" style="cursor: pointer;">
      <div class="auth-mark" style="color: var(--brass); width: 28px; height: 28px;">
        <svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
          <line x1="10" y1="8" x2="10" y2="32"/><line x1="16" y1="8" x2="16" y2="32"/>
          <line x1="22" y1="8" x2="22" y2="32"/><line x1="28" y1="8" x2="28" y2="32"/>
          <line x1="7" y1="30" x2="31" y2="10"/>
        </svg>
      </div>
      <h1 class="sidebar-title">Evenly</h1>
    </div>
    
    <div class="sidebar-section">Active Groups</div>
    <div class="sidebar-nav">
      ${rows}
      <button class="sidebar-link" id="sidebar-new-btn" style="color: var(--primary);">
        <div class="sidebar-link-icon" style="background: transparent; color: var(--primary);">${ICONS.plus}</div>
        Start or join a tab
      </button>
    </div>
    
    <div class="sidebar-footer">
      <button class="sidebar-profile" id="sidebar-settings-btn" style="width: 100%; text-align: left; cursor: pointer; display: flex; align-items: center; justify-content: space-between; background: var(--bg-soft); border: 1px solid var(--line-dark); border-radius: 12px; padding: 12px;">
        <div class="profile-info" style="display: flex; align-items: center; gap: 10px;">
          <div class="profile-avatar">${initials(userName)}</div>
          <div class="profile-text" style="display: flex; flex-direction: column;">
            <span class="profile-name" style="font-size: 14px; font-weight: 600; color: var(--ink);">${escapeHtml(userName)}</span>
            <span class="profile-sub" style="font-size: 12px; color: var(--on-dark-soft);">Personal settings</span>
          </div>
        </div>
        <div style="color: var(--on-dark-soft); display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;">${ICONS.settings}</div>
      </button>
    </div>
  `;

  document.querySelectorAll(".sidebar-link[data-id]").forEach(btn => {
    btn.onclick = () => {
      closeSidebar();
      state.activeGroupId = btn.dataset.id;
      saveActiveGroup(state.activeGroupId);
      history.pushState(null, "", "/group-" + state.activeGroupId);
      loadDashboard();
    };
  });
  
  document.getElementById("sidebar-new-btn").onclick = () => {
    closeSidebar();
    history.pushState(null, "", "/new");
    renderAuth();
  };

  const logoBtn = document.getElementById("sidebar-logo");
  if (logoBtn) {
    logoBtn.onclick = () => {
      closeSidebar();
      state.activeGroupId = null;
      localStorage.removeItem("evenly_active_group");
      history.pushState(null, "", "/");
      renderHub();
    };
  }
  
  document.getElementById("sidebar-settings-btn").onclick = () => {
    closeSidebar();
    history.pushState(null, "", "/settings");
    renderSettings();
  };
}


function renderSettings() {
  renderSidebar(); // Ensure sidebar is updated
  const appDiv = document.getElementById("app");
  
  appDiv.innerHTML = `
    <div class="topbar" style="gap: 12px; padding: 16px 20px; display: flex; align-items: center;">
      <button class="icon-btn menu-btn" aria-label="Menu" style="flex-shrink: 0; background: transparent; padding: 0; width: 28px; justify-content: flex-start;" onclick="openSidebar()">${ICONS.menu}</button>
      <h2 style="font-family: var(--font-display); font-size: 24px; margin: 0; color: var(--ink); flex: 1;">Settings</h2>
    </div>
    <div class="section" style="padding: 20px;">
      <div style="background: var(--bg-soft); border: 1px solid var(--line-dark); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
         <h3 style="margin: 0 0 16px; font-size: 16px; color: var(--ink);">Preferences</h3>
         <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
           <span style="font-size: 15px; color: var(--ink); font-weight: 500;">Push Notifications</span>
           <button id="push-toggle-btn" class="btn-primary" style="padding: 8px 16px; font-size: 14px; border-radius: 20px;">Enable</button>
         </div>
         <div style="display: flex; justify-content: space-between; align-items: center;">
           <span style="font-size: 15px; color: var(--ink); font-weight: 500;">Dark Mode</span>
           <button class="icon-btn theme-toggle-btn" aria-label="Toggle Theme" style="border: 1px solid var(--line-dark); width: 44px; height: 44px;"></button>
         </div>
      </div>
      
      <div style="background: var(--bg-soft); border: 1px solid var(--line-dark); border-radius: 12px; padding: 20px;">
         <h3 style="margin: 0 0 16px; font-size: 16px; color: var(--debit);">Account</h3>
         <button class="btn-secondary" id="settings-logout-btn" style="width: 100%; color: var(--debit); border-color: rgba(194, 91, 70, 0.4); font-size: 15px; padding: 12px;">Log Out</button>
      </div>
    </div>
  `;
  
  updateThemeIcons();
  

  
  
  document.getElementById("push-toggle-btn").onclick = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error("Push notifications not supported in this browser.");
      }
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
         throw new Error("Notification permission denied.");
      }
      
      const btn = document.getElementById("push-toggle-btn");
      btn.textContent = "Loading...";
      btn.disabled = true;

      const reg = await navigator.serviceWorker.ready;
      const vapidRes = await fetch("/api/notifications/vapid-public", { headers: { "Authorization": "Bearer " + state.token } });
      const vapidData = await vapidRes.json();
      if (!vapidRes.ok || !vapidData.public_key) throw new Error("Failed to load Push Notification keys from server.");
      
      function urlBase64ToUint8Array(base64String) {
        const padding = "=".repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
        const rawData = window.atob(base64);
        return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
      }
      
      const sub = await reg.pushManager.subscribe({
         userVisibleOnly: true,
         applicationServerKey: urlBase64ToUint8Array(vapidData.public_key)
      });
      
      const p256dh = btoa(String.fromCharCode.apply(null, new Uint8Array(sub.getKey('p256dh')))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const auth = btoa(String.fromCharCode.apply(null, new Uint8Array(sub.getKey('auth')))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      
      await api("/notifications/subscribe", {
        method: "POST", auth: true,
        body: {
          endpoint: sub.endpoint,
          p256dh: p256dh,
          auth: auth
        }
      });
      
      toast("Notifications enabled!");
      btn.textContent = "Enabled";
    } catch(e) {
      customAlert(e.message);
      document.getElementById("push-toggle-btn").textContent = "Enable";
      document.getElementById("push-toggle-btn").disabled = false;
    }
  };

  document.getElementById("settings-logout-btn").onclick = async () => {
    if (await customConfirm("Are you sure you want to log out?")) {
      saveToken(null);
      localStorage.removeItem("evenly_memberships");
      saveActiveGroup(null);
      localStorage.removeItem("evenly_active_group");
      state.token = null;
      state.memberships = {};
      state.activeGroupId = null;
      history.replaceState(null, "", "/");
      showLogin();
    }
  };
}

function openSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("sidebar-overlay").classList.add("show");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-overlay").classList.remove("show");
}

document.getElementById("sidebar-overlay").onclick = closeSidebar;

function renderDashboard() {
  renderSidebar();
  const g = state.group;
  const me = state.memberships[g.id];
  const myMemberInfo = g.members.find((m) => m.id === me.member_id) || {};
  const myBalance = myMemberInfo.balance || 0;
  const isAdmin = myMemberInfo.is_admin || false;
  const heroClass = myBalance > 0.01 ? "credit" : myBalance < -0.01 ? "debit" : "even";
  const heroLabel = myBalance > 0.01 ? "you're owed, overall" : myBalance < -0.01 ? "you owe, overall" : "you're all settled up";
  const multiGroup = Object.keys(state.memberships).length > 1;

  root.innerHTML = `
    <div class="topbar" style="gap: 12px;">
      <button class="icon-btn menu-btn" aria-label="Menu" style="flex-shrink: 0; background: transparent; padding: 0; width: 28px; justify-content: flex-start;" onclick="openSidebar()">${ICONS.menu}</button>
      <button class="topbar-group" id="group-switch" style="flex: 1; padding: 0; justify-content: flex-start; text-align: left;">${escapeHtml(g.name)} ${ICONS.chevron}</button>
      <div style="display: flex; gap: 8px; flex-shrink: 0;">
        <button class="icon-btn theme-toggle-btn" aria-label="Toggle Theme" style="width:38px; height:38px;"></button>
        <button class="icon-btn" id="invite-btn" aria-label="Invite people">${ICONS.share}</button>
        <button class="icon-btn" id="group-settings-btn" aria-label="Tab Settings">${ICONS.more}</button>
      </div>
    </div>

    <div class="hero">
      <p class="hero-figure ${heroClass}">${fmt(myBalance)}</p>
      <p class="hero-label">${heroLabel}</p>
    </div>

    <div class="members-row" id="members-row"></div>
    
    <div class="totals-summary" id="totals-summary"></div>

    <div class="section">
      <h2 class="section-title">Settle up</h2>
      <div class="settle-list" id="settle-list"></div>
    </div>

    <div class="section">
      <h2 class="section-title">Activity</h2>
      <div class="ledger" id="ledger"></div>
      <div class="fab-spacer"></div>
    </div>

    <button class="fab" id="add-fab" aria-label="Add expense">${ICONS.plus}</button>
  `;

  updateThemeIcons();
  const membersRow = document.getElementById("members-row");
  membersRow.innerHTML = g.members
    .map(
      (m) => `
      <div class="member-chip">
        <div class="member-avatar" style="background:${m.color}">${initials(m.name)}</div>
        <div class="member-name">${m.id === me.member_id ? "You" : escapeHtml(m.name)}</div>
        <div class="member-balance ${m.balance > 0.01 ? "credit" : m.balance < -0.01 ? "debit" : ""}">${fmt(m.balance)}</div>
      </div>`
    )
    .join("");

  const settleList = document.getElementById("settle-list");
  
  const totalGroupExpenses = state.activity
    .filter(a => a.type === "expense")
    .reduce((sum, a) => sum + parseFloat(a.amount), 0);

  const myTotalShare = state.activity
    .filter(a => a.type === "expense")
    .reduce((sum, a) => {
      const mySplit = a.splits.find(s => s.member_id === me.member_id);
      return sum + (mySplit ? parseFloat(mySplit.share_amount) : 0);
    }, 0);

  document.getElementById("totals-summary").innerHTML = `
    <div class="total-box">
      <span class="total-label">Group total</span>
      <span class="total-val">${fmt(totalGroupExpenses)}</span>
    </div>
    <div class="total-box">
      <span class="total-label">Your share</span>
      <span class="total-val">${fmt(myTotalShare)}</span>
    </div>
  `;

  if (g.simplified_debts.length === 0) {
    settleList.innerHTML = `<p class="empty-note">Everyone's settled up. Nothing owed either way.</p>`;
  } else {
    settleList.innerHTML = g.simplified_debts
      .map(
        (d) => `
        <div class="settle-row">
          <span class="settle-text">${d.from_member === me.member_id ? "You" : escapeHtml(d.from_name)} owe${d.from_member === me.member_id ? "" : "s"}
            ${d.to_member === me.member_id ? "you" : escapeHtml(d.to_name)}
            <span class="amt">${fmt(d.amount)}</span></span>
          <button class="settle-btn" data-from="${d.from_member}" data-to="${d.to_member}" data-amount="${d.amount}" data-from-name="${escapeHtml(d.from_name)}" data-to-name="${escapeHtml(d.to_name)}">Settle</button>
        </div>`
      )
      .join("");
    settleList.querySelectorAll(".settle-btn").forEach((btn) => {
      btn.onclick = () => {
        const debt = {
          from_member: btn.dataset.from,
          to_member: btn.dataset.to,
          amount: parseFloat(btn.dataset.amount),
          from_name: btn.dataset.fromName,
          to_name: btn.dataset.toName
        };
        renderSettleModal(debt, g.id);
      };
    });
  }

  const ledger = document.getElementById("ledger");
  const EMOJI_MAP = { "Food": "🍔", "Travel": "✈️", "Housing": "🏠", "Utilities": "💡", "General": "🧾" };
  
  if (state.activity.length === 0) {
    ledger.innerHTML = `<p class="empty-note">Nothing logged yet — add the first expense.</p>`;
  } else {
    ledger.innerHTML = state.activity
      .map((item) => {
        if (item.type === "settlement") {
          const canEditSettle = isAdmin || item.from_member === me.member_id || item.to_member === me.member_id;
          return `
            <div class="ledger-row settlement">
              <div class="ledger-main">
                <p class="ledger-desc"><span style="margin-right: 8px;">💸</span>${item.from_member === me.member_id ? "You" : escapeHtml(item.from_name)} paid ${item.to_member === me.member_id ? "you" : escapeHtml(item.to_name)}</p>
                <p class="ledger-meta">${timeAgo(item.created_at)} · settled</p>
              </div>
              <div class="ledger-amt">
                ${fmt(item.amount)}
                ${canEditSettle ? `<button class="ledger-del" data-type="settlement" data-id="${item.id}" aria-label="Delete">${ICONS.close}</button>` : ''}
              </div>
            </div>`;
        }
        const names = item.splits.map((s) => (s.member_id === me.member_id ? "you" : s.name)).join(", ");
        const canEdit = isAdmin || item.paid_by === me.member_id;
        const catEmoji = EMOJI_MAP[item.category] || "🧾";
        return `
          <div class="ledger-row" style="cursor: ${canEdit ? 'pointer' : 'default'}" ${canEdit ? `onclick='window.editExpense("${item.id}")'` : ''}>
            <div class="ledger-main">
              <p class="ledger-desc"><span style="margin-right: 8px;">${catEmoji}</span>${escapeHtml(item.description)}</p>
              <p class="ledger-meta">${item.paid_by_name} paid · split with ${names} · ${timeAgo(item.created_at)}</p>
            </div>
            <div class="ledger-amt" onclick="event.stopPropagation()">
              ${fmt(item.amount)}
              ${canEdit ? `<button class="ledger-del" data-type="expense" data-id="${item.id}" aria-label="Delete">${ICONS.close}</button>` : ''}
            </div>
          </div>`;
      })
      .join("");
      
    // Expose edit handler to global for inline onclick
    window.editExpense = (id) => {
      const exp = state.activity.find(a => a.id === id);
      if (exp) openAddExpenseSheet(exp);
    };

    ledger.querySelectorAll(".ledger-del").forEach((btn) => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const type = btn.dataset.type || "expense";
        const endpoint = type === "settlement" ? "settlements" : "expenses";
        if (!await customConfirm(`Remove this ${type} from the tab?`)) return;
        try {
          await api(`/groups/${g.id}/${endpoint}/${btn.dataset.id}`, { method: "DELETE", auth: true });
          clearGroupCache(g.id);
          loadDashboard();
        } catch (ex) {
          toast(ex.message);
        }
      };
    });
  }

  document.getElementById("add-fab").onclick = () => openAddExpenseSheet(null);
  document.getElementById("invite-btn").onclick = openInviteSheet;
  document.getElementById("group-switch").onclick = openGroupSwitcher;
  const settingsBtn = document.getElementById("group-settings-btn");
  if (settingsBtn) settingsBtn.onclick = () => renderGroupSettings();
}


function renderGroupSettings(onClose = null) {
  const overlay = document.createElement("div");
  overlay.className = "sheet-overlay";
  document.body.appendChild(overlay);
  
  overlay.onclick = (e) => {
    if (e.target === overlay) {
       overlay.remove();
       if (onClose) onClose();
    }
  };

  try {
    const groupData = state.group;
    if (!groupData) throw new Error("Group data not loaded.");
    const myMemberId = state.memberships[state.activeGroupId].member_id;
    const myMember = groupData.members.find(m => m.id === myMemberId);
    const isAdmin = myMember && myMember.is_admin;

    let membersHtml = `<div style="margin-bottom: 24px;">
      <h3 style="margin-top:0; margin-bottom: 12px; font-size: 16px; font-family: var(--font-display);">Members</h3>
      <div style="display:flex; flex-direction:column; gap: 8px;">`;
    
    groupData.members.forEach(m => {
        const isMe = m.id === myMemberId;
        const removeBtn = (isAdmin && !isMe) ? `<button class="remove-btn" data-id="${m.id}" style="color: var(--debit); background: transparent; border: none; font-size: 14px; font-weight: 500; cursor: pointer; padding: 4px;">Remove</button>` : '';
        const youTag = isMe ? `<span style="font-size:12px; color:var(--ink-soft); margin-left:8px;">(You)</span>` : '';
        const adminTag = m.is_admin ? `<span style="font-size:12px; color:var(--primary); margin-left:8px;">(Creator)</span>` : '';
        membersHtml += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-soft); border: 1px solid var(--line-dark); border-radius: 8px;">
            <div style="font-weight:500;">${escapeHtml(m.name)}${youTag}${adminTag}</div>
            ${removeBtn}
          </div>
        `;
    });
    membersHtml += `</div></div>`;

    overlay.innerHTML = `
      <div class="sheet" onclick="event.stopPropagation()">
        <div class="sheet-handle"></div>
        <h3 style="margin-top:0; margin-bottom: 20px; font-family: var(--font-display); font-size: 20px;">Tab Settings</h3>
        
        ${isAdmin ? `
        <form id="group-edit-form">
          <div class="field">
            <label>Tab Name</label>
            <input id="g-name-input" value="${escapeHtml(state.memberships[state.activeGroupId].group_name)}" required maxlength="60" />
          </div>
          <button type="submit" class="btn-primary" style="margin-bottom: 12px; margin-top: 10px;">Save Changes</button>
        </form>
        <hr style="border: 0; border-top: 1px solid var(--line-dark); margin: 24px 0;">
        ` : ''}
        
        ${membersHtml}

        <hr style="border: 0; border-top: 1px solid var(--line-dark); margin: 24px 0;">
        <button id="group-export-btn" class="btn-secondary" style="width: 100%; margin-bottom: 24px;">Export as CSV</button>
        
        <h3 style="margin-top:0; margin-bottom: 16px; font-family: var(--font-display); font-size: 18px; color: var(--debit);">Danger Zone</h3>
        <button id="group-leave-btn" class="btn-secondary" style="width: 100%; color: var(--debit); border-color: rgba(194, 91, 70, 0.4); margin-bottom: ${isAdmin ? '12px' : '0'};">Leave Tab</button>
        ${isAdmin ? `<button id="group-delete-btn" class="btn-secondary" style="width: 100%; color: var(--debit); border-color: rgba(194, 91, 70, 0.4);">Delete Tab</button>` : ''}
      </div>
    `;
    
    // Bind Export
    overlay.querySelector("#group-export-btn").onclick = async () => {
      try {
        const res = await fetch(`/api/groups/${state.activeGroupId}/export/csv`, {
          headers: { "Authorization": "Bearer " + state.token }
        });
        if (!res.ok) throw new Error("Export failed");
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${state.memberships[state.activeGroupId].group_name.replace(/ /g, '_')}_export.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } catch(err) {
        customAlert(err.message);
      }
    };

    if (isAdmin) {
      overlay.querySelector("#group-edit-form").onsubmit = async (e) => {
        e.preventDefault();
        const newName = document.getElementById("g-name-input").value.trim();
        if (!newName) return;
        try {
          await api("/groups/" + state.activeGroupId, {
            method: "PUT",
            auth: true,
            body: { name: newName }
          });
          state.memberships[state.activeGroupId].group_name = newName;
          localStorage.setItem("evenly_memberships", JSON.stringify(state.memberships));
          if (state.group && state.group.id === state.activeGroupId) {
             state.group.name = newName;
             loadDashboard();
          }
          overlay.remove();
          renderSidebar();
        } catch (err) {
          customAlert("Error: " + err.message);
        }
      };

      const delBtn = overlay.querySelector("#group-delete-btn");
      if (delBtn) delBtn.onclick = async () => {
        if (!await customConfirm("Are you sure you want to permanently delete this tab? This cannot be undone.")) return;
        try {
          await api("/groups/" + state.activeGroupId, { method: "DELETE", auth: true });
          delete state.memberships[state.activeGroupId];
          localStorage.setItem("evenly_memberships", JSON.stringify(state.memberships));
          clearGroupCache(state.activeGroupId);
          
          overlay.remove();
          if (onClose) onClose();
          
          state.activeGroupId = null;
          saveActiveGroup(null);
          history.pushState(null, "", "/");
          renderHub();
        } catch(err) {
          customAlert("Error deleting tab: " + err.message);
        }
      };
      
      overlay.querySelectorAll(".remove-btn").forEach(btn => {
        btn.onclick = async () => {
          if (!await customConfirm("Remove this member from the tab?")) return;
          try {
            await api(`/groups/${state.activeGroupId}/members/${btn.dataset.id}`, { method: "DELETE", auth: true });
            overlay.remove();
            clearGroupCache(state.activeGroupId);
            loadDashboard(); // Refresh current UI
          } catch(err) {
            customAlert("Error removing member: " + err.message);
          }
        };
      });
    }

    overlay.querySelector("#group-leave-btn").onclick = async () => {
      if (!await customConfirm("Are you sure you want to leave this tab?")) return;
      try {
        await api(`/groups/${state.activeGroupId}/members/me`, { method: "DELETE", auth: true });
        delete state.memberships[state.activeGroupId];
        localStorage.setItem("evenly_memberships", JSON.stringify(state.memberships));
        clearGroupCache(state.activeGroupId);
        
        overlay.remove();
        if (onClose) onClose();
        
        state.activeGroupId = null;
        saveActiveGroup(null);
        history.pushState(null, "", "/");
        renderHub();
      } catch(err) {
        customAlert("Error leaving tab: " + err.message);
      }
    };
  } catch (err) {
    overlay.innerHTML = `<div class="sheet" onclick="event.stopPropagation()">
      <div class="sheet-handle"></div>
      <div style="padding: 20px; color: var(--debit); text-align: center;">Error loading settings: ${err.message}</div>
    </div>`;
  }
}

async function markSettled(from, to, amount) {
  try {
    await api(`/groups/${state.group.id}/settlements`, {
      method: "POST",
      auth: true,
      body: { from_member: from, to_member: to, amount },
    });
    toast("Marked as settled");
    loadDashboard();
  } catch (ex) {
    toast(ex.message);
  }
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

// ---------- Add expense sheet ----------
function openAddExpenseSheet(expToEdit = null) {
  const g = state.group;
  const me = state.memberships[g.id];
  const overlay = document.createElement("div");
  overlay.className = "sheet-overlay";
  
  const title = expToEdit ? "Edit expense" : "Add an expense";
  const btnText = expToEdit ? "Save changes" : "Add to the tab";
  
  overlay.innerHTML = `
    <div class="sheet">
      <div class="sheet-handle"></div>
      <h2 class="sheet-title">${title}</h2>
      <form id="expense-form" style="display:flex;flex-direction:column;gap:16px;">
        <div class="field">
          <label for="e-desc">What was it for</label>
          <input id="e-desc" placeholder="Groceries, cab, movie tickets…" required maxlength="120" value="${expToEdit ? escapeHtml(expToEdit.description) : ''}" />
        </div>
        <div class="field">
          <label>Category</label>
          <select id="e-category" style="width: 100%; background: var(--bg-soft); border: 1px solid var(--line-paper); border-radius: 10px; padding: 12px 13px; font-size: 16px; color: var(--ink);">
            <option value="General">General</option>
            <option value="Food">Food</option>
            <option value="Travel">Travel</option>
            <option value="Housing">Housing</option>
            <option value="Utilities">Utilities</option>
          </select>
        </div>
        <div class="field">
          <label for="e-amount">Amount</label>
          <input id="e-amount" type="number" step="0.01" min="0.01" placeholder="0.00" required value="${expToEdit ? expToEdit.amount : ''}" />
        </div>
        <div class="field">
          <label>Paid by</label>
          <div class="chip-row" id="paid-by-chips"></div>
        </div>
        <div class="field">
          <label>Split</label>
          <div class="chip-row" id="split-type-chips">
            <button type="button" class="chip selected" data-type="equal">Equal</button>
            <button type="button" class="chip" data-type="exact">Exact amounts</button>
            <button type="button" class="chip" data-type="percentage">Percentage</button>
          </div>
        </div>
        <div class="field" id="split-detail"></div>
        <p class="form-error hidden" id="expense-error"></p>
        <button class="btn-primary" type="submit">${btnText}</button>
        ${expToEdit ? `<button type="button" class="btn-secondary" id="delete-expense-btn" style="color: var(--debit); border-color: rgba(194, 91, 70, 0.4);">Delete Expense</button>` : ''}
      </form>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.onclick = (e) => {
    if (e.target === overlay) {
       overlay.remove();
       if (onClose) onClose();
    }
  };

  const paidByChips = overlay.querySelector("#paid-by-chips");
  let paidBy = expToEdit ? expToEdit.paid_by : me.member_id;
  
  paidByChips.innerHTML = g.members
    .map((m) => `<button type="button" class="chip${m.id === paidBy ? " selected" : ""}" data-id="${m.id}">${m.id === me.member_id ? "You" : escapeHtml(m.name)}</button>`)
    .join("");
    
  paidByChips.querySelectorAll(".chip").forEach((chip) => {
    chip.onclick = () => {
      paidByChips.querySelectorAll(".chip").forEach((c) => c.classList.remove("selected"));
      chip.classList.add("selected");
      paidBy = chip.dataset.id;
    };
  });

  let splitType = expToEdit ? expToEdit.split_type : "equal";
  const splitTypeChips = overlay.querySelector("#split-type-chips");
  
  // Update split type chips to reflect current type
  splitTypeChips.querySelectorAll(".chip").forEach(c => {
    c.classList.toggle("selected", c.dataset.type === splitType);
  });
  
  const splitDetail = overlay.querySelector("#split-detail");
  const amountInput = overlay.querySelector("#e-amount");

  let participantIds = new Set(expToEdit && expToEdit.split_type === "equal" ? expToEdit.splits.map(s => s.member_id) : g.members.map((m) => m.id));
  const exactValues = {};
  const pctValues = {};
  
  clearGroupCache(g.id);
      if (expToEdit) {
    if (expToEdit.split_type === "exact") {
      expToEdit.splits.forEach(s => exactValues[s.member_id] = s.share_amount);
    } else if (expToEdit.split_type === "percentage") {
      expToEdit.splits.forEach(s => pctValues[s.member_id] = s.share_amount);
    }
  }

  function renderSplitDetail() {
    const amount = parseFloat(amountInput.value) || 0;
    if (splitType === "equal") {
      splitDetail.innerHTML = `
        <label>Split between</label>
        <div class="chip-row">
          ${g.members
            .map(
              (m) =>
                `<button type="button" class="chip${participantIds.has(m.id) ? " selected" : ""}" data-id="${m.id}">${m.id === me.member_id ? "You" : escapeHtml(m.name)}</button>`
            )
            .join("")}
        </div>`;
      splitDetail.querySelectorAll(".chip").forEach((chip) => {
        chip.onclick = () => {
          const id = chip.dataset.id;
          if (participantIds.has(id)) participantIds.delete(id);
          else participantIds.add(id);
          chip.classList.toggle("selected");
        };
      });
    } else if (splitType === "exact") {
      splitDetail.innerHTML = `
        <label>Amount per person</label>
        ${g.members
          .map(
            (m) => `
          <div class="split-row">
            <span>${m.id === me.member_id ? "You" : escapeHtml(m.name)}</span>
            <input type="number" step="0.01" min="0" data-id="${m.id}" class="exact-input" value="${exactValues[m.id] ?? ""}" placeholder="0.00" />
          </div>`
          )
          .join("")}
        <p class="split-total" id="split-total-note"></p>
      `;
      splitDetail.querySelectorAll(".exact-input").forEach((inp) => {
        inp.oninput = () => {
          exactValues[inp.dataset.id] = parseFloat(inp.value) || 0;
          updateExactTotal();
        };
      });
      updateExactTotal();
    } else {
      splitDetail.innerHTML = `
        <label>Percentage per person</label>
        ${g.members
          .map(
            (m) => `
          <div class="split-row">
            <span>${m.id === me.member_id ? "You" : escapeHtml(m.name)}</span>
            <input type="number" step="0.1" min="0" data-id="${m.id}" class="pct-input" value="${pctValues[m.id] ?? ""}" placeholder="0" />
          </div>`
          )
          .join("")}
        <p class="split-total" id="split-total-note"></p>
      `;
      splitDetail.querySelectorAll(".pct-input").forEach((inp) => {
        inp.oninput = () => {
          pctValues[inp.dataset.id] = parseFloat(inp.value) || 0;
          updatePctTotal();
        };
      });
      updatePctTotal();
    }

    function updateExactTotal() {
      const total = Object.values(exactValues).reduce((a, b) => a + b, 0);
      const note = document.getElementById("split-total-note");
      const diff = Math.round((amount - total) * 100) / 100;
      note.textContent = diff === 0 ? `Adds up to ${amount.toFixed(2)} ✓` : `${total.toFixed(2)} of ${amount.toFixed(2)} (${diff > 0 ? diff.toFixed(2) + " left" : Math.abs(diff).toFixed(2) + " over"})`;
      note.classList.toggle("off", diff !== 0);
    }
    function updatePctTotal() {
      const total = Object.values(pctValues).reduce((a, b) => a + b, 0);
      const note = document.getElementById("split-total-note");
      const diff = Math.round((100 - total) * 10) / 10;
      note.textContent = diff === 0 ? "Adds up to 100% ✓" : `${total.toFixed(1)}% of 100%`;
      note.classList.toggle("off", diff !== 0);
    }
  }
  renderSplitDetail();
  amountInput.oninput = renderSplitDetail;

  splitTypeChips.querySelectorAll(".chip").forEach((chip) => {
    chip.onclick = () => {
      splitTypeChips.querySelectorAll(".chip").forEach((c) => c.classList.remove("selected"));
      chip.classList.add("selected");
      splitType = chip.dataset.type;
      renderSplitDetail();
    };
  });

  clearGroupCache(g.id);
      if (expToEdit) {
    const delBtn = overlay.querySelector("#delete-expense-btn");
    delBtn.onclick = async () => {
      if (await customConfirm("Delete this expense?")) {
        delBtn.textContent = "Deleting...";
        delBtn.disabled = true;
        try {
          clearGroupCache(g.id);
          await api(`/groups/${g.id}/expenses/${expToEdit.id}`, { method: "DELETE", auth: true });
          overlay.remove();
          loadDashboard();
        } catch (ex) {
          customAlert(ex.message);
          delBtn.disabled = false;
          delBtn.textContent = "Delete Expense";
        }
      }
    };
  }

  overlay.querySelector("#expense-form").onsubmit = async (e) => {
    e.preventDefault();
    const err = overlay.querySelector("#expense-error");
    err.classList.add("hidden");
    const description = overlay.querySelector("#e-desc").value.trim();
    const amount = parseFloat(amountInput.value);
    const payload = { description, amount, paid_by: paidBy, split_type: splitType };

    if (splitType === "equal") {
      payload.participant_ids = Array.from(participantIds);
    } else if (splitType === "exact") {
      payload.splits = g.members.filter((m) => exactValues[m.id] > 0).map((m) => ({ member_id: m.id, value: exactValues[m.id] }));
    } else {
      payload.splits = g.members.filter((m) => pctValues[m.id] > 0).map((m) => ({ member_id: m.id, value: pctValues[m.id] }));
    }

    const btn = e.target.querySelector("button[type=submit]");
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Saving...";
    try {
      clearGroupCache(g.id);
      if (expToEdit) {
        await api(`/groups/${g.id}/expenses/${expToEdit.id}`, { method: "PUT", auth: true, body: payload });
      } else {
        await api(`/groups/${g.id}/expenses`, { method: "POST", auth: true, body: payload });
      }
      overlay.remove();
      loadDashboard();
    } catch (ex) {
      err.textContent = ex.message;
      err.classList.remove("hidden");
      btn.disabled = false;
      btn.textContent = originalText;
    }
  };
}

// ---------- Invite sheet ----------
function openInviteSheet() {
  const g = state.group;
  const link = `${location.origin}/?code=${g.invite_code}`;
  const overlay = document.createElement("div");
  overlay.className = "sheet-overlay";
  overlay.innerHTML = `
    <div class="sheet">
      <div class="sheet-handle"></div>
      <h2 class="sheet-title">Invite someone to ${escapeHtml(g.name)}</h2>
      <div class="share-box">
        <span class="share-code">${g.invite_code}</span>
        <button class="btn-secondary" id="copy-code">Copy code</button>
      </div>
      <p class="share-hint">Or send this link — opening it fills in the code for them:</p>
      <div class="share-box">
        <span style="font-size:13px;word-break:break-all;">${link}</span>
        <button class="btn-secondary" id="copy-link">Copy</button>
      </div>
      <div style="margin-top:16px;">
        <button class="btn-primary" id="native-share" style="width:100%;">Share link</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.onclick = (e) => {
    if (e.target === overlay) {
       overlay.remove();
       if (onClose) onClose();
    }
  };
  overlay.querySelector("#copy-code").onclick = () => copyText(g.invite_code);
  overlay.querySelector("#copy-link").onclick = () => copyText(link);
  overlay.querySelector("#native-share").onclick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Join ${g.name} on Evenly`, url: link });
      } catch {}
    } else {
      copyText(link);
    }
  };
}
function copyText(text) {
  navigator.clipboard?.writeText(text).then(() => toast("Copied"));
}

// ---------- Group switcher ----------
function openGroupSwitcher() {
  const overlay = document.createElement("div");
  overlay.className = "sheet-overlay";
  const rows = Object.entries(state.memberships)
    .map(
      ([id, m]) =>
        `<button class="${id === state.activeGroupId ? "current" : ""}" data-id="${id}">${escapeHtml(m.group_name)}</button>`
    )
    .join("");
  overlay.innerHTML = `
    <div class="sheet">
      <div class="sheet-handle"></div>
      <h2 class="sheet-title">Your tabs</h2>
      <div class="group-list">${rows}</div>
      <div style="margin-top:14px; display: flex; flex-direction: column; gap: 8px;">
        <button class="btn-secondary" id="new-tab-btn" style="width:100%;">Start or join another tab</button>
        <button class="btn-secondary" id="logout-btn" style="width:100%; border-color: rgba(194, 91, 70, 0.4); color: var(--debit);">Log out</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.onclick = (e) => {
    if (e.target === overlay) {
       overlay.remove();
       if (onClose) onClose();
    }
  };
  overlay.querySelectorAll(".group-list button").forEach((btn) => {
    btn.onclick = () => {
      state.activeGroupId = btn.dataset.id;
      saveActiveGroup(btn.dataset.id);
      overlay.remove();
      loadDashboard();
    };
  });
  overlay.querySelector("#new-tab-btn").onclick = () => {
    overlay.remove();
    state.activeGroupId = null;
    renderAuth();
  };
  overlay.querySelector("#logout-btn").onclick = async () => {
    if (await customConfirm("Are you sure you want to log out?")) {
      saveToken(null);
      localStorage.removeItem("evenly_memberships");
      saveActiveGroup(null);
      localStorage.removeItem("evenly_active_group");
      state.token = null;
      state.memberships = {};
      state.activeGroupId = null;
      overlay.remove();
      history.replaceState(null, "", "/");
      showLogin();
    }
  };
}

// ---------- Init ----------

async function syncMemberships() {
  try {
    const data = await api("/users/me/groups", { auth: true });
    state.memberships = {};
    for (const row of data) {
      state.memberships[row.group.id] = {
        member_id: row.member.id,
        name: row.member.name,
        group_name: row.group.name,
        invite_code: row.group.invite_code
      };
    }
    localStorage.setItem("evenly_memberships", JSON.stringify(state.memberships));
  } catch (e) {
    if (e.message.includes("validate credentials")) {
      saveToken(null);
      state.token = null;
    }
  }
}

function showLogin() {
  document.getElementById("app").classList.add("hidden");
  document.getElementById("app-layout").classList.add("hidden");
  document.getElementById("auth-app").classList.remove("hidden");
  let isRegister = false;
  
  const form = document.getElementById("auth-form");
  const toggle = document.getElementById("auth-toggle");
  const title = document.getElementById("auth-subtitle");
  const btn = document.getElementById("auth-submit");
  const err = document.getElementById("auth-error");

  toggle.onclick = (e) => {
    e.preventDefault();
    isRegister = !isRegister;
    title.textContent = isRegister ? "Create a new account" : "Sign in to your account";
    btn.textContent = isRegister ? "Register" : "Sign In";
    toggle.textContent = isRegister ? "Already have an account? Sign In" : "Need an account? Register";
    err.style.display = "none";
    document.getElementById("auth-email").value = "";
    document.getElementById("auth-password").value = "";
    document.getElementById("auth-confirm-password").value = "";
    document.getElementById("auth-confirm-password").required = isRegister;
    document.getElementById("auth-confirm-field").style.display = isRegister ? "flex" : "none";
  };
  
  const pwdToggle = document.getElementById("auth-password-toggle");
  const pwdInput = document.getElementById("auth-password");
  const eyeIcon = document.getElementById("eye-icon");
  if (pwdToggle) {
    pwdToggle.onclick = () => {
      if (pwdInput.type === "password") {
        pwdInput.type = "text";
        eyeIcon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
      } else {
        pwdInput.type = "password";
        eyeIcon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
      }
    };
  }

  form.onsubmit = async (e) => {
    e.preventDefault();
    btn.disabled = true;
    err.style.display = "none";
    const email = document.getElementById("auth-email").value;
    const password = document.getElementById("auth-password").value;
    const path = isRegister ? "/auth/register" : "/auth/login";
    
    // Transition to skeleton immediately
    document.getElementById("auth-app").classList.add("hidden");
    document.getElementById("app-layout").classList.remove("hidden");
    const appDiv = document.getElementById("app");
    appDiv.classList.remove("hidden");
    
    // Temporarily replace appDiv with skeleton
    const oldRootHTML = root.innerHTML;
    showSkeleton();

    try {
      const res = await api(path, { method: "POST", body: { email, password }});
      saveToken(res.access_token);
      state.token = res.access_token;
      updateThemeIcons();
init().catch(err => {
  document.getElementById("app-layout").classList.remove("hidden");
  document.getElementById("app").classList.remove("hidden");
  const root = document.getElementById("app");
  root.innerHTML = `
    <div style="padding: 40px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 70vh;">
      <div style="color: var(--debit); margin-bottom: 16px;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h2 style="font-family: var(--font-display); font-size: 24px; margin: 0 0 8px;">App Error</h2>
      <p style="color: var(--on-dark-soft); margin: 0 0 24px;">${err.message}</p>
      <button class="btn-primary" onclick="window.location.reload()">Reload App</button>
    </div>
  `;
}); // Re-run init now that we are logged in
    } catch (ex) {
      // Revert transition
      root.innerHTML = oldRootHTML;
      appDiv.classList.add("hidden");
      document.getElementById("app-layout").classList.add("hidden");
      document.getElementById("auth-app").classList.remove("hidden");
      err.textContent = ex.message;
      err.style.display = "block";
      btn.disabled = false;
    }
  };
}

async function init() {
  if (!state.token) {
    showLogin();
    return;
  }

  document.getElementById("auth-app").classList.add("hidden");
  document.getElementById("app-layout").classList.remove("hidden");
  const appDiv = document.getElementById("app");
  appDiv.classList.remove("hidden");
  
  // Non-blocking sync if we already have some memberships cached
  const hasMemberships = Object.keys(state.memberships).length > 0;
  if (!hasMemberships) {
    showSkeleton();
    await syncMemberships();
    if (!state.token) {
      showLogin();
      return;
    }
  } else {
    syncMemberships().then(() => {
       if (!state.token) {
         showLogin();
         return;
       }
       // Optionally re-render sidebar if memberships changed, but let's keep it simple
       renderSidebar();
    });
  }
  
  document.getElementById("app-layout").classList.remove("hidden");
  document.getElementById("app").classList.remove("hidden");
  document.getElementById("auth-app").classList.add("hidden");

  const params = new URLSearchParams(location.search);
  const code = params.get("code");

  if (code && !Object.values(state.memberships).some((m) => m.invite_code === code)) {
    renderAuth(code); // render the join tab screen
    return;
  }
  if (code) {
    const entry = Object.entries(state.memberships).find(([, m]) => m.invite_code === code);
    if (entry) {
      state.activeGroupId = entry[0];
      saveActiveGroup(entry[0]);
      history.replaceState(null, "", "/");
    }
  }

  const path = location.pathname;
  if (path.startsWith("/group-")) {
    const pathId = path.replace("/group-", "");
    if (state.memberships[pathId]) {
      state.activeGroupId = pathId;
      saveActiveGroup(pathId);
    } else {
      state.activeGroupId = null;
    }
  } else if (path === "/") {
    state.activeGroupId = null;
    localStorage.removeItem("activeGroupId");
  }

  if (path === "/settings") {
    renderSettings();
  } else if (path === "/new") {
    renderAuth();
  } else if (state.activeGroupId && state.memberships[state.activeGroupId]) {
    history.replaceState(null, "", "/group-" + state.activeGroupId);
    loadDashboard();
  } else {
    history.replaceState(null, "", "/");
    renderHub();
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(e => console.error(e));
  });
}

updateThemeIcons();
init().catch(err => {
  document.getElementById("app-layout").classList.remove("hidden");
  document.getElementById("app").classList.remove("hidden");
  const root = document.getElementById("app");
  root.innerHTML = `
    <div style="padding: 40px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 70vh;">
      <div style="color: var(--debit); margin-bottom: 16px;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h2 style="font-family: var(--font-display); font-size: 24px; margin: 0 0 8px;">App Error</h2>
      <p style="color: var(--on-dark-soft); margin: 0 0 24px;">${err.message}</p>
      <button class="btn-primary" onclick="window.location.reload()">Reload App</button>
    </div>
  `;
});


window.addEventListener('popstate', (e) => {
  if (!state.token) return;
  const path = location.pathname;
  if (path.startsWith("/group-")) {
    const id = path.replace("/group-", "");
    if (state.memberships[id]) {
      state.activeGroupId = id;
      saveActiveGroup(id);
      loadDashboard();
    }
  } else if (path === "/settings") {
    renderSettings();
  } else if (path === "/new") {
    renderAuth();
  } else {
    state.activeGroupId = null;
    localStorage.removeItem("activeGroupId");
    renderHub();
  }
});

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  document.getElementById('meta-theme-color').setAttribute('content', newTheme === 'dark' ? '#1c2622' : '#FAF9F6');
  updateThemeIcons();
}

function updateThemeIcons() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const icon = isDark ? ICONS.sun : ICONS.moon;
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => btn.innerHTML = icon);
}

document.addEventListener('click', (e) => {
  if (e.target.closest('.theme-toggle-btn')) {
    toggleTheme();
  }
});

function renderSettleModal(debt, groupId) {
  const overlay = document.createElement("div");
  overlay.className = "sheet-overlay";
  overlay.innerHTML = `
    <div class="sheet" onclick="event.stopPropagation()">
      <div class="sheet-handle"></div>
      <h3 style="margin-top:0; margin-bottom: 8px; font-family: var(--font-display); font-size: 20px;">Settle Up</h3>
      <p style="margin-top:0; margin-bottom: 24px; color: var(--ink-soft); font-size: 15px;">
        ${debt.from_name} paying ${debt.to_name}
      </p>
      <form id="settle-form">
        <div class="field">
          <label>Amount paid</label>
          <input type="number" id="s-amount" step="0.01" min="0.01" value="${debt.amount}" required style="font-size: 24px; font-family: var(--font-display); font-weight: 600;" />
        </div>
        <button type="submit" class="btn-primary" style="margin-top: 10px; margin-bottom: 24px; width: 100%;">Record Payment</button>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);
  
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
  
  overlay.querySelector("#settle-form").onsubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(document.getElementById("s-amount").value);
    if (isNaN(amt) || amt <= 0) return;
    try {
       await api(`/groups/${groupId}/settlements`, {
          method: "POST", auth: true,
          body: { from_member: debt.from_member, to_member: debt.to_member, amount: amt }
       });
       overlay.remove();
       clearGroupCache(groupId);
       loadDashboard();
    } catch(err) {
       toast(err.message);
    }
  };
}
