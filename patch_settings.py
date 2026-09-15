import re

with open("app/static/app.js", "r") as f:
    code = f.read()

# 1. Update popstate listener
old_popstate = """  if (location.hash.startsWith("#group-")) {
    const id = location.hash.replace("#group-", "");
    if (state.memberships[id]) {
      state.activeGroupId = id;
      saveActiveGroup(id);
      loadDashboard();
    }
  } else {
    state.activeGroupId = null;
    localStorage.removeItem("activeGroupId");
    renderHub();
  }"""
new_popstate = """  if (location.hash.startsWith("#group-")) {
    const id = location.hash.replace("#group-", "");
    if (state.memberships[id]) {
      state.activeGroupId = id;
      saveActiveGroup(id);
      loadDashboard();
    }
  } else if (location.hash === "#settings") {
    renderSettings();
  } else {
    state.activeGroupId = null;
    localStorage.removeItem("activeGroupId");
    renderHub();
  }"""
code = code.replace(old_popstate, new_popstate)


# 2. Update init() route handling for #settings
old_init_route = """  } else if (location.hash === "#hub") {
    state.activeGroupId = null;
  }

  if (state.activeGroupId && state.memberships[state.activeGroupId]) {
    history.replaceState(null, "", "#group-" + state.activeGroupId);
    loadDashboard();
  } else {
    history.replaceState(null, "", "#hub");
    renderHub();
  }"""
new_init_route = """  } else if (location.hash === "#hub") {
    state.activeGroupId = null;
  }

  if (location.hash === "#settings") {
    renderSettings();
  } else if (state.activeGroupId && state.memberships[state.activeGroupId]) {
    history.replaceState(null, "", "#group-" + state.activeGroupId);
    loadDashboard();
  } else {
    history.replaceState(null, "", "#hub");
    renderHub();
  }"""
code = code.replace(old_init_route, new_init_route)


# 3. Add renderSettings function
settings_code = """
function renderSettings() {
  renderSidebar(); // Ensure sidebar is updated
  const appDiv = document.getElementById("app");
  
  appDiv.innerHTML = `
    <div class="topbar" style="gap: 12px; padding: 16px 20px; display: flex; align-items: center;">
      <button class="icon-btn menu-btn" aria-label="Menu" style="flex-shrink: 0; background: transparent; padding: 0; width: 28px; justify-content: flex-start;" onclick="openSidebar()">${ICONS.menu}</button>
      <button class="icon-btn" id="settings-back-btn" aria-label="Back" style="flex-shrink: 0; background: transparent; padding: 0; width: 28px; justify-content: flex-start;">${ICONS.arrowLeft}</button>
      <h2 style="font-family: var(--font-display); font-size: 24px; margin: 0; color: var(--ink); flex: 1;">Settings</h2>
    </div>
    <div class="section" style="padding: 20px;">
      <div style="background: var(--bg-soft); border: 1px solid var(--line-dark); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
         <h3 style="margin: 0 0 16px; font-size: 16px; color: var(--ink);">Preferences</h3>
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
  
  document.getElementById("settings-back-btn").onclick = () => {
     if (history.length > 2) {
       history.back();
     } else {
       history.pushState(null, "", "#hub");
       renderHub();
     }
  };
  
  document.getElementById("settings-logout-btn").onclick = () => {
    if (confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("memberships");
      localStorage.removeItem("activeGroupId");
      state.token = null;
      state.memberships = {};
      state.activeGroupId = null;
      history.replaceState(null, "", "/");
      showLogin();
    }
  };
}
"""
code = code.replace("function openSidebar() {", settings_code + "\nfunction openSidebar() {")


# 4. Update renderSidebar to make the whole profile box a button
old_sidebar_footer = """    <div class="sidebar-footer">
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
    </div>"""

new_sidebar_footer = """    <div class="sidebar-footer">
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
    </div>"""
code = code.replace(old_sidebar_footer, new_sidebar_footer)


# 5. Update renderSidebar event listener
old_sidebar_logout = """  document.getElementById("sidebar-logout").onclick = () => {
    if (confirm("Log out?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("memberships");
      localStorage.removeItem("activeGroupId");
      state.token = null;
      state.memberships = {};
      state.activeGroupId = null;
      showLogin();
    }
  };"""

new_sidebar_settings = """  document.getElementById("sidebar-settings-btn").onclick = () => {
    closeSidebar();
    history.pushState(null, "", "#settings");
    renderSettings();
  };"""
code = code.replace(old_sidebar_logout, new_sidebar_settings)

with open("app/static/app.js", "w") as f:
    f.write(code)
