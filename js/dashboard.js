document.addEventListener('DOMContentLoaded', function(){
    App.ensureSampleEvent();
    const totalEventsEl = document.getElementById('totalEvents');
    const monthEventsEl = document.getElementById('monthEvents');
    const totalWasteEl = document.getElementById('totalWaste');
    const totalVolunteersEl = document.getElementById('totalVolunteers');

    function updateDashboardUI(){
        const stats = App.getEventStats();
        // animated updates for the dashboard cards
        function setAnimated(el, value){
            if (!el) return;
            const str = String(value);
            const prev = el.getAttribute('data-prev');
            if (prev !== str){
                el.textContent = str;
                el.setAttribute('data-prev', str);
                el.classList.remove('pop');
                void el.offsetWidth;
                el.classList.add('pop');
                setTimeout(()=> el.classList.remove('pop'), 700);
            }
        }
        setAnimated(totalEventsEl, stats.totalEvents);
        setAnimated(monthEventsEl, stats.monthEvents);
        setAnimated(totalWasteEl, (stats.totalWaste||0) + ' kg');
        setAnimated(totalVolunteersEl, stats.totalVolunteers);

        // Recent Activity News: use activity log if available, otherwise show no news placeholder
        const recentNewsEl = document.getElementById('recentNews');
        const activities = (window.App && window.App.getActivity) ? window.App.getActivity() : [];
        if (recentNewsEl){
            if (!activities || activities.length === 0){
                recentNewsEl.innerHTML = 'No recent activity news';
                recentNewsEl.style.display = 'flex';
                recentNewsEl.style.alignItems = 'center';
                recentNewsEl.style.justifyContent = 'center';
                recentNewsEl.style.color = '#666';
            } else {
                recentNewsEl.style.display = 'block';
                recentNewsEl.innerHTML = '';
                activities.slice(0,5).forEach(a=>{
                    const node = document.createElement('div');
                    node.style.padding = '8px 10px';
                    node.style.borderBottom = '1px solid #eee';
                    const d = new Date(a.ts);
                    node.innerHTML = `<div style="font-size:12px;color:#666">${d.toLocaleString()}</div><div>${a.text}</div>`;
                    recentNewsEl.appendChild(node);
                });
            }
        }
        // Upcoming events (next 5)
        const upcomingEl = document.getElementById('upcomingEvents');
        if (upcomingEl){
            const now = new Date();
            const upcoming = App.getEvents().filter(e=>{ const d=new Date(e.date); return d>=now && (e.status||'').toLowerCase()!=='canceled'; }).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,5);
            upcomingEl.innerHTML='';
            if (!upcoming.length) upcomingEl.innerHTML = '<div>No upcoming events</div>';
            upcoming.forEach(ev=>{
                const item = document.createElement('div'); item.className='upcoming-item';
                item.style.cssText='padding:8px 10px;border-radius:6px;background:#fff;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;';
                item.innerHTML = `<div><div style="font-weight:600">${ev.title}</div><div style="font-size:12px;color:#666">${App.formatDate(ev.date)} — ${ev.location}</div></div><div style="display:flex;gap:6px"><button class="btn btn-secondary" data-id="${ev.id}">View</button><button class="btn btn-primary" data-id="${ev.id}">Map</button></div>`;
                upcomingEl.appendChild(item);
            });
            // attach handlers
            upcomingEl.querySelectorAll('.btn-secondary').forEach(b=>b.addEventListener('click', e=>{ const id=parseInt(e.currentTarget.getAttribute('data-id')); alert('Open details for event id '+id);}));
            upcomingEl.querySelectorAll('.btn-primary').forEach(b=>b.addEventListener('click', e=>{ const id=parseInt(e.currentTarget.getAttribute('data-id')); sessionStorage.setItem('cem_focus_event', id); location.href='map.html'; }));
        }

        // Notifications and activity feed
        const notifEl = document.getElementById('notifications');
        const feedEl = document.getElementById('activityFeed');
        if (notifEl){
            notifEl.innerHTML = '';
            const soon = App.getEvents().filter(e=>{ const d=new Date(e.date); const diff=(d - new Date())/(1000*60*60*24); return diff>=0 && diff<=3; });
            soon.forEach(e=>{ const n = document.createElement('div'); n.textContent = `Upcoming soon: ${e.title} on ${App.formatDate(e.date)}`; n.style.marginBottom='6px'; notifEl.appendChild(n); });
            // low volunteers
            App.getEvents().forEach(e=>{ if ((e.volunteers||0) < 5){ const n = document.createElement('div'); n.textContent = `Low volunteers: ${e.title} has ${e.volunteers||0}`; n.style.marginBottom='6px'; notifEl.appendChild(n); } });
        }
        if (feedEl){
            const acts = (window.App && window.App.getActivity) ? window.App.getActivity() : [];
            feedEl.innerHTML = '';
            acts.slice(0,10).forEach(a=>{ const d = new Date(a.ts); const it = document.createElement('div'); it.style.marginBottom='8px'; it.innerHTML = `<div style="font-size:12px;color:#666">${d.toLocaleString()}</div><div>${a.text}</div>`; feedEl.appendChild(it); });
        }
    }

    updateDashboardUI();
    // keep dashboard live and responsive to changes
    window.addEventListener('storage', updateDashboardUI);
    setInterval(updateDashboardUI, 3000);
    // also react when body class changes (sidebar toggle)
    const observer = new MutationObserver(function(m){ updateDashboardUI(); });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
});
