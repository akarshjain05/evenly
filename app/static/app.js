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

const state = {
  token: loadToken(),
  memberships: {}, // Populated from server
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
  const hasCode = !!prefillCode;
  root.innerHTML = `
    <div class="auth-screen">
      <button class="icon-btn theme-toggle-btn" style="position: absolute; top: 16px; right: 20px; z-index: 10;" aria-label="Toggle Theme"></button>
      <div class="auth-mark">
        <svg viewBox="0 0 40 40" fill="none" stroke="#C19A5B" stroke-width="3" stroke-linecap="round">
          <line x1="10" y1="8" x2="10" y2="32"/><line x1="16" y1="8" x2="16" y2="32"/>
          <line x1="22" y1="8" x2="22" y2="32"/><line x1="28" y1="8" x2="28" y2="32"/>
          <line x1="7" y1="30" x2="31" y2="10"/>
        </svg>
      </div>
      <h1 class="auth-title">Evenly</h1>
      <p class="auth-sub">A running tab for your people.</p>
      <div class="auth-toggle">
        <button id="tab-join" class="${hasCode ? "active" : ""}">Join with a code</button>
        <button id="tab-create" class="${hasCode ? "" : "active"}">Start a tab</button>
      </div>
      <div style="text-align: center; margin-top: -10px; margin-bottom: 10px;">
        <a href="#" id="auth-logout-btn" style="color: var(--on-dark-soft); text-decoration: none; font-size: 14px;">
          ${Object.keys(state.memberships).length > 0 ? "← Back to your tabs" : "Not you? Log Out"}
        </a>
      </div>
      <div id="auth-card"></div>
    </div>
  `;
  document.getElementById("tab-join").onclick = () => renderJoinCard();
  document.getElementById("tab-create").onclick = () => renderCreateCard();
  document.getElementById("auth-logout-btn").onclick = (e) => { e.preventDefault(); saveToken(null); state.token = null; location.reload(); };
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
  history.replaceState(null, "", "/");
  loadDashboard();
}

// ---------- Dashboard ----------
async function loadDashboard() {
  showSkeleton();
  try {
    const [group, activity] = await Promise.all([
      api(`/groups/${state.activeGroupId}`, { auth: true }),
      api(`/groups/${state.activeGroupId}/activity`, { auth: true }),
    ]);
    state.group = group;
    state.activity = activity;
    renderDashboard();
  } catch (ex) {
    // Membership likely stale/invalid - drop it and go back to auth.
    delete state.memberships[state.activeGroupId];
    state.activeGroupId = null;
    renderAuth();
    toast(ex.message);
  }
}

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
    localStorage.removeItem("token");
    localStorage.removeItem("memberships");
    localStorage.removeItem("activeGroupId");
    state.token = null;
    state.memberships = {};
    state.activeGroupId = null;
    showLogin();
  };

  document.querySelectorAll(".group-hub-card").forEach(btn => {
    btn.onclick = () => {
      state.activeGroupId = btn.dataset.id;
      saveActiveGroup(state.activeGroupId);
      history.replaceState(null, "", "/");
      loadDashboard();
    };
  });

  document.getElementById("hub-new-btn").onclick = () => {
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
    <div class="sidebar-header">
      <div class="auth-mark" style="color: var(--brass); width: 28px; height: 28px;">
        <svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
          <line x1="10" y1="8" x2="10" y2="32"/><line x1="16" y1="8" x2="16" y2="32"/>
          <line x1="22" y1="8" x2="22" y2="32"/><line x1="28" y1="8" x2="28" y2="32"/>
          <line x1="7" y1="30" x2="31" y2="10"/>
        </svg>
      </div>
      <h1 class="sidebar-title">evenly</h1>
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
      <div class="sidebar-profile">
        <div class="profile-info">
          <div class="profile-avatar">${initials(userName)}</div>
          <div class="profile-text">
            <span class="profile-name">${escapeHtml(userName)}</span>
            <span class="profile-sub">Personal settings</span>
          </div>
        </div>
        <button class="profile-settings" id="sidebar-logout" aria-label="Settings / Log Out">${ICONS.settings}</button>
      </div>
    </div>
  `;

  document.querySelectorAll(".sidebar-link[data-id]").forEach(btn => {
    btn.onclick = () => {
      closeSidebar();
      state.activeGroupId = btn.dataset.id;
      saveActiveGroup(state.activeGroupId);
      history.replaceState(null, "", "/");
      loadDashboard();
    };
  });
  
  document.getElementById("sidebar-new-btn").onclick = () => {
    closeSidebar();
    renderAuth();
  };
  
  document.getElementById("sidebar-logout").onclick = () => {
    if (confirm("Log out?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("memberships");
      localStorage.removeItem("activeGroupId");
      state.token = null;
      state.memberships = {};
      state.activeGroupId = null;
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
  const myBalance = (g.members.find((m) => m.id === me.member_id) || {}).balance || 0;
  const heroClass = myBalance > 0.01 ? "credit" : myBalance < -0.01 ? "debit" : "even";
  const heroLabel = myBalance > 0.01 ? "you're owed, overall" : myBalance < -0.01 ? "you owe, overall" : "you're all settled up";
  const multiGroup = Object.keys(state.memberships).length > 1;

  root.innerHTML = `
    <div class="topbar" style="gap: 12px;">
      <button class="icon-btn menu-btn" aria-label="Menu" style="flex-shrink: 0; background: transparent; padding: 0; width: 28px; justify-content: flex-start;" onclick="openSidebar()">${ICONS.menu}</button>
      <button class="icon-btn" id="back-to-hub-btn" aria-label="Back to Hub" style="flex-shrink: 0; background: transparent; padding: 0; width: 28px; justify-content: flex-start;">${ICONS.arrowLeft}</button>
      <button class="topbar-group" id="group-switch" style="flex: 1; padding: 0; justify-content: flex-start; text-align: left;">${escapeHtml(g.name)} ${ICONS.chevron}</button>
      <div style="display: flex; gap: 8px; flex-shrink: 0;">
        <button class="icon-btn theme-toggle-btn" aria-label="Toggle Theme"></button>
        <button class="icon-btn" id="invite-btn" aria-label="Invite people">${ICONS.share}</button>
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
    .reduce((sum, a) => sum + a.amount, 0);

  const myTotalShare = state.activity
    .filter(a => a.type === "expense")
    .reduce((sum, a) => {
      const mySplit = a.splits.find(s => s.member_id === me.member_id);
      return sum + (mySplit ? mySplit.share_amount : 0);
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
          <button class="settle-btn" data-from="${d.from_member}" data-to="${d.to_member}" data-amount="${d.amount}">Mark settled</button>
        </div>`
      )
      .join("");
    settleList.querySelectorAll(".settle-btn").forEach((btn) => {
      btn.onclick = () => markSettled(btn.dataset.from, btn.dataset.to, parseFloat(btn.dataset.amount));
    });
  }

  const ledger = document.getElementById("ledger");
  if (state.activity.length === 0) {
    ledger.innerHTML = `<p class="empty-note">Nothing logged yet — add the first expense.</p>`;
  } else {
    ledger.innerHTML = state.activity
      .map((item) => {
        if (item.type === "settlement") {
          return `
            <div class="ledger-row settlement">
              <div class="ledger-main">
                <p class="ledger-desc">${item.from_member === me.member_id ? "You" : escapeHtml(item.from_name)} paid
                  ${item.to_member === me.member_id ? "you" : escapeHtml(item.to_name)}</p>
                <p class="ledger-meta">${timeAgo(item.created_at)} · settled</p>
              </div>
              <div class="ledger-amt">${fmt(item.amount)}</div>
            </div>`;
        }
        const names = item.splits.map((s) => (s.member_id === me.member_id ? "you" : s.name)).join(", ");
        return `
          <div class="ledger-row">
            <div class="ledger-main">
              <p class="ledger-desc">${escapeHtml(item.description)}</p>
              <p class="ledger-meta">${item.paid_by_name} paid · split with ${names} · ${timeAgo(item.created_at)}</p>
            </div>
            <div class="ledger-amt">${fmt(item.amount)}<button class="ledger-del" data-id="${item.id}" aria-label="Delete">${ICONS.close}</button></div>
          </div>`;
      })
      .join("");
    ledger.querySelectorAll(".ledger-del").forEach((btn) => {
      btn.onclick = async () => {
        if (!confirm("Remove this expense from the tab?")) return;
        try {
          await api(`/groups/${g.id}/expenses/${btn.dataset.id}`, { method: "DELETE", auth: true });
          loadDashboard();
        } catch (ex) {
          toast(ex.message);
        }
      };
    });
  }

  document.getElementById("add-fab").onclick = openAddExpenseSheet;
  document.getElementById("invite-btn").onclick = openInviteSheet;
  document.getElementById("group-switch").onclick = openGroupSwitcher;
  document.getElementById("back-to-hub-btn").onclick = () => {
    state.activeGroupId = null;
    localStorage.removeItem("activeGroupId");
    history.replaceState(null, "", "/");
    renderHub();
  };
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
function openAddExpenseSheet() {
  const g = state.group;
  const me = state.memberships[g.id];
  const overlay = document.createElement("div");
  overlay.className = "sheet-overlay";
  overlay.innerHTML = `
    <div class="sheet">
      <div class="sheet-handle"></div>
      <h2 class="sheet-title">Add an expense</h2>
      <form id="expense-form" style="display:flex;flex-direction:column;gap:16px;">
        <div class="field">
          <label for="e-desc">What was it for</label>
          <input id="e-desc" placeholder="Groceries, cab, movie tickets…" required maxlength="120" />
        </div>
        <div class="field">
          <label for="e-amount">Amount</label>
          <input id="e-amount" type="number" step="0.01" min="0.01" placeholder="0.00" required />
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
        <button class="btn-primary" type="submit">Add to the tab</button>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };

  const paidByChips = overlay.querySelector("#paid-by-chips");
  paidByChips.innerHTML = g.members
    .map((m) => `<button type="button" class="chip${m.id === me.member_id ? " selected" : ""}" data-id="${m.id}">${m.id === me.member_id ? "You" : escapeHtml(m.name)}</button>`)
    .join("");
  let paidBy = me.member_id;
  paidByChips.querySelectorAll(".chip").forEach((chip) => {
    chip.onclick = () => {
      paidByChips.querySelectorAll(".chip").forEach((c) => c.classList.remove("selected"));
      chip.classList.add("selected");
      paidBy = chip.dataset.id;
    };
  });

  let splitType = "equal";
  const splitTypeChips = overlay.querySelector("#split-type-chips");
  const splitDetail = overlay.querySelector("#split-detail");
  const amountInput = overlay.querySelector("#e-amount");

  let participantIds = new Set(g.members.map((m) => m.id));
  const exactValues = {};
  const pctValues = {};

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
    btn.disabled = true;
    try {
      await api(`/groups/${g.id}/expenses`, { method: "POST", auth: true, body: payload });
      overlay.remove();
      loadDashboard();
    } catch (ex) {
      err.textContent = ex.message;
      err.classList.remove("hidden");
      btn.disabled = false;
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
    if (e.target === overlay) overlay.remove();
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
    if (e.target === overlay) overlay.remove();
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
init(); // Re-run init now that we are logged in
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
  showSkeleton();

  await syncMemberships();
  if (!state.token) {
    showLogin();
    return;
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

  if (state.activeGroupId && state.memberships[state.activeGroupId]) {
    loadDashboard();
  } else {
    renderHub();
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    //navigator.serviceWorker.register("/service-worker.js").catch(() => {});
  });
}

updateThemeIcons();
init();

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
