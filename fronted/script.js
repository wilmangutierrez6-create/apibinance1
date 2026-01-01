// ============================================
// DASHBOARD P2P BINANCE - VERSIÓN DE PRUEBA
// ============================================

// Datos de ejemplo (simulados)
let operationsData = [];

// Cuando la página cargue
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Dashboard cargado');
    // En lugar de generar ejemplos, cargamos el archivo JSON real
    cargarDatosDesdeJSON(); 
});

// NUEVA FUNCIÓN PARA LEER DATOS REALES
async function cargarDatosDesdeJSON() {
    try {
        console.log('Fetching datos reales desde data/p2p-data.json...');
        // Ajusta la ruta si tu HTML está en la carpeta 'fronted'
        const respuesta = await fetch('../data/p2p-data.json'); 
        const datos = await respuesta.json();
        
        // Aquí es donde conectas los datos del JSON con tu lógica de Dashboard
        // Nota: Ajusta 'datos.operaciones' según la estructura de tu script Python
        operationsData = datos.operaciones || []; 
        
        // Si el JSON es exitoso, dibujamos todo
        actualizarInterfaz();
        
    } catch (error) {
        console.error('❌ Error cargando el JSON real:', error);
        console.log('Cargando datos de ejemplo por falla de red...');
        cargarDatosEjemplo(); // Plan B si el archivo no existe
        actualizarInterfaz();
    }
}

function actualizarInterfaz() {
    mostrarDashboard();
    crearGrafico();
    mostrarTablaOperaciones();
    mostrarMejoresDias();
}
// 1. CARGAR DATOS DE EJEMPLO
function cargarDatosEjemplo() {
    console.log('📊 Generando datos de ejemplo...');
    
    const activos = ['USDT', 'BTC', 'ETH', 'BNB'];
    const tipos = ['COMPRA', 'VENTA'];
    const hoy = new Date();
    
    // Generar 30 operaciones de ejemplo
    for (let i = 0; i < 30; i++) {
        const fecha = new Date();
        fecha.setDate(hoy.getDate() - Math.floor(Math.random() * 30));
        
        const monto = 100 + (Math.random() * 1000);
        const ganancia = (Math.random() * 50) - 5; // Entre -5 y +45
        
        operationsData.push({
            id: i + 1,
            fecha: fecha.toISOString().split('T')[0],
            activo: activos[Math.floor(Math.random() * activos.length)],
            tipo: tipos[Math.floor(Math.random() * 2)],
            monto: parseFloat(monto.toFixed(2)),
            ganancia: parseFloat(ganancia.toFixed(2)),
            estado: 'COMPLETADO'
        });
    }
    
    console.log(`✅ ${operationsData.length} operaciones generadas`);
}

// 2. MOSTRAR DASHBOARD
function mostrarDashboard() {
    console.log('📈 Calculando métricas...');
    
    // Calcular ganancias
    const gananciaHoy = calcularGananciaPorDias(1);
    const gananciaSemana = calcularGananciaPorDias(7);
    const gananciaMes = calcularGananciaPorDias(30);
    const gananciaTotal = calcularGananciaTotal();
    
    // Actualizar números en pantalla
    document.getElementById('today-profit').textContent = formatearDinero(gananciaHoy);
    document.getElementById('week-profit').textContent = formatearDinero(gananciaSemana);
    document.getElementById('month-profit').textContent = formatearDinero(gananciaMes);
    document.getElementById('total-profit').textContent = formatearDinero(gananciaTotal);
    document.getElementById('total-trades').textContent = `${operationsData.length} operaciones`;
    
    // Mostrar cambios (simulados)
    document.getElementById('today-change').innerHTML = 
        `<span class="profit-positive">+${(Math.random() * 10).toFixed(1)}% vs ayer</span>`;
    document.getElementById('week-change').innerHTML = 
        `<span class="profit-positive">+${(10 + Math.random() * 15).toFixed(1)}% vs semana pasada</span>`;
    document.getElementById('month-change').innerHTML = 
        `<span class="profit-positive">+${(20 + Math.random() * 20).toFixed(1)}% vs mes pasado</span>`;
    
    console.log('✅ Dashboard actualizado');
}

// 3. CREAR GRÁFICO
function crearGrafico() {
    console.log('📊 Creando gráfico...');
    
    const ctx = document.getElementById('profitChart').getContext('2d');
    
    // Datos de los últimos 7 días
    const ultimos7Dias = obtenerUltimosNDias(7);
    const datosGrafico = ultimos7Dias.map(dia => {
        return {
            fecha: dia,
            ganancia: calcularGananciaPorFecha(dia)
        };
    });
    
    // Nombres de los días
    const nombresDias = datosGrafico.map(d => {
        const fecha = new Date(d.fecha);
        return fecha.toLocaleDateString('es-ES', { weekday: 'short' });
    });
    
    // Crear gráfico
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: nombresDias,
            datasets: [{
                label: 'Ganancias Diarias ($)',
                data: datosGrafico.map(d => d.ganancia),
                borderColor: '#f0b90b',
                backgroundColor: 'rgba(240, 185, 11, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#f0b90b',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Ganancia: $${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        },
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                }
            }
        }
    });
    
    console.log('✅ Gráfico creado');
}

// 4. MOSTRAR TABLA DE OPERACIONES
function mostrarTablaOperaciones() {
    console.log('📋 Mostrando tabla de operaciones...');
    
    const tbody = document.getElementById('operations-table');
    tbody.innerHTML = '';
    
    // Mostrar solo las últimas 10 operaciones
    const ultimasOperaciones = operationsData.slice(0, 10);
    
    ultimasOperaciones.forEach(op => {
        const fila = document.createElement('tr');
        
        fila.innerHTML = `
            <td>${formatearFecha(op.fecha)}</td>
            <td><strong>${op.activo}</strong></td>
            <td><span class="badge ${op.tipo === 'COMPRA' ? 'bg-info' : 'bg-warning'}">
                ${op.tipo}
            </span></td>
            <td>${formatearDinero(op.monto)}</td>
            <td class="${op.ganancia >= 0 ? 'profit-positive' : 'profit-negative'}">
                ${formatearDinero(op.ganancia)}
            </td>
            <td><span class="badge-completed">${op.estado}</span></td>
        `;
        
        tbody.appendChild(fila);
    });
    
    // Configurar filtro por fecha
    document.getElementById('date-filter').addEventListener('change', function(e) {
        filtrarPorFecha(e.target.value);
    });
    
    console.log('✅ Tabla cargada');
}

// 5. MOSTRAR MEJORES DÍAS
function mostrarMejoresDias() {
    console.log('🏆 Calculando mejores días...');
    
    const lista = document.getElementById('top-days');
    lista.innerHTML = '';
    
    // Agrupar ganancias por día
    const gananciasPorDia = {};
    
    operationsData.forEach(op => {
        if (!gananciasPorDia[op.fecha]) {
            gananciasPorDia[op.fecha] = 0;
        }
        gananciasPorDia[op.fecha] += op.ganancia;
    });
    
    // Filtrar días con ganancias positivas y ordenar
    const diasPositivos = Object.entries(gananciasPorDia)
        .filter(([_, ganancia]) => ganancia > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    if (diasPositivos.length === 0) {
        lista.innerHTML = `
            <li class="list-group-item text-center">No hay días con ganancias aún</li>
        `;
        return;
    }
    
    // Mostrar en lista
    diasPositivos.forEach(([fecha, ganancia]) => {
        const item = document.createElement('li');
        item.className = 'list-group-item d-flex justify-content-between align-items-center';
        item.innerHTML = `
            <div>
                <strong>${formatearFecha(fecha)}</strong>
            </div>
            <span class="profit-positive">${formatearDinero(ganancia)}</span>
        `;
        lista.appendChild(item);
    });
    
    console.log('✅ Mejores días mostrados');
}

// ============================================
// FUNCIONES UTILITARIAS
// ============================================

function calcularGananciaPorDias(dias) {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - dias);
    
    return operationsData
        .filter(op => new Date(op.fecha) >= fechaLimite)
        .reduce((sum, op) => sum + op.ganancia, 0);
}

function calcularGananciaPorFecha(fechaStr) {
    return operationsData
        .filter(op => op.fecha === fechaStr)
        .reduce((sum, op) => sum + op.ganancia, 0);
}

function calcularGananciaTotal() {
    return operationsData.reduce((sum, op) => sum + op.ganancia, 0);
}

function filtrarPorFecha(fecha) {
    const tbody = document.getElementById('operations-table');
    tbody.innerHTML = '';
    
    if (!fecha) {
        mostrarTablaOperaciones();
        return;
    }
    
    const operacionesFiltradas = operationsData.filter(op => op.fecha === fecha);
    
    if (operacionesFiltradas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No hay operaciones para esta fecha</td>
            </tr>
        `;
        return;
    }
    
    operacionesFiltradas.forEach(op => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${formatearFecha(op.fecha)}</td>
            <td><strong>${op.activo}</strong></td>
            <td><span class="badge ${op.tipo === 'COMPRA' ? 'bg-info' : 'bg-warning'}">
                ${op.tipo}
            </span></td>
            <td>${formatearDinero(op.monto)}</td>
            <td class="${op.ganancia >= 0 ? 'profit-positive' : 'profit-negative'}">
                ${formatearDinero(op.ganancia)}
            </td>
            <td><span class="badge-completed">${op.estado}</span></td>
        `;
        tbody.appendChild(fila);
    });
}

function obtenerUltimosNDias(n) {
    const dias = [];
    for (let i = n - 1; i >= 0; i--) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        dias.push(fecha.toISOString().split('T')[0]);
    }
    return dias;
}

function formatearDinero(cantidad) {
    return '$' + cantidad.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function formatearFecha(fechaStr) {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// ============================================
// INFORMACIÓN PARA CONECTAR TU API REAL
// ============================================

console.log(`
╔══════════════════════════════════════════╗
║   ✅ DASHBOARD DE PRUEBA CARGADO        ║
║                                          ║
║   Para conectar tu API real:            ║
║   1. Reemplaza 'cargarDatosEjemplo()'   ║
║   2. Llama a tu API en su lugar         ║
║   3. Procesa los datos de Binance P2P   ║
║                                          ║
║   Ejemplo de llamada a API:             ║
║   fetch('TU_API_URL')                   ║
║     .then(response => response.json())  ║
║     .then(data => {                     ║
║       operationsData = data;            ║
║       mostrarDashboard();               ║
║     });                                 ║
╚══════════════════════════════════════════╝
`);

// Simular actualización automática cada 30 segundos
setInterval(() => {
    console.log('🔄 Actualizando datos...');
    // Aquí iría la llamada real a tu API

}, 30000);
