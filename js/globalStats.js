document.addEventListener('DOMContentLoaded', function(){
  function updateAll(){
    const stats = (window.App && window.App.getEventStats) ? window.App.getEventStats() : { totalEvents:0, monthEvents:0, totalWaste:0, totalVolunteers:0 };
    const mapExcluded = ['map.html'];
    // populate global stats elements if present
    const mapping = [ ['gs_totalEvents','totalEvents'], ['gs_monthEvents','monthEvents'], ['gs_totalWaste','totalWaste'], ['gs_totalVolunteers','totalVolunteers'] ];
    mapping.forEach(([id,key])=>{
      const el = document.getElementById(id);
      if (!el) return;
      let val = stats[key];
      if (key === 'totalWaste') val = (typeof val === 'number' || !isNaN(parseFloat(val))) ? (parseFloat(val).toFixed(1)+' kg') : val + ' kg';
      el.textContent = val;
    });
  }

  updateAll();
  // update on storage changes (other tabs) or periodically
  window.addEventListener('storage', updateAll);
  setInterval(updateAll, 3000);
});
