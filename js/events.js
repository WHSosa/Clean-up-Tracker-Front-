document.addEventListener('DOMContentLoaded', function(){
    App.ensureSampleEvent();
    const tbody = document.querySelector('#eventsTable tbody');
    function render(){
        if (!tbody) return;
        tbody.innerHTML = '';
        App.getEvents().forEach(ev => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${ev.title}</td>
                <td>${App.formatDate(ev.date)}</td>
                <td>${ev.location}</td>
                <td>${ev.organizer}</td>
                <td><span class="status-badge status-${ev.status}">${ev.status}</span></td>
                <td><div class="action-buttons">
                    <button class="action-btn update" data-id="${ev.id}">✏️</button>
                    <button class="action-btn cancel" data-id="${ev.id}">🚫</button>
                    <button class="action-btn delete" data-id="${ev.id}">🗑️</button>
                </div></td>
            `;
            tbody.appendChild(tr);
        });
        document.querySelectorAll('.action-btn.update').forEach(btn => {
            btn.addEventListener('click', function(){
                const id = parseInt(this.getAttribute('data-id'));
                // set focus and navigate to edit page
                try{ sessionStorage.setItem('cem_focus_event', String(id)); }catch(e){}
                location.href = '../html/new_event.html';
            });
        });

        document.querySelectorAll('.action-btn.cancel').forEach(btn => {
            btn.addEventListener('click', function(){
                const id = parseInt(this.getAttribute('data-id'));
                if (!confirm('Cancel this event? This marks it as canceled (soft cancel).')) return;
                const events = App.getEvents();
                const ev = events.find(x=>x.id === id);
                if (!ev) { alert('Event not found'); return; }
                if (ev.status === 'canceled') { alert('Event already canceled'); return; }
                ev.status = 'canceled';
                App.updateEvent(ev);
                render();
            });
        });

        document.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', function(){
                const id = parseInt(this.getAttribute('data-id'));
                if (confirm('Delete this event?')) {
                    App.deleteEvent(id);
                    render();
                }
            });
        });
    }
    render();
    const newBtn = document.getElementById('newEventBtn');
    if (newBtn) newBtn.addEventListener('click', ()=> location.href = '../html/new_event.html');
});
