const money = new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0});
const storeKeys = {
  vehicles:'pleyades_vehicles_v1',
  appraisals:'pleyades_appraisals_v1',
  takes:'pleyades_takes_v1'
};

const seedVehicles = [
  {id:crypto.randomUUID(),brand:'Subaru',model:'Forester Touring',year:2023,km:28500,price:485000,status:'Disponible',location:'Piso',advisor:'Jared',vin:'JF2-FORESTER-2023'},
  {id:crypto.randomUUID(),brand:'Nissan',model:'Kicks Exclusive',year:2021,km:75000,price:270000,status:'Disponible',location:'Piso',advisor:'Ángel',vin:'3N8CP5HEXML469308'},
  {id:crypto.randomUUID(),brand:'Kia',model:'EV6 GT-Line AWD',year:2024,km:23000,price:850000,status:'En Proceso',location:'Servicio',advisor:'Jared',vin:'KIA-EV6-2024'},
  {id:crypto.randomUUID(),brand:'Subaru',model:'Crosstrek Limited',year:2024,km:15000,price:385000,status:'Disponible',location:'Piso',advisor:'Ángel',vin:'JF2GU4SM6RG014150'},
  {id:crypto.randomUUID(),brand:'Toyota',model:'RAV4 XLE',year:2020,km:60000,price:395000,status:'Vendido',location:'Entregado',advisor:'Jared',vin:'TOY-RAV4-2020'},
  {id:crypto.randomUUID(),brand:'BMW',model:'330e',year:2024,km:18000,price:720000,status:'Disponible',location:'Piso',advisor:'Ángel',vin:'BMW-330E-2024'}
];

let vehicles = JSON.parse(localStorage.getItem(storeKeys.vehicles) || 'null') || seedVehicles;
let appraisals = JSON.parse(localStorage.getItem(storeKeys.appraisals) || 'null') || [
  {id:crypto.randomUUID(),client:'Arturo Soffer',vehicle:'Suzuki Vitara 2019 · 81,000 km',date:'2026-08-18',status:'Pendiente',notes:'Programar avalúo.'}
];
let takes = JSON.parse(localStorage.getItem(storeKeys.takes) || 'null') || [
  {id:crypto.randomUUID(),client:'Cliente demo',vehicle:'Subaru Forester Sport 2021',date:'2026-08-18',status:'Documentación',notes:'Unidad en resguardo.'}
];

const saveAll = () => {
  localStorage.setItem(storeKeys.vehicles,JSON.stringify(vehicles));
  localStorage.setItem(storeKeys.appraisals,JSON.stringify(appraisals));
  localStorage.setItem(storeKeys.takes,JSON.stringify(takes));
};

const statusClass = s => s === 'Disponible' ? 'disponible' : s === 'Vendido' ? 'vendido' : 'proceso';

function renderKPIs(){
  const total = vehicles.length;
  const available = vehicles.filter(v=>v.status==='Disponible').length;
  const sold = vehicles.filter(v=>v.status==='Vendido').length;
  const process = vehicles.filter(v=>v.status==='En Proceso').length;
  const value = vehicles.filter(v=>v.status!=='Vendido').reduce((a,v)=>a+Number(v.price||0),0);
  document.querySelector('#kpiTotal').textContent = total;
  document.querySelector('#kpiAvailable').textContent = available;
  document.querySelector('#kpiSold').textContent = sold;
  document.querySelector('#kpiProcess').textContent = process;
  document.querySelector('#kpiValue').textContent = money.format(value);
}

function vehicleRow(v,actions=false){
  return `<tr>
    <td><strong>${v.brand}</strong> ${v.model}<br><small style="color:#7f92a8">${v.vin || ''}</small></td>
    <td>${v.year}</td><td>${Number(v.km).toLocaleString('es-MX')}</td><td>${money.format(v.price)}</td>
    <td><span class="status ${statusClass(v.status)}">${v.status}</span></td>
    <td>${v.location || '-'}</td>
    ${actions ? `<td>${v.advisor || '-'}</td><td>
      <button class="action-btn" onclick="editVehicle('${v.id}')">Editar</button>
      <button class="action-btn danger" onclick="deleteVehicle('${v.id}')">Eliminar</button>
    </td>`:''}
  </tr>`;
}

function renderInventory(){
  const q = document.querySelector('#searchInput')?.value.toLowerCase() || '';
  const status = document.querySelector('#statusFilter')?.value || '';
  const brand = document.querySelector('#brandFilter')?.value || '';
  const filtered = vehicles.filter(v=>{
    const hay = `${v.brand} ${v.model} ${v.vin}`.toLowerCase();
    return hay.includes(q) && (!status || v.status===status) && (!brand || v.brand===brand);
  });
  document.querySelector('#inventoryBody').innerHTML = filtered.map(v=>vehicleRow(v,true)).join('') || `<tr><td colspan="8">Sin resultados.</td></tr>`;
  document.querySelector('#recentInventoryBody').innerHTML = vehicles.slice(0,5).map(v=>vehicleRow(v,false)).join('');
  const brands = [...new Set(vehicles.map(v=>v.brand))].sort();
  const brandSelect = document.querySelector('#brandFilter');
  const current = brandSelect.value;
  brandSelect.innerHTML = `<option value="">Todas las marcas</option>` + brands.map(b=>`<option ${b===current?'selected':''}>${b}</option>`).join('');
}

let brandChart, yearChart;
function renderCharts(){
  const brandCounts = {};
  vehicles.filter(v=>v.status!=='Vendido').forEach(v=>brandCounts[v.brand]=(brandCounts[v.brand]||0)+1);
  const years = {};
  vehicles.forEach(v=>years[v.year]=(years[v.year]||0)+1);
  if(brandChart) brandChart.destroy();
  if(yearChart) yearChart.destroy();
  brandChart = new Chart(document.querySelector('#brandChart'),{
    type:'doughnut',
    data:{labels:Object.keys(brandCounts),datasets:[{data:Object.values(brandCounts)}]},
    options:{plugins:{legend:{labels:{color:'#cbd5e1'}}}}
  });
  yearChart = new Chart(document.querySelector('#yearChart'),{
    type:'bar',
    data:{labels:Object.keys(years).sort(),datasets:[{label:'Unidades',data:Object.keys(years).sort().map(y=>years[y])}]},
    options:{
      scales:{
        x:{ticks:{color:'#aebed1'},grid:{color:'#183048'}},
        y:{ticks:{color:'#aebed1',precision:0},grid:{color:'#183048'},beginAtZero:true}
      },
      plugins:{legend:{display:false}}
    }
  });
}

function renderSimpleCards(){
  const mapCards = arr => arr.map(x=>`<div class="mini-card">
    <h4>${x.vehicle}</h4><p><strong>Cliente:</strong> ${x.client}</p>
    <p><strong>Fecha:</strong> ${x.date}</p><p><strong>Estatus:</strong> ${x.status}</p>
    <p>${x.notes || ''}</p>
  </div>`).join('') || '<p>No hay registros todavía.</p>';
  document.querySelector('#appraisalCards').innerHTML = mapCards(appraisals);
  document.querySelector('#takesList').innerHTML = mapCards(takes);
  document.querySelector('#floorList').innerHTML = vehicles.filter(v=>v.location==='Piso').map(v=>`<div class="mini-card"><h4>${v.brand} ${v.model}</h4><p>${v.year} · ${Number(v.km).toLocaleString('es-MX')} km</p><p>${money.format(v.price)}</p></div>`).join('');
  document.querySelector('#salesList').innerHTML = vehicles.filter(v=>v.status==='Vendido').map(v=>`<div class="mini-card"><h4>${v.brand} ${v.model}</h4><p>Asesor: ${v.advisor || '-'}</p><p>${money.format(v.price)}</p></div>`).join('') || '<p>No hay ventas cargadas.</p>';
  document.querySelector('#reconditioningList').innerHTML = vehicles.filter(v=>v.status==='En Proceso').map(v=>`<div class="mini-card"><h4>${v.brand} ${v.model}</h4><p>Ubicación: ${v.location}</p><p>Seguimiento: ${v.advisor || '-'}</p></div>`).join('') || '<p>No hay unidades en proceso.</p>';
}

function renderAll(){
  saveAll(); renderKPIs(); renderInventory(); renderSimpleCards(); renderCharts();
}

const vehicleDialog = document.querySelector('#vehicleDialog');
const vehicleForm = document.querySelector('#vehicleForm');

function openVehicle(v=null){
  document.querySelector('#vehicleModalTitle').textContent = v ? 'Editar vehículo' : 'Agregar vehículo';
  document.querySelector('#vehicleId').value = v?.id || '';
  document.querySelector('#vehicleBrand').value = v?.brand || '';
  document.querySelector('#vehicleModel').value = v?.model || '';
  document.querySelector('#vehicleYear').value = v?.year || 2026;
  document.querySelector('#vehicleKm').value = v?.km || 0;
  document.querySelector('#vehiclePrice').value = v?.price || 0;
  document.querySelector('#vehicleStatus').value = v?.status || 'Disponible';
  document.querySelector('#vehicleLocation').value = v?.location || 'Piso';
  document.querySelector('#vehicleAdvisor').value = v?.advisor || '';
  document.querySelector('#vehicleVin').value = v?.vin || '';
  vehicleDialog.showModal();
}
window.editVehicle = id => openVehicle(vehicles.find(v=>v.id===id));
window.deleteVehicle = id => {
  if(confirm('¿Eliminar esta unidad del inventario?')){
    vehicles = vehicles.filter(v=>v.id!==id); renderAll();
  }
};

vehicleForm.addEventListener('submit',e=>{
  e.preventDefault();
  const id = document.querySelector('#vehicleId').value || crypto.randomUUID();
  const data = {
    id,
    brand:document.querySelector('#vehicleBrand').value.trim(),
    model:document.querySelector('#vehicleModel').value.trim(),
    year:Number(document.querySelector('#vehicleYear').value),
    km:Number(document.querySelector('#vehicleKm').value),
    price:Number(document.querySelector('#vehiclePrice').value),
    status:document.querySelector('#vehicleStatus').value,
    location:document.querySelector('#vehicleLocation').value.trim(),
    advisor:document.querySelector('#vehicleAdvisor').value.trim(),
    vin:document.querySelector('#vehicleVin').value.trim()
  };
  const idx = vehicles.findIndex(v=>v.id===id);
  if(idx>=0) vehicles[idx]=data; else vehicles.unshift(data);
  vehicleDialog.close(); renderAll();
});

document.querySelector('#addVehicleBtn').onclick = ()=>openVehicle();
document.querySelector('#quickAddVehicle').onclick = ()=>openVehicle();
document.querySelector('#closeVehicleDialog').onclick = ()=>vehicleDialog.close();
document.querySelector('#cancelVehicle').onclick = ()=>vehicleDialog.close();

['searchInput','statusFilter','brandFilter'].forEach(id=>{
  document.querySelector('#'+id).addEventListener(id==='searchInput'?'input':'change',renderInventory);
});

// ==========================================
// NUEVA FUNCIONALIDAD: IMPORTAR EXCEL
// ==========================================
const importBtn = document.querySelector('#importExcelBtn');
const fileInput = document.querySelector('#excelFileInput');

if (importBtn && fileInput) {
  importBtn.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        // Validar que la librería XLSX esté cargada
        if (typeof XLSX === 'undefined') {
          alert('Error: La librería SheetJS no se ha cargado correctamente. Revisa tu conexión a internet o la etiqueta script en el HTML.');
          return;
        }

        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const importedData = XLSX.utils.sheet_to_json(firstSheet);

        if (importedData.length === 0) {
          alert('El archivo Excel está vacío o no tiene el formato correcto.');
          return;
        }

        const newVehicles = importedData.map(item => ({
          id: crypto.randomUUID(),
          brand: String(item.Marca || item.brand || 'Sin Marca').trim(),
          model: String(item.Modelo || item.model || 'Sin Modelo').trim(),
          year: Number(item.Año || item.Anio || item.year || 2025),
          km: Number(item.Kilometraje || item.KM || item.km || 0),
          price: Number(item.Precio || item.price || 0),
          status: String(item.Estado || item.status || 'Disponible').trim(),
          location: String(item.Ubicación || item.Ubicacion || item.location || 'Piso').trim(),
          advisor: String(item.Asesor || item.advisor || '').trim(),
          vin: String(item.VIN || item.vin || '').trim()
        }));

        vehicles = newVehicles;
        renderAll();
        fileInput.value = '';
        
        alert(`¡Se han importado ${newVehicles.length} vehículos exitosamente!`);
      } catch (error) {
        console.error(error);
        alert('Hubo un error al procesar el archivo Excel.');
      }
    };
    reader.readAsArrayBuffer(file);
  });
} else {
  console.error("No se encontró el botón de importar o el input de archivo en el DOM.");
}

const simpleDialog = document.querySelector('#simpleDialog');
function openSimple(type){
  document.querySelector('#simpleType').value = type;
  document.querySelector('#simpleModalTitle').textContent = type==='appraisal' ? 'Nuevo avalúo' : 'Nueva toma';
  document.querySelector('#simpleClient').value='';
  document.querySelector('#simpleVehicle').value='';
  document.querySelector('#simpleDate').value=new Date().toISOString().slice(0,10);
  document.querySelector('#simpleStatus').value='Pendiente';
  document.querySelector('#simpleNotes').value='';
  simpleDialog.showModal();
}
document.querySelector('#addAppraisalBtn').onclick=()=>openSimple('appraisal');
document.querySelector('#quickAddAppraisal').onclick=()=>openSimple('appraisal');
document.querySelector('#addTakeBtn').onclick=()=>openSimple('take');
document.querySelector('#quickAddTake').onclick=()=>openSimple('take');
document.querySelector('#closeSimpleDialog').onclick=()=>simpleDialog.close();
document.querySelector('#cancelSimple').onclick=()=>simpleDialog.close();

document.querySelector('#simpleForm').addEventListener('submit',e=>{
  e.preventDefault();
  const item = {
    id:crypto.randomUUID(),
    client:document.querySelector('#simpleClient').value.trim(),
    vehicle:document.querySelector('#simpleVehicle').value.trim(),
    date:document.querySelector('#simpleDate').value,
    status:document.querySelector('#simpleStatus').value.trim(),
    notes:document.querySelector('#simpleNotes').value.trim()
  };
  if(document.querySelector('#simpleType').value==='appraisal') appraisals.unshift(item);
  else takes.unshift(item);
  simpleDialog.close(); renderAll();
});

const views = {
  resumen:['Dashboard General','Visión completa del inventario y rendimiento.'],
  inventario:['Inventario','Control y seguimiento de unidades seminuevas.'],
  avaluos:['Avalúos','Unidades pendientes y valuadas.'],
  tomas:['Tomas','Seguimiento de unidades tomadas a cuenta.'],
  piso:['Entradas a Piso','Unidades disponibles físicamente en piso.'],
  ventas:['Ventas','Histórico de unidades vendidas.'],
  reacond:['Reacondicionamiento','Unidades que requieren trabajo o documentación.'],
  reportes:['Reportes','Exportación y control de información.']
};

function switchView(name){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active-view'));
  document.querySelector(`#${name}View`).classList.add('active-view');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.view===name));
  document.querySelector('#viewTitle').textContent=views[name][0];
  document.querySelector('#viewDescription').textContent=views[name][1];
}
document.querySelectorAll('.nav-item').forEach(btn=>btn.onclick=()=>switchView(btn.dataset.view));
document.querySelector('#goInventory').onclick=()=>switchView('inventario');

document.querySelector('#exportCsvBtn').onclick=()=>{
  const headers=['Marca','Modelo','Año','KM','Precio','Estado','Ubicación','Asesor','VIN'];
  const rows=vehicles.map(v=>[v.brand,v.model,v.year,v.km,v.price,v.status,v.location,v.advisor,v.vin]);
  const csv=[headers,...rows].map(r=>r.map(x=>`"${String(x??'').replaceAll('"','""')}"`).join(',')).join('\n');
  const blob=new Blob(["\ufeff"+csv],{type:'text/csv;charset=utf-8;'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='inventario_seminuevos.csv';
  a.click();
  URL.revokeObjectURL(a.href);
};

renderAll();
