// ============================================
// DASHBOARD P2P BINANCE - LÓGICA DE DATOS
// ============================================

let operationsData = [];

// 1. Iniciar la carga cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Dashboard iniciado');
    cargarDatosDesdeJSON(); 
});

// 2. Función principal para leer el archivo generado por Python
async function cargarDatosDesdeJSON() {
    try {
        console.log('Fetching datos reales desde ../data/p2p-data.json...');
        
        // El ".." es vital para subir un nivel desde la carpeta 'fronted' a la raíz
        const respuesta = await fetch('../data/p2p-data.json'); 
        
        if (!respuesta.ok) throw new Error('No se pudo encontrar el archivo JSON');
        
        const datos = await respuesta.json();
        
        // Conectamos con la clave "operaciones" que definimos en el YAML/Python
        operationsData = datos.operaciones || []; 
        
        console.log('Datos cargados con éxito:', operationsData);
        actualizarInterfaz();
        
    } catch (error) {
        console.error('❌ Error cargando el JSON real:', error);
        // Si falla (por ejemplo, abriendo el archivo localmente), cargamos ejemplos
        cargarDatosEjemplo(); 
        actualizarInterfaz();
    }
}

// 3. Función para refrescar todos los elementos visuales
function actualizarInterfaz() {
    mostrarDashboard();
    crearGrafico();
    mostrarTablaOperaciones();
    mostrarMejoresDias();
}

// --- FUNCIONES DE CÁLCULO Y VISUALIZACIÓN ---

function mostrarDashboard() {
    const gananciaHoy = calcularGananciaPorDias(1);
    const gananciaSemana = calcularGananciaPorDias(7);
    const gananciaMes = calcularGananciaPorDias(30);
    const gananciaTotal = operationsData.reduce((sum, op) => sum + op.ganancia, 0);

    // Actualizar los IDs que tienes en tu index.html
    document.getElementById('today-profit').textContent = formatearDinero(gananciaHoy);
    document.getElementById('week-profit').textContent = formatearDinero(gananciaSemana);
    document.getElementById('month-profit').textContent = formatearDinero(gananciaMes);
    document.getElementById('total-profit').textContent = formatearDinero(gananciaTotal);
    document.getElementById('total-trades').textContent = `${operationsData.length} operaciones`;
    
    // Cambios porcentuales (simulados para completar la UI)
    document.getElementById('today-change').className = 'profit-positive';
    document.getElementById('today-change').textContent = '+2.5% vs ayer';
    document.getElementById('week-change').className = 'profit-positive';
    document.getElementById('week-change').textContent = '+12% vs semana pasada';
}

function crearGrafico() {
    const ctx = document.getElementById('profitChart').getContext('2d');
    
    // Evitar duplicados si se refresca la función
    if (window.myChart) window.myChart.destroy();

    const ultimos7Dias = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
    });

    const datosGrafico = ultimos7Dias.map(fecha => {
        return operationsData
            .filter(op => op.fecha === fecha)
            .reduce((sum, op) => sum + op.ganancia, 0);
    });

    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ultimos7Dias.map(f => formatearFecha(f)),
            datasets: [{
                label: 'Ganancia Diaria ($)',
                data: datosGrafico,
                borderColor: '#f0b90b',
                backgroundColor: 'rgba(240, 185, 11, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function mostrarTablaOperaciones() {
    const tbody = document.getElementById('operations-table');
    tbody.innerHTML = '';

    operationsData.forEach(op => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${formatearFecha(op.fecha)}</td>
            <td><strong>${op.activo}</strong></td>
            <td><span class="badge ${op.tipo === 'COMPRA' ? 'bg-info' : 'bg-warning'}">${op.tipo}</span></td>
            <td>${formatearDinero(op.monto)}</td>
            <td class="${op.ganancia >= 0 ? 'profit-positive' : 'profit-negative'}">${formatearDinero(op.ganancia)}</td>
            <td><span class="badge-completed">${op.estado}</span></td>
        `;
        tbody.appendChild(fila);
    });
}

function mostrarMejoresDias() {
    const lista = document.getElementById('top-days');
    lista.innerHTML = '';
    
    const dias = {};
    operationsData.forEach(op => {
        dias[op.fecha] = (dias[op.fecha] || 0) + op.ganancia;
    });

    Object.entries(dias)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([fecha, ganancia]) => {
            const item = document.createElement('li');
            item.className = 'list-group-item d-flex justify-content-between';
            item.innerHTML = `<strong>${formatearFecha(fecha)}</strong> <span class="profit-positive">${formatearDinero(ganancia)}</span>`;
            lista.appendChild(item);
        });
}

// --- UTILIDADES ---

function calcularGananciaPorDias(n) {
    const limite = new Date();
    limite.setDate(limite.getDate() - n);
    return operationsData
        .filter(op => new Date(op.fecha) >= limite)
        .reduce((sum, op) => sum + op.ganancia, 0);
}

function formatearDinero(n) {
    return '$' + n.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function formatearFecha(f) {
    return new Date(f).toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit'});
}

function cargarDatosEjemplo() {
    console.warn('⚠️ Cargando datos de respaldo...');
    operationsData = [
        { id: 99, fecha: new Date().toISOString().split('T')[0], activo: 'USDT', tipo: 'VENTA', monto: 100, ganancia: 5.5, estado: 'COMPLETADO' }
    ];
}
// Añade esta función a tu script.js para calcular el resumen diario real
function calcularResumenComoExcel() {
    const resumen = operationsData.reduce((acc, op) => {
        if (!acc[op.fecha]) acc[op.fecha] = { compra: 0, venta: 0 };
        if (op.tipo === 'COMPRA') acc[op.fecha].compra += op.monto;
        else acc[op.fecha].venta += op.monto;
        return acc;
    }, {});

    console.log("Resumen Diario Calculado:", resumen);
    // Aquí puedes enviar estos datos a una nueva tabla de 'Resumen Diarios'
}
// Auto-actualizar cada 10 minutos
setInterval(cargarDatosDesdeJSON, 600000);



