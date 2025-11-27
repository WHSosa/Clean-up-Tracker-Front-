document.addEventListener('DOMContentLoaded', function(){
    App.ensureSampleEvent();
    const select = document.getElementById('reportEventSelect');
    const content = document.getElementById('reportContent');
        const canvasEvent = document.getElementById('chartWasteByEvent');
        const canvasAll = document.getElementById('chartWasteAll');
        let wasteEventChart = null;
        let wasteAllChart = null;
        function initPie(){
                // initialize event-specific pie
                if (canvasEvent){
                    const ctxE = canvasEvent.getContext('2d');
                    wasteEventChart = new Chart(ctxE, {
                        type: 'pie',
                        data: { labels: ['No data'], datasets: [{ data: [1], backgroundColor: ['#e0e0e0'] }] },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
                    });
                }
                // initialize aggregated pie
                if (canvasAll){
                    const ctxA = canvasAll.getContext('2d');
                    wasteAllChart = new Chart(ctxA, {
                        type: 'pie',
                        data: { labels: ['No data'], datasets: [{ data: [1], backgroundColor: ['#e0e0e0'] }] },
                        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
                    });
                }
        }
    function populate(){
        if(!select) return;
        // first option: All events (aggregate)
        select.innerHTML = '<option value="all">All events</option>';
        App.getEvents().forEach(ev=>{ const opt = document.createElement('option'); opt.value = String(ev.id); opt.textContent = `${ev.title} (${App.formatDate(ev.date)})`; select.appendChild(opt); });
    }
        function updatePieForEvent(ev){
            if (!wasteEventChart) return;
            const records = (ev && ev.wasteRecords) ? (ev.wasteRecords.slice()) : [];
            if (!records.length){
                wasteEventChart.data.labels = ['No data'];
                wasteEventChart.data.datasets[0].data = [1];
                wasteEventChart.data.datasets[0].backgroundColor = ['#e0e0e0'];
                wasteEventChart.update();
                return;
            }
            // aggregate by category
            const agg = {};
            records.forEach(r=>{ const k = (r.category||'Unknown').toString(); agg[k] = (agg[k]||0) + (r.weight||0); });
            const labels = Object.keys(agg);
            const data = labels.map(l=> +agg[l].toFixed(2));
            const colors = labels.map((_,i)=>['#36b6ff','#2770ff','#ff9f43','#4caf50','#9c27b0','#ff5252'][i % 6]);
            wasteEventChart.data.labels = labels;
            wasteEventChart.data.datasets[0].data = data;
            wasteEventChart.data.datasets[0].backgroundColor = colors;
            wasteEventChart.update();
        }

        function updatePieForAll(events){
            if (!wasteAllChart) return;
            const agg = {};
            (events || []).forEach(ev=>{ (ev.wasteRecords||[]).forEach(r=>{ const k=(r.category||'Unknown').toString(); agg[k] = (agg[k]||0) + (r.weight||0); }); });
            const labels = Object.keys(agg);
            if (!labels.length){
                wasteAllChart.data.labels = ['No data'];
                wasteAllChart.data.datasets[0].data = [1];
                wasteAllChart.data.datasets[0].backgroundColor = ['#e0e0e0'];
                wasteAllChart.update();
                return;
            }
            const data = labels.map(l=> +agg[l].toFixed(2));
            const colors = labels.map((_,i)=>['#36b6ff','#2770ff','#ff9f43','#4caf50','#9c27b0','#ff5252'][i % 6]);
            wasteAllChart.data.labels = labels;
            wasteAllChart.data.datasets[0].data = data;
            wasteAllChart.data.datasets[0].backgroundColor = colors;
            wasteAllChart.update();
        }

        if(select) select.addEventListener('change', function(){
            const val = this.value;
                if(!val || val === 'all'){
                // aggregate across all events
                const events = App.getEvents();
                // build aggregated summary HTML
                const totalEvents = events.length;
                const totalWeight = events.reduce((sum,ev)=> sum + (ev.wasteRecords||[]).reduce((s,r)=>s+(r.weight||0),0), 0);
                const totalVolunteers = events.reduce((s,ev)=> s + (ev.volunteers||0), 0);
                let wasteHTML = '';
                // show top categories list (use aggregated)
                const agg = {};
                events.forEach(ev => (ev.wasteRecords||[]).forEach(r=>{ const k=(r.category||'Unknown'); agg[k] = (agg[k]||0) + (r.weight||0); }));
                Object.keys(agg).forEach(k=>{ wasteHTML += `<div class="panel" style="padding:10px;"><div style="font-weight:600;text-transform:capitalize;margin-bottom:6px;">${k}</div><div>${agg[k].toFixed(2)} kg</div></div>`; });
                const html = `<div class="form-section"><div class="section-title">Cleanup Summary Report</div>
                    <div class="chart-grid" style="margin-bottom:20px;"><div><div style="font-weight:600;color:var(--accent);margin-bottom:6px;">Events Count</div><div>${totalEvents}</div></div><div><div style="font-weight:600;color:var(--accent);margin-bottom:6px;">Total Waste Weight</div><div>${totalWeight.toFixed(2)} kg</div></div><div><div style="font-weight:600;color:var(--accent);margin-bottom:6px;">Volunteers</div><div>${totalVolunteers}</div></div><div></div></div>
                    <div style="margin-bottom:20px;"><div style="font-weight:600;color:var(--accent);margin-bottom:10px;">Waste Collected (aggregated)</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;">${wasteHTML || '<div class="panel">No waste records</div>'}</div></div>
                    <div class="chart-grid" style="margin-bottom:20px;"><div class="panel" style="text-align:center;"><div style="font-weight:600;margin-bottom:6px;">Total Waste</div><div style="font-size:24px;font-weight:700;color:var(--accent);">${totalWeight.toFixed(2)} kg</div></div><div class="panel" style="text-align:center;"><div style="font-weight:600;margin-bottom:6px;">Total Volunteers</div><div style="font-size:24px;font-weight:700;color:var(--accent);">${totalVolunteers}</div></div></div></div>`;
                if(content) content.innerHTML = html;
                // update pie for all
                updatePieForAll(events);
                // also reset the selected-event pie to placeholder
                if (wasteEventChart){ wasteEventChart.data.labels = ['No data']; wasteEventChart.data.datasets[0].data = [1]; wasteEventChart.data.datasets[0].backgroundColor = ['#e0e0e0']; wasteEventChart.update(); }
                return;
            }
            const id = parseInt(val);
            const ev = App.getEvents().find(e=>e.id===id);
            if(!ev) return;
            const totalWeight = (ev.wasteRecords||[]).reduce((s,r)=>s+(r.weight||0),0);
                // build waste grid
                let wasteHTML = '';
                (ev.wasteRecords||[]).forEach(r=>{
                        wasteHTML += `<div class="panel" style="padding:10px;">`;
                        wasteHTML += `<div style="font-weight:600;text-transform:capitalize;margin-bottom:6px;">${r.category}</div>`;
                        wasteHTML += `<div>${r.quantity} items (${r.weight} kg)</div>`;
                        wasteHTML += `</div>`;
                });
                const html = ` <div class="form-section"><div class="section-title">Cleanup Summary Report</div>
                        <div class="chart-grid" style="margin-bottom:20px;">
                            <div>
                                <div style="font-weight:600;color:var(--accent);margin-bottom:6px;">Event Name</div>
                                <div>${ev.title}</div>
                            </div>
                            <div>
                                <div style="font-weight:600;color:var(--accent);margin-bottom:6px;">Date</div>
                                <div>${App.formatDate(ev.date)}</div>
                            </div>
                            <div>
                                <div style="font-weight:600;color:var(--accent);margin-bottom:6px;">Organizer</div>
                                <div>${ev.organizer}</div>
                            </div>
                            <div>
                                <div style="font-weight:600;color:var(--accent);margin-bottom:6px;">Location</div>
                                <div>${ev.location}</div>
                            </div>
                        </div>
                        <div style="margin-bottom:20px;">
                            <div style="font-weight:600;color:var(--accent);margin-bottom:10px;">Waste Collected</div>
                            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;">${wasteHTML || '<div class="panel">No waste records for this event</div>'}</div>
                        </div>
                        <div class="chart-grid" style="margin-bottom:20px;">
                            <div class="panel" style="text-align:center;">
                                <div style="font-weight:600;margin-bottom:6px;">Total Waste Weight</div>
                                <div style="font-size:24px;font-weight:700;color:var(--accent);">${totalWeight.toFixed(2)} kg</div>
                            </div>
                            <div class="panel" style="text-align:center;">
                                <div style="font-weight:600;margin-bottom:6px;">Volunteer Participation</div>
                                <div style="font-size:24px;font-weight:700;color:var(--accent);">${ev.volunteers || 0} Volunteers</div>
                            </div>
                        </div>
                    </div>`;
                if(content) content.innerHTML = html;
                // update pie chart for selected event
                updatePieForEvent(ev);
        });
    populate();
    initPie();
    // default to aggregated view
    if (select){ select.value = 'all'; select.dispatchEvent(new Event('change')); }
});
