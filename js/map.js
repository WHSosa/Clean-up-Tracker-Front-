// Map page: colored circle markers by status and robust sizing
(function(){
  const GEOCACHE_KEY = 'geocache_v1';

  function loadCache(){ try{ return JSON.parse(localStorage.getItem(GEOCACHE_KEY)||'{}'); }catch(e){return{}} }
  function saveCache(c){ try{ localStorage.setItem(GEOCACHE_KEY, JSON.stringify(c)); }catch(e){} }

  async function geocode(q){
    const cache = loadCache(); if(cache[q]) return cache[q];
    try{
      const res = await fetch('https://nominatim.openstreetmap.org/search?format=json&q='+encodeURIComponent(q));
      const j = await res.json();
      if (j && j.length){ const coords = { lat: parseFloat(j[0].lat), lon: parseFloat(j[0].lon) }; cache[q]=coords; saveCache(cache); return coords; }
    }catch(e){ console.warn('geocode failed', e); }
    return null;
  }

  let map = null, eventsLayer = null, userMarker = null, userCircle = null;

  function ensureLeaflet(cb){ if (typeof L === 'undefined') return setTimeout(()=>ensureLeaflet(cb), 200); cb(); }

  function init(){
    ensureLeaflet(()=>{
      const el = document.getElementById('mapCanvas');
      if (!el) return;
      // Add a small visible loading indicator inside the map container
      try{
        let status = document.getElementById('mapStatus');
        if (!status){ status = document.createElement('div'); status.id = 'mapStatus'; status.style.cssText = 'position:absolute;left:20px;top:20px;z-index:9999;padding:8px 12px;background:rgba(0,0,0,0.6);color:#fff;border-radius:6px;font-weight:600;';
          status.textContent = 'Loading map...';
          // position relative parent to allow absolute overlay
          el.style.position = 'relative';
          el.appendChild(status);
        }
      }catch(e){ console.warn('map.js: status overlay creation failed', e); }

      // Ensure the map container has a non-zero height (some layouts hide it briefly)
      try{
        const h = el.offsetHeight || el.clientHeight || 0;
        if (!h || h < 20){
          // fallback: set a reasonable height based on viewport
          el.style.height = Math.max(320, window.innerHeight - 200) + 'px';
          console.info('map.js: set fallback height for #mapCanvas ->', el.style.height);
        }
      }catch(e){ console.warn('map.js: height check failed', e); }

      map = L.map(el).setView([20,0],2);
      console.info('map.js: Leaflet map initialized', map ? true : false);
      window.map = map; // expose globally for invalidate
      // add tile layer and request redraws after layout settles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19, attribution:'&copy; OpenStreetMap contributors' }).addTo(map);
      setTimeout(()=>{ try{ map.invalidateSize(); console.info('map.js: invalidateSize called (1)'); }catch(e){} }, 300);
      setTimeout(()=>{ try{ map.invalidateSize(); console.info('map.js: invalidateSize called (2)'); }catch(e){} }, 1000);
      eventsLayer = L.layerGroup().addTo(map);
      // hide status overlay once tiles are requested (no guarantee tiles are done)
      try{ setTimeout(()=>{ const s = document.getElementById('mapStatus'); if (s && s.parentNode) s.parentNode.removeChild(s); }, 600); }catch(e){}
      startWatch();
      // populate markers robustly
      retryMarkers(6);
    });
  }

  function startWatch(){
    if (!navigator.geolocation) return;
    navigator.geolocation.watchPosition(pos=>{
      const lat = pos.coords.latitude, lon = pos.coords.longitude, acc = pos.coords.accuracy || 50;
      if (!map) return;
      if (!userMarker){ userMarker = L.marker([lat,lon],{title:'Your location'}).addTo(map); userCircle = L.circle([lat,lon],{radius:acc}).addTo(map); }
      else { userMarker.setLatLng([lat,lon]); userCircle.setLatLng([lat,lon]); userCircle.setRadius(acc); }
    }, err=>{ console.warn('geolocation', err); }, { enableHighAccuracy:true, maximumAge:10000, timeout:10000 });
  }

  async function addMarkers(){
    if (!map || !eventsLayer) return;
    eventsLayer.clearLayers();
    const events = (window.App && window.App.getEvents) ? window.App.getEvents() : [];
    const markers = [];
    for (const ev of events){
      if (!ev.location) continue;
      let coords = ev.coords && ev.coords.lat && ev.coords.lon ? ev.coords : null;
      if (!coords) coords = await geocode(ev.location);
      if (!coords) continue;
      ev.coords = coords;
      const status = (ev.status||'').toLowerCase();
      // map status to colors:
      // completed -> green, upcoming/planned -> blue, ongoing -> yellow, canceled -> red
      let color;
      if (status === 'completed' || status === 'done') color = '#2e7d32';
      else if (status === 'planned' || status === 'upcoming' || status === 'scheduled') color = '#36b6ff';
      else if (status === 'ongoing' || status === 'in-progress') color = '#ffcc00';
      else if (status === 'canceled' || status === 'cancelled') color = '#d32f2f';
      else color = '#616161';

      const m = L.circleMarker([coords.lat, coords.lon], { radius:9, color:'#222', weight:1, fillColor: color, fillOpacity:0.96 });
      m.bindPopup(`<strong>${escapeHtml(ev.title||'Untitled')}</strong><br>${escapeHtml(ev.location||'Unknown')}<br>${(window.App&&window.App.formatDate)?window.App.formatDate(ev.date):ev.date}<br>Status: ${escapeHtml(ev.status||'unknown')}`);
      m.addTo(eventsLayer); markers.push(m);
    }
    if (markers.length){
      try{ const group = L.featureGroup(markers); map.fitBounds(group.getBounds().pad(0.2)); }catch(e){ console.warn('fitBounds', e); }
    }
  }

  // add a small legend overlay to explain marker colors
  function ensureLegend(){
    try{
      const container = document.getElementById('mapCanvas');
      if (!container) return;
      if (document.getElementById('mapLegend')) return;
      const legend = document.createElement('div');
      legend.id = 'mapLegend';
      legend.style.cssText = 'position:absolute;right:18px;top:18px;z-index:9999;background:rgba(255,255,255,0.95);padding:8px 12px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.12);font-size:13px;color:#111;';
      legend.innerHTML = '<div style="font-weight:600;margin-bottom:6px;">Map Legend</div>' +
        '<div style="display:flex;gap:8px;align-items:center;margin-bottom:4px;"><span style="display:inline-block;width:12px;height:12px;background:#2e7d32;border-radius:50%;"></span> Completed</div>' +
        '<div style="display:flex;gap:8px;align-items:center;margin-bottom:4px;"><span style="display:inline-block;width:12px;height:12px;background:#36b6ff;border-radius:50%;"></span> Upcoming</div>' +
        '<div style="display:flex;gap:8px;align-items:center;margin-bottom:4px;"><span style="display:inline-block;width:12px;height:12px;background:#ffcc00;border-radius:50%;"></span> Ongoing</div>' +
        '<div style="display:flex;gap:8px;align-items:center;"><span style="display:inline-block;width:12px;height:12px;background:#d32f2f;border-radius:50%;"></span> Canceled</div>';
      container.appendChild(legend);
    }catch(e){ console.warn('map.js: legend creation failed', e); }
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"'\/]/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#47;'})[c]; }); }

  function retryMarkers(n){
    addMarkers().catch(e=>{ console.warn('addMarkers failed', e); });
    if (map) setTimeout(()=>{ try{ map.invalidateSize(); }catch(e){} }, 220);
    if (n>0) setTimeout(()=>retryMarkers(n-1), 700);
  }

  // public
  window.MapPage = window.MapPage || {};
  window.MapPage.initMap = init;
  window.MapPage.refresh = addMarkers;

  document.addEventListener('DOMContentLoaded', ()=>{ init();
    window.addEventListener('resize', ()=>{ try{ map && map.invalidateSize(); }catch(e){} });
    window.addEventListener('pageshow', ()=>{ try{ map && map.invalidateSize(); MapPage.refresh && MapPage.refresh(); }catch(e){} });
  });

})();
