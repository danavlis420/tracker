// =========================================================
// CORE.JS - Store Central, EventBus y Registro de Módulos
// =========================================================

window.STORAGE_KEY = 'dani_mealprep_finanzas_v1';
window.LS_GEMINI_KEY = 'mp_gemini_api_key';
window.LS_GITHUB_PAT = 'mp_github_pat';
window.LS_GIST_ID = 'mp_github_gist_id';
window.LS_GIST_AUTOSYNC = 'mp_gist_autosync';
window.LS_GIST_LAST_SYNC = 'mp_gist_last_sync';

window.AppCore = (function () {
    const modules = [];
    const listeners = {};
    let activeModuleId = 'finanzas';
    let autoSyncTimeout = null;
    let appInitialized = false;

    function getDefaultState() {
        return {
            foodBudgetLimit: 150000,
            monthlySavingsGoal: 100000,
            incomes: [
                { id: 'inc_1', desc: 'Sueldo / Ingreso Principal', amount: 650000, cat: 'Sueldo / Librería', date: '01/11/2026' }
            ],
            generalExpenses: [
                { id: 'g1', desc: 'Carga SUBE / Transporte mensual', amount: 18500, cat: 'Transporte / SUBE', date: '02/11/2026' },
                { id: 'g2', desc: 'Internet / Celular', amount: 24000, cat: 'Servicios & Fijos', date: '04/11/2026' }
            ],
            plate: {
                vegPct: 45,
                protPct: 30,
                carbPct: 25,
                vegKey: 'wok_mix',
                protKey: 'tiras_wok',
                carbKey: 'arroz_freezer',
                flavor: 'Estilo Chao Fan',
                title: 'Chao Fan Express de Cerdo o Pollo',
                time: '10 min'
            },
            freezer: [
                { id: 'milanesas', name: 'Milanesas listas (Pollo y Carne)', unit: 'porciones (2 u.)', count: 18, max: 20, icon: 'fa-drumstick-bite', color: 'rose' },
                { id: 'marinadas', name: 'Bolsitas Carne/Pollo/Cerdo Marinadas', unit: 'bolsitas 180g', count: 16, max: 18, icon: 'fa-bacon', color: 'rose' },
                { id: 'tartitas', name: 'Tartitas Individuales Pre-cocidas', unit: 'unidades', count: 9, max: 10, icon: 'fa-chart-pie', color: 'amber' },
                { id: 'arroz', name: 'Bloques de Arroz Pre-cocido', unit: 'porciones', count: 10, max: 12, icon: 'fa-bowl-rice', color: 'amber' },
                { id: 'mixWok', name: 'Bolsitas Mix Wok Crudo (Cebolla/Morrón/Zanahoria)', unit: 'bolsitas', count: 14, max: 16, icon: 'fa-carrot', color: 'emerald' },
                { id: 'acelga', name: 'Bollitos Acelga/Espinaca al Sésamo', unit: 'bollitos', count: 9, max: 10, icon: 'fa-leaf', color: 'emerald' }
            ],
            shoppingList: [
                { id: 's1', name: 'Suprema de pollo (Granja x 4 kg)', qty: '4 kg', price: 34000, block: 'Base Mensual', bought: true, destiny: '2,5 kg milanesas + 1,5 kg tiras wok y tartitas' },
                { id: 's2', name: 'Carne vacuna (Paleta / Roast beef / Cuadrada)', qty: '1,5 kg', price: 20400, block: 'Base Mensual', bought: true, destiny: '750g milanesas + 750g tiras finas bibimbap' },
                { id: 's3', name: 'Cerdo (Bondiola o Carré deshuesado)', qty: '1,5 kg', price: 13600, block: 'Base Mensual', bought: true, destiny: 'Tiras/cubitos para chao fan y lo mein' },
                { id: 's4', name: 'Huevos en granja/feria', qty: '2 maples (60 u.)', price: 12000, block: 'Base Mensual', bought: true, destiny: 'Tartitas, empanado, chao fan y bibimbap' },
                { id: 's5', name: 'Queso cremoso o Port Salut en trozo', qty: '1 kg', price: 10000, block: 'Base Mensual', bought: false, destiny: 'Bastones para tartitas y gratinados' },
                { id: 's6', name: 'Arroz (2kg doble carolina + 1kg largo) y Fideos (4 paq)', qty: '5 kg total', price: 20000, block: 'Base Mensual', bought: false, destiny: 'Base chao fan, bibimbap, lo mein y guarniciones' },
                { id: 's7', name: 'Harina 0000 (2kg) y Pan Rallado suelto (2kg)', qty: '4 kg total', price: 10000, block: 'Base Mensual', bought: false, destiny: 'Masa casera de tartitas y rebozado de milanesas' },
                { id: 's8', name: 'Verdulería Tanda 1 (Acelga, cebolla, morrón, zanahoria, repollo)', qty: '~6 kg surtidos', price: 11000, block: 'Verdulería', bought: true, destiny: 'Mix wok freezer, bollitos verdes y rellenos' },
                { id: 's9', name: 'Verdulería Tanda 2 (Reposición frescos quincenal)', qty: '~5 kg surtidos', price: 11000, block: 'Verdulería', bought: false, destiny: 'Ensaladas frescas, verdeo y papas rústicas' },
                { id: 's10', name: 'Fondo de Sabores (Soja, salsa ostras, jengibre, sésamo, aceite)', qty: 'Reposición', price: 8000, block: 'Base Mensual', bought: false, destiny: 'Marinadas orientales y aderezos' }
            ],
            habits: [
                { id: 'h1', name: 'Almuerzo/Cena con regla 45% Verdura / 30% Prote / 25% Carbo', days: [true, true, false, false, false, false, false] },
                { id: 'h2', name: 'Cocinar en 15 min usando mi Freezer (Cero Delivery)', days: [true, true, true, false, false, false, false] },
                { id: 'h3', name: 'Sacar porción del freezer la noche anterior o a la mañana', days: [true, false, true, false, false, false, false] },
                { id: 'h4', name: 'Registrar ingresos, compras y gastos del día', days: [true, true, false, false, false, false, false] },
                { id: 'h5', name: 'Entrenamiento / Movimiento físico del día', days: [false, true, false, true, false, false, false] }
            ],
            customTrackers: [
                {
                    id: 'ct_gym',
                    title: 'GYM & PESO CORPORAL',
                    icon: 'fa-dumbbell',
                    unit: 'sesiones esta sem',
                    current: 2,
                    target: 3,
                    notes: 'Meta: subir de 64kg a 75kg • Rutina 3 días/sem',
                    logs: ['Lun: Tren Superior + Comida post-entreno', 'Mié: Piernas & Core']
                },
                {
                    id: 'ct_cultivo',
                    title: 'BITÁCORA INDOOR / LST',
                    icon: 'fa-seedling',
                    unit: 'controles sem',
                    current: 3,
                    target: 4,
                    notes: 'Chequeo de altura LED, riego, pH y tensión LST',
                    logs: ['Mar: Riego desclorado + ajuste de ramas laterales']
                }
            ]
        };
    }

    let state = loadState();

    function loadState() {
        try {
            const raw = localStorage.getItem(window.STORAGE_KEY);
            const defaults = getDefaultState();
            if (!raw) return defaults;
            const parsed = JSON.parse(raw);

            if (parsed.customApiKey && !localStorage.getItem(window.LS_GEMINI_KEY)) {
                localStorage.setItem(window.LS_GEMINI_KEY, parsed.customApiKey);
            }
            delete parsed.customApiKey;

            return {
                ...defaults,
                ...parsed,
                incomes: Array.isArray(parsed.incomes) ? parsed.incomes : defaults.incomes,
                customTrackers: Array.isArray(parsed.customTrackers) ? parsed.customTrackers : defaults.customTrackers
            };
        } catch (e) {
            return getDefaultState();
        }
    }

    function saveState(skipAutoSync = false) {
        try {
            const cleanState = { ...state };
            delete cleanState.customApiKey;
            localStorage.setItem(window.STORAGE_KEY, JSON.stringify(cleanState));
            updateGlobalMetrics();
            emit('state:saved', state);

            const autoSyncEnabled = localStorage.getItem(window.LS_GIST_AUTOSYNC) === 'true';
            const pat = localStorage.getItem(window.LS_GITHUB_PAT);
            const gistId = localStorage.getItem(window.LS_GIST_ID);
            if (!skipAutoSync && autoSyncEnabled && pat && gistId && window.SyncAI) {
                clearTimeout(autoSyncTimeout);
                autoSyncTimeout = setTimeout(() => {
                    window.SyncAI.pushToGist(true);
                }, 1800);
            }
        } catch (e) {
            console.error('Error guardando estado:', e);
        }
    }

    function on(event, handler) {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(handler);
    }

    function emit(event, payload) {
        if (!listeners[event]) return;
        listeners[event].forEach(fn => fn(payload));
    }

    function registerModule(modConfig) {
        const existingIdx = modules.findIndex(m => m.id === modConfig.id);
        if (existingIdx >= 0) modules[existingIdx] = modConfig;
        else modules.push(modConfig);
        modules.sort((a, b) => (a.order || 99) - (b.order || 99));
    }

    function switchModule(modId) {
        activeModuleId = modId;
        renderNavigation();
        modules.forEach(m => {
            const sec = document.getElementById(`module-view-${m.id}`);
            if (sec) {
                if (m.id === activeModuleId) {
                    sec.classList.remove('hidden');
                    if (typeof m.render === 'function') m.render();
                } else {
                    sec.classList.add('hidden');
                }
            }
        });
    }

    function renderNavigation() {
        const nav = document.getElementById('main-module-nav');
        if (!nav || modules.length === 0) return;

        nav.innerHTML = modules.map(m => {
            const isActive = m.id === activeModuleId;
            return `
                <button type="button" onclick="AppCore.switchModule('${m.id}')"
                        class="retro-btn px-4 py-2 flex items-center gap-2 ${isActive ? 'tab-retro-active' : 'bg-stone-900 text-stone-200'}">
                    <i class="fa-solid ${m.icon}"></i>
                    <span>${m.title}</span>
                </button>
            `;
        }).join('');
    }

    function getFinancialSummary() {
        const totalIncome = state.incomes.reduce((acc, i) => acc + Number(i.amount || 0), 0);
        const foodSpent = state.shoppingList
            .filter(item => item.bought)
            .reduce((acc, item) => acc + Number(item.price || 0), 0);
        const otherExpenses = state.generalExpenses.reduce((acc, g) => acc + Number(g.amount || 0), 0);
        const totalExpenses = foodSpent + otherExpenses;
        const netBalance = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? Math.round((netBalance / totalIncome) * 100) : 0;

        return {
            totalIncome,
            foodSpent,
            foodLimit: state.foodBudgetLimit || 150000,
            otherExpenses,
            totalExpenses,
            netBalance,
            savingsRate
        };
    }

    function formatARS(num) {
        const val = Number(num || 0);
        const prefix = val < 0 ? '-$' : '$';
        return prefix + Math.abs(val).toLocaleString('es-AR');
    }

    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        const borderClass = type === 'success'
            ? 'border-acid text-acid'
            : type === 'warning'
            ? 'border-amber-400 text-amber-300'
            : 'border-sky-400 text-sky-300';

        toast.className = `retro-box bg-black px-4 py-2.5 border-2 ${borderClass} text-xs font-bold flex items-center gap-2`;
        toast.innerHTML = `<span>[SYS]</span> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 250);
        }, 3200);
    }

    function updateGlobalMetrics() {
        const fin = getFinancialSummary();
        const totalFreezer = state.freezer.reduce((a, b) => a + b.count, 0);

        let totalChecks = 0;
        const totalPossible = state.habits.length * 7;
        state.habits.forEach(h => totalChecks += h.days.filter(Boolean).length);
        const habitPct = totalPossible > 0 ? Math.round((totalChecks / totalPossible) * 100) : 0;

        const netEl = document.getElementById('header-net-balance');
        if (netEl) {
            netEl.textContent = formatARS(fin.netBalance);
            netEl.className = `hit-counter ${fin.netBalance >= 0 ? 'text-acid' : 'text-rose-400'}`;
        }

        const foodEl = document.getElementById('header-food-budget');
        if (foodEl) foodEl.textContent = `${formatARS(fin.foodSpent)} / ${formatARS(fin.foodLimit)}`;

        const frzEl = document.getElementById('header-freezer-count');
        if (frzEl) frzEl.textContent = `${totalFreezer} u.`;

        const habEl = document.getElementById('header-habit-rate');
        if (habEl) habEl.textContent = `${habitPct}%`;

        const mq = document.getElementById('marquee-live-text');
        if (mq) {
            mq.textContent = `+++ FLUJO DEL MES: INGRESOS ${formatARS(fin.totalIncome)} | EGRESOS TOTALES ${formatARS(fin.totalExpenses)} | SALDO DISPONIBLE: ${formatARS(fin.netBalance)} (${fin.savingsRate}% MARGEN) +++ PRESUPUESTO MEAL-PREP: ${formatARS(fin.foodSpent)} DE ${formatARS(fin.foodLimit)} +++ STOCK EN FREEZER: ${totalFreezer} MÓDULOS LISTOS +++ CONSTANCIA DE HÁBITOS: ${habitPct}% +++`;
        }
    }

    function toggleCRT() {
        document.body.classList.toggle('crt-scanlines');
    }

    function initApp() {
        const viewport = document.getElementById('app-viewport');
        if (!viewport || appInitialized) return;
        appInitialized = true;

        viewport.innerHTML = modules.map(m => `
            <section id="module-view-${m.id}" class="${m.id === activeModuleId ? '' : 'hidden'} space-y-6"></section>
        `).join('');

        modules.forEach(m => {
            if (typeof m.init === 'function') m.init();
            if (typeof m.render === 'function') m.render();
        });

        renderNavigation();
        updateGlobalMetrics();
    }

    return {
        getState: () => state,
        setState: (newState, skipSync = false) => {
            state = { ...getDefaultState(), ...newState };
            saveState(skipSync);
            modules.forEach(m => { if (typeof m.render === 'function') m.render(); });
        },
        resetToDefault: () => {
            state = getDefaultState();
            saveState();
            modules.forEach(m => { if (typeof m.render === 'function') m.render(); });
        },
        saveState,
        on,
        emit,
        registerModule,
        switchModule,
        renderAllModules: () => modules.forEach(m => { if (typeof m.render === 'function') m.render(); }),
        getFinancialSummary,
        formatARS,
        showToast,
        toggleCRT,
        initApp
    };
})();