document.addEventListener('DOMContentLoaded', function(){
    App.ensureSampleEvent();
    function addWasteRow(record){
        const tableBody = document.getElementById('wasteTable');
        if (!tableBody) return;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><select class="form-control waste-category"><option value="plastic">Plastic Bottles</option><option value="glass">Glass</option><option value="paper">Paper</option><option value="metal">Metal</option><option value="other">Other</option></select></td>
            <td><input type="number" class="form-control waste-quantity" value="0" min="0"></td>
            <td><input type="number" class="form-control waste-weight" value="0.00" min="0" step="0.01"></td>
            <td><button class="delete-btn">×</button></td>
        `;
        tableBody.appendChild(tr);
        const del = tr.querySelector('.delete-btn');
        del.addEventListener('click', ()=>{ if (tableBody.children.length>1) tableBody.removeChild(tr); calculateTotalWeight(); });
        tr.querySelectorAll('input').forEach(i=>i.addEventListener('input', calculateTotalWeight));
        if (record){
            const sel = tr.querySelector('.waste-category'); if (sel) sel.value = record.category || sel.value;
            const q = tr.querySelector('.waste-quantity'); if (q) q.value = record.quantity || 0;
            const w = tr.querySelector('.waste-weight'); if (w) w.value = parseFloat(record.weight||0).toFixed(2);
            calculateTotalWeight();
        }
    }
    function calculateTotalWeight(){
        let total=0; document.querySelectorAll('#wasteTable tr').forEach(row=>{ const w=row.querySelector('.waste-weight'); if(w && w.value) total+=parseFloat(w.value)||0; });
        const el=document.getElementById('totalWeight'); if(el) el.textContent = total.toFixed(2);
    }
    function collectEventData(){
        const wasteRecords = [];
        document.querySelectorAll('#wasteTable tr').forEach(row=>{ const cat=row.querySelector('.waste-category').value; const q=parseInt(row.querySelector('.waste-quantity').value)||0; const w=parseFloat(row.querySelector('.waste-weight').value)||0; if(cat && (q>0||w>0)) wasteRecords.push({category:cat,quantity:q,weight:w}); });
        return {
            title: document.getElementById('eventTitle').value,
            date: document.getElementById('eventDate').value,
            location: document.getElementById('eventLocation').value,
            organizer: document.getElementById('eventOrganizer').value,
            status: document.getElementById('eventStatus').value,
            volunteers: parseInt(document.getElementById('eventVolunteers').value)||0,
            wasteRecords
        };
    }
    const addBtn = document.getElementById('addWasteRow'); if(addBtn) addBtn.addEventListener('click', ()=>addWasteRow());
    const saveBtn = document.getElementById('saveEvent');
    const cancelBtn = document.getElementById('cancelEvent');

    // detect edit mode
    let focusId = null;
    try{ const f = sessionStorage.getItem('cem_focus_event'); focusId = f ? parseInt(f) : null; }catch(e){ focusId = null; }
    if (focusId){
        const existing = App.getEvents().find(x=>x.id === focusId);
        if (existing){
            // prefill fields
            const t = document.getElementById('eventTitle'); if (t) t.value = existing.title || '';
            const d = document.getElementById('eventDate'); if (d) d.value = existing.date || '';
            const l = document.getElementById('eventLocation'); if (l) l.value = existing.location || '';
            const o = document.getElementById('eventOrganizer'); if (o) o.value = existing.organizer || '';
            const s = document.getElementById('eventStatus'); if (s) s.value = existing.status || 'planned';
            const v = document.getElementById('eventVolunteers'); if (v) v.value = existing.volunteers || 0;
            // populate waste rows
            const tableBody = document.getElementById('wasteTable'); if (tableBody) tableBody.innerHTML = '';
            (existing.wasteRecords || []).forEach(r=> addWasteRow(r));
        }
    }

    if (saveBtn) saveBtn.addEventListener('click', function(){
        const ev = collectEventData();
        if(!ev.title||!ev.date||!ev.location||!ev.organizer){ alert('Please fill required fields'); return; }
        if (focusId){ ev.id = focusId; App.updateEvent(ev); try{ sessionStorage.removeItem('cem_focus_event'); }catch(e){}; alert('Updated'); location.href = '../html/events.html'; return; }
        App.addEvent(ev); alert('Saved'); location.href = '../html/events.html';
    });
    if (cancelBtn) cancelBtn.addEventListener('click', function(){ try{ sessionStorage.removeItem('cem_focus_event'); }catch(e){}; location.href = '../html/events.html'; });

    // init
    if (!focusId) addWasteRow();
    calculateTotalWeight();
});
