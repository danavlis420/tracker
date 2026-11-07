// =========================================================
// MÓDULO 1 (PRINCIPAL): FINANZAS, INGRESOS & EGRESOS DEL MES
// =========================================================

const FinanzasMod = (function () {
    let activeFilter = 'ALL'; // ALL | INGRESOS | EGRESOS
    let formMode = 'EGRESO';  // EGRESO | INGRESO

    const EXPENSE_CATEGORIES = [
        'Servicios & Fijos',
        'Transporte / SUBE',
        'Estudio / Facultad',
        'Salidas / Ocio / Birra',
        'Salud & Gym',
        'Cultivo / Indoor / DIY',
        'Alimentación Extra (Fuera de MealPrep)',
        'Otros Gastos'
    ];

    const INCOME_CATEGORIES = [
        'Sueldo / Librería',
        'Freelance / Multimedia',
        'Ventas / MercadoLibre',
        'Reintegros / Ahorros',
        'Otros Ingresos'
    ];

    function init() {
        // Escucha eventos de compras de MealPrep sin acoplarse al código de mealprep.js
        AppCore.on('shopping:updated', () => {
            render();
        });
    }

    function setFormMode(mode) {
        formMode = mode;
        render();
    }

    function setFilter(filter) {
        activeFilter = filter;
        render();
    }

    function handleAddTransaction(e) {
        e.preventDefault();
        const desc = document.getElementById('fin-desc').value.trim();
        const amount = parseInt(document.getElementById('fin-amount').value, 10) || 0;
        const cat = document.getElementById('fin-cat').value;
        if (!desc || amount <= 0) return;

        const today = new Date().toLocaleDateString('es-AR');
        const state = AppCore.getState();

        if (formMode === 'INGRESO') {
            state.incomes.push({
                id: 'inc_' + Date.now(),
                desc,
                amount,
                cat,
                date: today
            });
            AppCore.showToast(`+ Ingreso registrado: ${AppCore.formatARS(amount)}`);
        } else {
            state.generalExpenses.push({
                id: 'exp_' + Date.now(),
                desc,
                amount,
                cat,
                date: today
            });
            AppCore.showToast(`- Gasto registrado: ${AppCore.formatARS(amount)}`);
        }

        // Dispara evento al bus para que el módulo de hábitos marque el hábito de registro diario
        AppCore.emit('transaction:added', { type: formMode, amount });
        AppCore.saveState();
        render();
    }

    function deleteIncome(id) {
        const state = AppCore.getState();
        state.incomes = state.incomes.filter(i => i.id !== id);
        AppCore.saveState();
        render();
        AppCore.showToast('Ingreso eliminado', 'warning');
    }

    function deleteExpense(id) {
        const state = AppCore.getState();
        state.generalExpenses = state.generalExpenses.filter(g => g.id !== id);
        AppCore.saveState();
        render();
        AppCore.showToast('Gasto eliminado', 'warning');
    }

    function render() {
        const container = document.getElementById('module-view-finanzas');
        if (!container) return;

        const state = AppCore.getState();
        const fin = AppCore.getFinancialSummary();

        // Diagnóstico de salud financiera
        const expenseRatio = fin.totalIncome > 0 ? Math.min(100, Math.round((fin.totalExpenses / fin.totalIncome) * 100)) : 0;
        let statusTag = 'MODO AHORRO / RELAX 420';
        let statusColor = 'text-acid border-acid bg-acid-dark';
        if (fin.netBalance < 0) {
            statusTag = 'ALERTA ROJA: DÉFICIT MENSUAL';
            statusColor = 'text-rose-300 border-rose-500 bg-rose-950';
        } else if (expenseRatio > 85) {
            statusTag = 'PRECAUCIÓN: MARGEN AJUSTADO (<15%)';
            statusColor = 'text-amber-300 border-amber-400 bg-amber-950';
        }

        // Categorías de Egresos para el gráfico de barras
        const catTotals = { 'Alimentación Meal-Prep (Sincronizado)': fin.foodSpent };
        state.generalExpenses.forEach(g => {
            catTotals[g.cat] = (catTotals[g.cat] || 0) + Number(g.amount || 0);
        });

        const categoryBarsHtml = Object.entries(catTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, amt]) => {
                const pctOfExpenses = fin.totalExpenses > 0 ? Math.round((amt / fin.totalExpenses) * 100) : 0;
                const pctOfIncome = fin.totalIncome > 0 ? Math.round((amt / fin.totalIncome) * 100) : 0;
                const isMealPrep = cat.includes('Meal-Prep');
                return `
                    <div class="space-y-1 bg-black p-2.5 border border-stone-800">
                        <div class="flex justify-between text-xs">
                            <span class="font-bold ${isMealPrep ? 'text-amber-300' : 'text-stone-200'}">
                                ${isMealPrep ? '🍱 ' : '▸ '}${cat}
                            </span>
                            <span class="font-bold text-white">
                                ${AppCore.formatARS(amt)} <span class="text-[10px] text-stone-400">(${pctOfExpenses}% del gasto | ${pctOfIncome}% de tu ingreso)</span>
                            </span>
                        </div>
                        <div class="w-full h-2.5 bg-stone-900 border border-stone-700 overflow-hidden">
                            <div class="h-full ${isMealPrep ? 'bg-amber-400' : 'bg-purple-500'}" style="width: ${pctOfExpenses}%"></div>
                        </div>
                    </div>
                `;
            }).join('');

        // Construir lista unificada de movimientos (Ingresos + Egresos + MealPrep Sync)
        const unifiedMovements = [];
        if (activeFilter === 'ALL' || activeFilter === 'INGRESOS') {
            state.incomes.forEach(inc => {
                unifiedMovements.push({ ...inc, movType: 'INGRESO' });
            });
        }
        if (activeFilter === 'ALL' || activeFilter === 'EGRESOS') {
            state.generalExpenses.forEach(exp => {
                unifiedMovements.push({ ...exp, movType: 'EGRESO' });
            });
        }

        const movementsHtml = unifiedMovements.slice().reverse().map(m => {
            const isInc = m.movType === 'INGRESO';
            return `
                <div class="p-3 bg-black border-2 ${isInc ? 'border-lime-900/80' : 'border-stone-800'} flex items-center justify-between gap-2">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 flex items-center justify-center font-bold text-xs border ${isInc ? 'bg-acid-dark text-acid border-acid' : 'bg-rose-950/60 text-rose-400 border-rose-500'}">
                            ${isInc ? '+$' : '-$'}
                        </div>
                        <div>
                            <p class="text-xs sm:text-sm font-bold text-white">${m.desc}</p>
                            <div class="flex flex-wrap items-center gap-2 text-[10px] text-stone-400">
                                <span class="px-1.5 py-0.2 bg-stone-900 border border-stone-700 text-stone-300">${m.cat}</span>
                                <span>• ${m.date}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="font-pixel text-xl ${isInc ? 'text-acid' : 'text-rose-400'}">
                            ${isInc ? '+' : '-'}${AppCore.formatARS(m.amount)}
                        </span>
                        <button onclick="${isInc ? `FinanzasMod.deleteIncome('${m.id}')` : `FinanzasMod.deleteExpense('${m.id}')`}"
                                class="text-stone-500 hover:text-rose-400 text-xs px-1.5 py-1 border border-transparent hover:border-rose-500">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        const categoriesList = formMode === 'INGRESO' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

        container.innerHTML = `
            <!-- BANNER FOTOLOG PRINCIPAL DE FINANZAS -->
            <div class="retro-panel p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-acid">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] font-bold px-2 py-0.5 border ${statusColor}">${statusTag}</span>
                        <span class="text-xs text-stone-400">// LIBRO MAYOR MENSUAL</span>
                    </div>
                    <h2 class="font-pixel text-3xl sm:text-4xl text-white mt-1">
                        CONTROL CENTRAL DE FINANZAS (INGRESOS vs EGRESOS)
                    </h2>
                    <p class="text-xs text-stone-400 max-w-2xl">
                        Anotá cada peso que entra y sale. Las compras marcadas en tu sección de <strong>Meal-Prep ($150k)</strong> impactan automáticamente en tus egresos reales del mes.
                    </p>
                </div>
                <div class="flex gap-2 shrink-0">
                    <button onclick="AppCore.switchModule('mealprep')" class="retro-btn bg-black text-amber-300 px-3 py-2 text-xs font-bold">
                        <i class="fa-solid fa-bowl-rice"></i> Ir a Meal-Prep ($150k)
                    </button>
                </div>
            </div>

            <!-- 4 TARJETAS DE FLUJO DE CAJA -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- 1. Total Ingresos -->
                <div class="retro-panel p-4 border-t-4 border-t-lime-400">
                    <div class="flex justify-between items-center text-xs text-stone-400">
                        <span>1. INGRESOS DEL MES</span>
                        <i class="fa-solid fa-arrow-trend-up text-acid"></i>
                    </div>
                    <p class="font-pixel text-3xl sm:text-4xl text-acid mt-1">+${AppCore.formatARS(fin.totalIncome)}</p>
                    <p class="text-[11px] text-stone-400 mt-1">${state.incomes.length} ingreso(s) registrado(s)</p>
                </div>

                <!-- 2. Total Egresos -->
                <div class="retro-panel p-4 border-t-4 border-t-rose-500">
                    <div class="flex justify-between items-center text-xs text-stone-400">
                        <span>2. EGRESOS TOTALES</span>
                        <i class="fa-solid fa-arrow-trend-down text-rose-400"></i>
                    </div>
                    <p class="font-pixel text-3xl sm:text-4xl text-rose-400 mt-1">-${AppCore.formatARS(fin.totalExpenses)}</p>
                    <p class="text-[11px] text-stone-400 mt-1">Gastos: ${AppCore.formatARS(fin.otherExpenses)} + Comida: ${AppCore.formatARS(fin.foodSpent)}</p>
                </div>

                <!-- 3. Saldo Neto Disponible -->
                <div class="retro-panel p-4 border-t-4 border-t-purple-400">
                    <div class="flex justify-between items-center text-xs text-stone-400">
                        <span>3. SALDO DISPONIBLE</span>
                        <i class="fa-solid fa-scale-balanced text-purple-300"></i>
                    </div>
                    <p class="font-pixel text-3xl sm:text-4xl ${fin.netBalance >= 0 ? 'text-white' : 'text-rose-400'} mt-1">
                        ${AppCore.formatARS(fin.netBalance)}
                    </p>
                    <p class="text-[11px] text-purple-300 mt-1">Margen libre: ${fin.savingsRate}% de tus ingresos</p>
                </div>

                <!-- 4. Cupo Comida Meal-Prep -->
                <div class="retro-panel p-4 border-t-4 border-t-amber-400">
                    <div class="flex justify-between items-center text-xs text-stone-400">
                        <span>4. CUPO MEAL-PREP</span>
                        <i class="fa-solid fa-snowflake text-amber-300"></i>
                    </div>
                    <p class="font-pixel text-3xl sm:text-4xl text-amber-300 mt-1">${AppCore.formatARS(fin.foodSpent)}</p>
                    <p class="text-[11px] text-stone-400 mt-1">Tope: ${AppCore.formatARS(fin.foodLimit)} (Restan ${AppCore.formatARS(fin.foodLimit - fin.foodSpent)})</p>
                </div>
            </div>

            <!-- BARRA DE SALUD FINANCIERA (INGRESOS vs EGRESOS) -->
            <div class="retro-panel p-4 space-y-2">
                <div class="flex flex-wrap justify-between items-center text-xs">
                    <span class="font-bold text-white uppercase">
                        <i class="fa-solid fa-gauge-high text-acid mr-1"></i> Termómetro de Gasto Mensual (Consumido: ${expenseRatio}% de tus ingresos)
                    </span>
                    <span class="text-stone-400">Meta ideal: Gastar ≤ 80% y ahorrar ≥ 20%</span>
                </div>
                <div class="w-full h-4 bg-black border-2 border-stone-700 overflow-hidden flex">
                    <div class="h-full bg-acid transition-all duration-300" style="width: ${expenseRatio}%" title="Porcentaje gastado"></div>
                </div>
            </div>

            <!-- GRILLA PRINCIPAL: FORMULARIO DE CARGA + HISTORIAL Y DESGLOSE -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                <!-- COLUMNA IZQUIERDA (5 cols): CARGAR INGRESO / EGRESO + RADIOGRAFÍA POR RUBRO -->
                <div class="lg:col-span-5 space-y-6">
                    <div class="retro-panel p-5 space-y-4">
                        <div class="flex items-center justify-between border-b-2 border-stone-800 pb-3">
                            <h3 class="font-pixel text-2xl text-white">ANOTAR MOVIMIENTO</h3>
                            <div class="flex border-2 border-stone-700 bg-black text-xs">
                                <button type="button" onclick="FinanzasMod.setFormMode('EGRESO')"
                                        class="px-3 py-1 font-bold ${formMode === 'EGRESO' ? 'bg-rose-600 text-white' : 'text-stone-400 hover:text-white'}">
                                    - EGRESO
                                </button>
                                <button type="button" onclick="FinanzasMod.setFormMode('INGRESO')"
                                        class="px-3 py-1 font-bold ${formMode === 'INGRESO' ? 'bg-acid text-black' : 'text-stone-400 hover:text-white'}">
                                    + INGRESO
                                </button>
                            </div>
                        </div>

                        <form onsubmit="FinanzasMod.handleAddTransaction(event)" class="space-y-3 text-xs">
                            <div>
                                <label class="block text-stone-400 mb-1">
                                    ${formMode === 'INGRESO' ? 'Concepto del Ingreso' : 'Descripción del Gasto / Egreso'}
                                </label>
                                <input type="text" id="fin-desc" required
                                       placeholder="${formMode === 'INGRESO' ? 'Ej. Sueldo Metaphora, Proyecto freelance, Venta...' : 'Ej. Carga SUBE, Luz/Gas, Salida con amigos, Semillas...'}"
                                       class="w-full retro-input px-3 py-2">
                            </div>

                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-stone-400 mb-1">Monto (ARS)</label>
                                    <input type="number" id="fin-amount" required min="1" placeholder="Ej. 25000"
                                           class="w-full retro-input px-3 py-2 font-bold">
                                </div>
                                <div>
                                    <label class="block text-stone-400 mb-1">Rubro / Categoría</label>
                                    <select id="fin-cat" class="w-full retro-input px-2.5 py-2">
                                        ${categoriesList.map(c => `<option value="${c}">${c}</option>`).join('')}
                                    </select>
                                </div>
                            </div>

                            <button type="submit" class="w-full py-2.5 retro-btn ${formMode === 'INGRESO' ? 'retro-btn-acid' : 'bg-rose-700 text-white border-rose-400'} font-bold text-xs">
                                ${formMode === 'INGRESO' ? '+ REGISTRAR INGRESO AL BALANCE' : '- REGISTRAR GASTO Y MARCAR HÁBITO'}
                            </button>
                        </form>
                    </div>

                    <!-- Desglose por Categoría -->
                    <div class="retro-panel p-5 space-y-3">
                        <div class="flex items-center justify-between">
                            <h3 class="font-pixel text-2xl text-white">RADIOGRAFÍA DE TUS GASTOS</h3>
                            <span class="text-[10px] text-stone-400 uppercase">¿A dónde va la plata?</span>
                        </div>
                        <div class="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                            ${categoryBarsHtml}
                        </div>
                    </div>
                </div>

                <!-- COLUMNA DERECHA (7 cols): LIBRO DE MOVIMIENTOS -->
                <div class="lg:col-span-7 retro-panel p-5 flex flex-col justify-between space-y-4">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-stone-800 pb-3">
                        <div>
                            <h3 class="font-pixel text-2xl text-white">HISTORIAL DE INGRESOS Y EGRESOS</h3>
                            <p class="text-[11px] text-stone-400">Todos tus movimientos del mes ordenados del más reciente al más antiguo</p>
                        </div>
                        <div class="flex gap-1 text-xs">
                            <button onclick="FinanzasMod.setFilter('ALL')" class="retro-btn px-2.5 py-1 ${activeFilter === 'ALL' ? 'retro-btn-acid' : 'bg-black text-stone-400'}">TODOS</button>
                            <button onclick="FinanzasMod.setFilter('INGRESOS')" class="retro-btn px-2.5 py-1 ${activeFilter === 'INGRESOS' ? 'retro-btn-acid' : 'bg-black text-stone-400'}">+ INGRESOS</button>
                            <button onclick="FinanzasMod.setFilter('EGRESOS')" class="retro-btn px-2.5 py-1 ${activeFilter === 'EGRESOS' ? 'retro-btn-acid' : 'bg-black text-stone-400'}">- EGRESOS</button>
                        </div>
                    </div>

                    <div class="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                        <!-- Fila fija sincronizada de Meal-Prep -->
                        ${activeFilter !== 'INGRESOS' ? `
                            <div class="p-3 bg-amber-950/30 border-2 border-amber-500/60 flex items-center justify-between gap-2">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 bg-amber-500/20 border border-amber-400 text-amber-300 flex items-center justify-center text-xs font-bold">
                                        🍱
                                    </div>
                                    <div>
                                        <p class="text-xs sm:text-sm font-bold text-amber-200">Compras de Alimentación & Meal-Prep (Sincronizado)</p>
                                        <p class="text-[10px] text-amber-400/90">Suma automática de los ítems tildados en la sección Meal-Prep ($150k)</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="font-pixel text-xl text-amber-300">-${AppCore.formatARS(fin.foodSpent)}</span>
                                    <button onclick="AppCore.switchModule('mealprep')" class="retro-btn bg-black text-amber-300 px-2 py-1 text-[10px]">
                                        VER LISTA
                                    </button>
                                </div>
                            </div>
                        ` : ''}

                        ${movementsHtml || `<p class="text-xs text-stone-500 text-center py-6">No hay movimientos registrados en este filtro.</p>`}
                    </div>
                </div>
            </div>
        `;
    }

    // Registrar el módulo en el núcleo como vista #1 (Principal)
    AppCore.registerModule({
        id: 'finanzas',
        title: '1. FINANZAS & FLUJO DEL MES',
        icon: 'fa-sack-dollar',
        order: 1,
        init,
        render
    });

    return {
        setFormMode,
        setFilter,
        handleAddTransaction,
        deleteIncome,
        deleteExpense
    };
})();