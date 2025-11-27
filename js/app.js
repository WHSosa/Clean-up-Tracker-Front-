function getEvents() {
    const events = localStorage.getItem('cleanupEvents');
    return events ? JSON.parse(events) : [];
}

// --- simple user storage for sign-up/login ---
function getUsers(){
    try{ const u = localStorage.getItem('cem_users'); return u ? JSON.parse(u) : []; }catch(e){return[]} }

function saveUsers(users){
    try{ localStorage.setItem('cem_users', JSON.stringify(users)); }catch(e){}
}

function registerUser(userOrUsername, password){
    // Accept either (username, password) or a full user object
    let user = null;
    if (typeof userOrUsername === 'string'){
        user = { username: userOrUsername, password: password };
    } else {
        user = userOrUsername || {};
    }
    if (!user.username || user.username.length < 3) return { ok:false, msg:'Username must be at least 3 characters' };
    if (!user.password || user.password.length < 6) return { ok:false, msg:'Password must be at least 6 characters' };
    // require profile fields: firstName, lastName, email
    if (!user.firstName || !user.lastName || !user.email) return { ok:false, msg:'Please provide first name, last name and email' };
    const users = getUsers();
    if (users.find(u=>u.username && u.username.toLowerCase()===user.username.toLowerCase())) return { ok:false, msg:'Username already exists' };
    users.push(user);
    saveUsers(users);
    return { ok:true };
}

function getUserByUsername(username){
    if (!username) return null;
    return getUsers().find(u=>u.username && u.username.toLowerCase() === username.toLowerCase()) || null;
}

function updateUser(username, updates){
    const users = getUsers();
    const idx = users.findIndex(u=>u.username && u.username.toLowerCase() === (username||'').toLowerCase());
    if (idx === -1) return false;
    users[idx] = Object.assign({}, users[idx], updates);
    saveUsers(users);
    return true;
}

function saveEvents(events) {
    localStorage.setItem('cleanupEvents', JSON.stringify(events));
}

function addEvent(event) {
    const events = getEvents();
    event.id = Date.now();
    events.push(event);
    saveEvents(events);
    // log activity
    try{ logActivity(`Created event: ${event.title || 'Untitled'}`); }catch(e){}
    return event.id;
}

function deleteEvent(id) {
    const events = getEvents().filter(ev => ev.id !== id);
    saveEvents(events);
    try{ logActivity(`Deleted event id ${id}`); }catch(e){}
}

function updateEvent(event) {
    if (!event || !event.id) return false;
    const events = getEvents();
    const idx = events.findIndex(ev => ev.id === event.id);
    if (idx === -1) {
        events.push(event);
    } else {
        events[idx] = Object.assign({}, events[idx], event);
    }
    saveEvents(events);
    try{ logActivity(`Updated event: ${event.title || 'Untitled'}`); }catch(e){}
    return true;
}

function getActivity(){
    try{ const a = localStorage.getItem('cem_activity'); return a?JSON.parse(a):[];}catch(e){return[]}
}

function saveActivity(list){ try{ localStorage.setItem('cem_activity', JSON.stringify(list)); }catch(e){} }

function logActivity(text){
    try{
        const list = getActivity();
        list.unshift({ text: text, ts: Date.now() });
        // keep at most 200 entries
        if (list.length>200) list.length=200;
        saveActivity(list);
    }catch(e){console.warn('logActivity failed', e);}    
}

function getEventStats() {
    const events = getEvents();
    const totalEvents = events.length;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    }).length;
    const totalWaste = events.reduce((sum, event) => sum + (event.wasteRecords || []).reduce((s,r)=>s+(r.weight||0),0), 0);
    const totalVolunteers = events.reduce((sum, event) => sum + (event.volunteers||0), 0);
    return { totalEvents, monthEvents, totalWaste: totalWaste.toFixed(1), totalVolunteers };
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
}

// Simple sample initializer used if no events exist
function ensureSampleEvent() {
    if (getEvents().length === 0) {
        saveEvents([{ id:1, title:'Coastal Cleanup - Yabra', date:'2025-10-12', location:'Belize City Waterfront', organizer:'Scouts Association of Belize', status:'completed', volunteers:32, wasteRecords:[{category:'plastic',quantity:45,weight:12.3},{category:'glass',quantity:10,weight:5.0}]}]);
    }
}

// Expose as module-like object for convenience
window.App = {
    getEvents, saveEvents, addEvent, updateEvent, deleteEvent, getEventStats, formatDate, ensureSampleEvent,
    getUsers, saveUsers, registerUser, getUserByUsername, updateUser, getActivity, logActivity
};

// --- Simple login handling (temporary admin/password credential enforcement) ---
(function(){
    const AUTH_USER = 'admin';
    const AUTH_PASS = 'password';
    const SESSION_KEY = 'cem_user';

    function isLoggedIn(){
        try { return !!sessionStorage.getItem(SESSION_KEY); } catch(e){ return false; }
    }

    function loginUser(username){
                try { sessionStorage.setItem(SESSION_KEY, username); } catch(e){}
                updateAuthUI();
                // after login, send user back to the page they wanted (if stored)
                try{
                    const redirect = sessionStorage.getItem('cem_redirect');
                    if (redirect){
                        sessionStorage.removeItem('cem_redirect');
                        // navigate to the saved page (if simple filename)
                        if (!redirect.match(/^https?:/)){
                            // keep same folder structure if redirect is a local filename
                            window.location.href = redirect;
                            return;
                        }
                    }
                }catch(e){}
    }

    function logoutUser(){
        try { sessionStorage.removeItem(SESSION_KEY); } catch(e){}
        updateAuthUI();
        try{ window.location.href = 'dashboard.html'; }catch(e){}
    }

    function updateAuthUI(){
        const loginPage = document.getElementById('loginPage');
        const appContainer = document.getElementById('appContainer');
        const userDisplay = document.getElementById('userDisplay');
        const userProfileLink = document.getElementById('userProfileLink');
        const username = sessionStorage.getItem(SESSION_KEY) || '';
        if (isLoggedIn()){
            if (loginPage) loginPage.style.display = 'none';
            if (appContainer) appContainer.style.display = 'block';
            if (userProfileLink) userProfileLink.textContent = 'Welcome, ' + username;
            if (userProfileLink) userProfileLink.href = 'profile.html';
            if (userProfileLink) userProfileLink.style.cursor = 'pointer';
        } else {
            if (loginPage) loginPage.style.display = 'flex';
            if (appContainer) appContainer.style.display = 'none';
            if (userProfileLink) userProfileLink.textContent = 'Welcome, User';
        }
    }

    function attachLoginHandlers(){
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userInput = document.getElementById('username');
        const passInput = document.getElementById('password');
        const hintEl = document.getElementById('loginHint');

        if (hintEl) hintEl.innerHTML = 'Hint: username <strong>admin</strong>, password <strong>password</strong>';

        if (loginBtn){
            loginBtn.addEventListener('click', function(){
                const u = (userInput && userInput.value) ? userInput.value.trim() : '';
                const p = (passInput && passInput.value) ? passInput.value : '';
                // support the default admin account
                if (u === AUTH_USER && p === AUTH_PASS){
                    loginUser(u);
                    return;
                }
                // check registered users
                const users = getUsers();
                const found = users.find(x=>x.username.toLowerCase() === (u||'').toLowerCase() && x.password === p);
                if (found){ loginUser(found.username); return; }
                // show a small inline error if available
                let err = document.getElementById('loginError');
                if (!err && loginBtn) {
                    err = document.createElement('div'); err.id = 'loginError'; err.className = 'login-error';
                    loginBtn.parentNode.insertBefore(err, loginBtn.nextSibling);
                }
                if (err) err.textContent = 'Invalid credentials — check username/password or sign up';
            });
        }

        // Signup flow handlers (UI toggles are in HTML)
        const showSignup = document.getElementById('showSignup');
        const backToLogin = document.getElementById('backToLogin');
        const signupBtn = document.getElementById('signupBtn');
        const loginView = document.getElementById('loginView');
        const signupView = document.getElementById('signupView');
        if (showSignup) showSignup.addEventListener('click', function(e){ e.preventDefault(); if (loginView) loginView.style.display='none'; if (signupView) signupView.style.display='block'; });
        if (backToLogin) backToLogin.addEventListener('click', function(e){ e.preventDefault(); if (signupView) signupView.style.display='none'; if (loginView) loginView.style.display='block'; });
        if (signupBtn){
            signupBtn.addEventListener('click', function(){
                const nu = (document.getElementById('newUsername')||{}).value || '';
                const np = (document.getElementById('newPassword')||{}).value || '';
                const npc = (document.getElementById('newPasswordConfirm')||{}).value || '';
                const first = (document.getElementById('newFirstName')||{}).value || '';
                const last = (document.getElementById('newLastName')||{}).value || '';
                const gender = (document.getElementById('newGender')||{}).value || '';
                const contact = (document.getElementById('newContact')||{}).value || '';
                const email = (document.getElementById('newEmail')||{}).value || '';
                const desc = (document.getElementById('newDesc')||{}).value || '';
                let err = document.getElementById('signupError');
                if (!err && signupBtn){ err = document.createElement('div'); err.id='signupError'; err.className='login-error'; signupBtn.parentNode.insertBefore(err, signupBtn.nextSibling); }
                if (np !== npc){ if (err) err.textContent='Passwords do not match'; return; }
                const userObj = { username: nu.trim(), password: np, firstName: first.trim(), lastName: last.trim(), gender, contact, email: email.trim(), description: desc.trim() };
                const res = registerUser(userObj);
                if (!res.ok){ if (err) err.textContent = res.msg || 'Signup failed'; return; }
                // auto-login after registration
                loginUser(userObj.username);
            });
        }

        if (logoutBtn){
            logoutBtn.addEventListener('click', function(){ logoutUser(); });
        }
        // profile link navigation
        const userProfileLink = document.getElementById('userProfileLink');
        if (userProfileLink){
            userProfileLink.addEventListener('click', function(e){ e.preventDefault(); const un = sessionStorage.getItem(SESSION_KEY); if (!un) { alert('Please login first'); return; } window.location.href = 'profile.html'; });
        }
    }

    // Sidebar toggle: inject a small toggle button into the navbar and support per-page collapse state
    function installSidebarToggle(){
        try{
            const navbar = document.querySelector('.navbar');
            if (!navbar) return;
            // avoid duplicate button
            if (document.getElementById('sidebarToggle')) return;
            const btn = document.createElement('button');
            btn.id = 'sidebarToggle';
            btn.className = 'sidebar-toggle-btn';
            btn.title = 'Toggle sidebar';
            btn.textContent = '☰';
            // insert at start of navbar
            navbar.insertBefore(btn, navbar.firstChild);

            function applyState(){
                const path = (window.location.pathname||'').split('/').pop() || 'dashboard.html';
                const key = 'sidebar_collapsed_' + path;
                const collapsed = sessionStorage.getItem(key) === '1';
                document.body.classList.toggle('sidebar-collapsed', !!collapsed);
            }

            btn.addEventListener('click', ()=>{
                const path = (window.location.pathname||'').split('/').pop() || 'dashboard.html';
                const key = 'sidebar_collapsed_' + path;
                const now = sessionStorage.getItem(key) === '1';
                if (now) sessionStorage.removeItem(key); else sessionStorage.setItem(key,'1');
                applyState();
                // when collapsed/expanded, invalidate map later if present
                setTimeout(()=>{ try{ window.map && window.map.invalidateSize(); }catch(e){} }, 220);
            });

            applyState();
            // call invalidateSize when the sidebar transition ends so map redraws perfectly
            try{
                const sidebarEl = document.querySelector('.sidebar');
                if (sidebarEl){
                    sidebarEl.addEventListener('transitionend', (ev)=>{
                        if (ev.propertyName === 'width' || ev.propertyName === 'opacity'){
                            try{ window.map && window.map.invalidateSize(); }catch(e){}
                        }
                    });
                }
            }catch(e){}
        }catch(e){ console.warn('sidebar toggle install failed', e); }
    }

    function installRightSidebarToggle(){
        try{
            const navbar = document.querySelector('.navbar');
            if (!navbar) return;
            if (document.getElementById('rightSidebarToggle')) return;
            const btn = document.createElement('button');
            btn.id = 'rightSidebarToggle';
            btn.className = 'sidebar-toggle-btn';
            btn.title = 'Toggle right sidebar';
            btn.textContent = '🔔';
            // place before the user area (append to navbar)
            navbar.appendChild(btn);

            function applyState(){
                const path = (window.location.pathname||'').split('/').pop() || 'dashboard.html';
                const key = 'right_sidebar_collapsed_' + path;
                const collapsed = sessionStorage.getItem(key) === '1';
                document.body.classList.toggle('right-sidebar-collapsed', !!collapsed);
            }

            btn.addEventListener('click', ()=>{
                const path = (window.location.pathname||'').split('/').pop() || 'dashboard.html';
                const key = 'right_sidebar_collapsed_' + path;
                const now = sessionStorage.getItem(key) === '1';
                if (now) sessionStorage.removeItem(key); else sessionStorage.setItem(key,'1');
                applyState();
                setTimeout(()=>{ try{ window.map && window.map.invalidateSize(); }catch(e){} }, 260);
            });

            applyState();
            // invalidate map on transition end
            const rs = document.querySelector('.right-sidebar');
            if (rs){
                rs.addEventListener('transitionend', (ev)=>{
                    if (ev.propertyName === 'width' || ev.propertyName === 'opacity'){
                        try{ window.map && window.map.invalidateSize(); }catch(e){}
                    }
                });
            }
        }catch(e){ console.warn('right sidebar toggle install failed', e); }
    }

        document.addEventListener('DOMContentLoaded', function(){
                attachLoginHandlers();
                updateAuthUI();

                // If this is not the login page and the user is not logged in, remember redirect and go to login
                try{
                    const path = window.location.pathname || window.location.href;
                    const current = path.split('/').pop();
                    if (current && current.toLowerCase() !== 'dashboard.html' && !isLoggedIn()){
                                sessionStorage.setItem('cem_redirect', current);
                                // navigate to the dashboard where the single login form lives
                                window.location.href = 'dashboard.html';
                    }
                }catch(e){}
                // Install the sidebar toggle UI
                installSidebarToggle();
                installRightSidebarToggle();
        });

    // expose auth helpers if needed
    window.Auth = { isLoggedIn, loginUser, logoutUser };
})();
