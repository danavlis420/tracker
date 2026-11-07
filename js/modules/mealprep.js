// =========================================================
// MÓDULO 2: MEAL-PREP, CONSTRUCTOR DE PLATO (45/30/25) & FREEZER
// =========================================================

const MealPrepMod = (function () {
    let subView = 'AMBOS'; // AMBOS | PLATO | FREEZER

    const PRESET_MEALS = [
        {
            id: 'chaofan',
            title: 'Chao Fan Express de Cerdo o Pollo',
            flavor: 'Estilo Chao Fan',
            time: '10 min',
            vegPct: 45, protPct: 30, carbPct: 25,
            vegKey: 'wok_mix', protKey: 'tiras_wok', carbKey: 'arroz_freezer',
            desc: '1 bloque de arroz del freezer + 1 bolsita de cerdo/pollo en tiras + abundante mix wok congelado y repollo en juliana + huevo revuelto, soja, salsa de ostras y verdeo.',
            stockUsed: { mixWok: 1, marinadas: 1, arroz: 1 }
        },
        {
            id: 'bibimbap',
            title: 'Bowl Bibimbap de Carne Vacuna',
            flavor: 'Estilo Bibimbap',
            time: '12 min',
            vegPct: 45, protPct: 30, carbPct: 25,
            vegKey: 'acelga_sesamo', protKey: 'tiras_wok', carbKey: 'arroz_carolina',
            desc: 'Colchón de arroz doble carolina (25%) + bollito descongelado de acelga al sésamo, zanahoria y repollo salteado (45%) + tiras de carne con ajo y soja + 1 huevo a la plancha (30%).',
            stockUsed: { acelga: 1, marinadas: 1 }
        },
        {
            id: 'lomein',
            title: 'Wok Lo Mein de Pollo y Vegetales',
            flavor: 'Estilo Lo Mein',
            time: '12 min',
            vegPct: 45, protPct: 30, carbPct: 25,
            vegKey: 'wok_mix', protKey: 'tiras_wok', carbKey: 'fideos_lomein',
            desc: 'Mitad del wok lleno de mix de vegetales congelados y repollo fileteado (45%) + 1 bolsita de pollo marinado en jengibre y soja (30%) + porción controlada de tallarines salteados (25%).',
            stockUsed: { mixWok: 1, marinadas: 1 }
        },
        {
            id: 'milanesas_plato',
            title: 'Milanesas al Horno + Super Ensalada + Arroz',
            flavor: 'Clásico Argentino',
            time: '15 min',
            vegPct: 45, protPct: 30, carbPct: 25,
            vegKey: 'ensalada_repollo', protKey: 'milanesas', carbKey: 'arroz_carolina',
            desc: '2 milanesas caseras directo del freezer a asadera bien caliente (30%) + medio plato de ensalada fresca de repollo y zanahoria con limón (45%) + 1/4 plato de arroz o papas rústicas (25%).',
            stockUsed: { milanesas: 1 }
        },
        {
            id: 'tartita_bowl',
            title: 'Tartita Rústica Proteica + Ensalada Fresca',
            flavor: 'Clásico Argentino',
            time: '12 min',
            vegPct: 45, protPct: 30, carbPct: 25,
            vegKey: 'relleno_tarta', protKey: 'tarta_proteica', carbKey: 'masa_tartita',
            desc: '1 tartita individual del freezer rellena de acelga, pollo, huevo y queso port salut + una guarnición rápida de repollo o verdes para asegurar el 45% de vegetales del almuerzo.',
            stockUsed: { tartitas: 1 }
        },
        {
            id: 'salteado_power',
            title: 'Salteado Oriental Proteico (50% Verdura)',
            flavor: 'Estilo Chao Fan',
            time: '10 min',
            vegPct: 50, protPct: 30, carbPct: 20,
            vegKey: 'wok_mix', protKey: 'tiras_wok', carbKey: 'arroz_freezer',
            desc: 'Ideal para días livianos: mitad completa del plato de mix wok y repollo salteado al vapor/sartén (50%) + tiras de carne o cerdo con 1 huevo (30%) + medio bloque de arroz (20%).',
            stockUsed: { mixWok: 1, marinadas: 1, arroz: 1 }
        }
    ];

    function handleProportionSlider(changedType, rawVal) {
        let val = parseInt(rawVal, 10);
        const state = AppCore.getState();
        let { vegPct, protPct, carbPct } = state.plate;

        if (changedType === 'veg') {
            vegPct = val;
            carbPct = 100 - vegPct - protPct;
            if (carbPct < 10) {
                carbPct = 10;
                protPct = 100 - vegPct - carbPct;
            }
        } else if (changedType === 'prot') {
            protPct = val;
            carbPct = 100 - vegPct - protPct;
            if (carbPct < 10) {
                carbPct = 10;
                vegPct = 100 - protPct - carbPct;
            }
        }

        state.plate.vegPct = vegPct;
        state.plate.protPct = protPct;
        state.plate.carbPct = carbPct;
        AppCore.saveState();
        render();
    }

    function resetPlateProportions() {
        const state = AppCore.getState();
        state.plate.vegPct = 45;
        state.plate.protPct = 30;
        state.plate.carbPct = 25;
        AppCore.saveState();
        render();
        AppCore.showToast('Regla restaurada: 45% Verduras / 30% Proteína / 25% Carbo');
    }

    function updateCustomPlate() {
        const state = AppCore.getState();
        state.plate.vegKey = document.getElementById('select-veg').value;
        state.plate.protKey = document.getElementById('select-prot').value;
        state.plate.carbKey = document.getElementById('select-carb').value;
        state.plate.flavor = document.getElementById('select-flavor').value;
        state.plate.title = 'Plato Combinado Custom';
        state.plate.time = '12 min';
        AppCore.saveState();
        render();
    }

    function loadPresetMeal(presetId) {
        const preset = PRESET_MEALS.find(p => p.id === presetId);
        if (!preset) return;
        const state = AppCore.getState();
        state.plate = {
            vegPct: preset.vegPct,
            protPct: preset.protPct,
            carbPct: preset.carbPct,
            vegKey: preset.vegKey,
            protKey: preset.protKey,
            carbKey: preset.carbKey,
            flavor: preset.flavor,
            title: preset.title,
            time: preset.time
        };
        AppCore.saveState();
        render();
        AppCore.showToast(`Cargado en el plato: ${preset.title}`);
    }

    function logCurrentPlateMeal() {
        const state = AppCore.getState();
        const { vegKey, protKey, carbKey } = state.plate;
        const vegStockMap = { wok_mix: 'mixWok', acelga_sesamo: 'acelga', ensalada_repollo: null, relleno_tarta: null };
        const protStockMap = { tiras_wok: 'marinadas', milanesas: 'milanesas', tarta_proteica: 'tartitas', huevos_queso: null };
        const carbStockMap = { arroz_freezer: 'arroz', arroz_carolina: null, fideos_lomein: null, masa_tartita: null, papas_rusticas: null };

        const toDeduct = [vegStockMap[vegKey], protStockMap[protKey], carbStockMap[carbKey]].filter(Boolean);
        let deductedNames = [];

        toDeduct.forEach(modId => {
            const item = state.freezer.find(f => f.id === modId);
            if (item && item.count > 0) {
                item.count -= 1;
                deductedNames.push(item.name.split(' ')[0]);
            }
        });

        AppCore.emit('meal:cooked', { deductedNames });
        AppCore.saveState();
        render();

        const msg = deductedNames.length > 0
            ? `¡A comer! Se descontó (${deductedNames.join(', ')}) del freezer y se marcó tu hábito.`
            : `¡Plato registrado! Se marcó tu hábito 45/30/25 del día.`;
        AppCore.showToast(msg);
    }

    function cookPresetDirectly(presetId) {
        loadPresetMeal(presetId);
        logCurrentPlateMeal();
    }

    function adjustFreezerStock(modId, delta) {
        const state = AppCore.getState();
        const item = state.freezer.find(f => f.id === modId);
        if (!item) return;
        item.count = Math.max(0, item.count + delta);
        AppCore.saveState();
        render();
    }

    function refillFullBatch() {
        const state = AppCore.getState();
        state.freezer.forEach(mod => { mod.count = mod.max; });
        AppCore.saveState();
        render();
        AppCore.showToast('¡Stock de producción cargado al 100% en el freezer!');
    }

    function toggleShoppingItem(id) {
        const state = AppCore.getState();
        const item = state.shoppingList.find(i => i.id === id);
        if (!item) return;
        item.bought = !item.bought;
        AppCore.emit('shopping:updated', item);
        if (item.bought) AppCore.emit('transaction:added', { type: 'MEALPREP_BUY', amount: item.price });
        AppCore.saveState();
        render();
    }

    function updateShoppingItemPrice(id, newPrice) {
        const state = AppCore.getState();
        const item = state.shoppingList.find(i => i.id === id);
        if (!item) return;
        item.price = Math.max(0, parseInt(newPrice, 10) || 0);
        AppCore.emit('shopping:updated', item);
        AppCore.saveState();
        render();
        AppCore.showToast(`Precio actualizado: ${item.name}`);
    }

    function deleteShoppingItem(id) {
        const state = AppCore.getState();
        state.shoppingList = state.shoppingList.filter(i => i.id !== id);
        AppCore.emit('shopping:updated');
        AppCore.saveState();
        render();
    }

    function markAllShopping(status) {
        const state = AppCore.getState();
        state.shoppingList.forEach(i => i.bought = status);
        AppCore.emit('shopping:updated');
        AppCore.saveState();
        render();
        AppCore.showToast(status ? 'Lista completa marcada como comprada' : 'Compras desmarcadas');
    }

    function addCustomFoodItem(e) {
        e.preventDefault();
        const name = document.getElementById('new-food-name').value.trim();
        const qty = document.getElementById('new-food-qty').value.trim();
        const price = parseInt(document.getElementById('new-food-price').value, 10) || 0;
        if (!name || price <= 0) return;

        const state = AppCore.getState();
        state.shoppingList.push({
            id: 's_' + Date.now(),
            name,
            qty,
            price,
            block: 'Extra / Reposición',
            bought: true,
            destiny: 'Agregado manualmente'
        });

        AppCore.emit('shopping:updated');
        AppCore.emit('transaction:added', { type: 'MEALPREP_BUY', amount: price });
        AppCore.saveState();
        render();
        AppCore.showToast(`Sumado a compras de alimentación: ${name}`);
    }

    function editMonthlyBudgetLimit() {
        const state = AppCore.getState();
        const nextLimit = state.foodBudgetLimit === 150000 ? 180000 : state.foodBudgetLimit === 180000 ? 200000 : 150000;
        state.foodBudgetLimit = nextLimit;
        AppCore.emit('shopping:updated');
        AppCore.saveState();
        render();
        AppCore.showToast(`Tope mensual de comida ajustado a ${AppCore.formatARS(nextLimit)}`);
    }

    function getStockText(moduleId) {
        if (!moduleId) return 'Insumo de heladera/alacena (no gasta freezer)';
        const item = AppCore.getState().freezer.find(f => f.id === moduleId);
        return item ? `Quedan ${item.count} ${item.unit} en freezer` : '';
    }

    function generateDynamicInstructions(vegKey, protKey, carbKey, flavor, vegPct, protPct, carbPct) {
        if (protKey === 'tarta_proteica') {
            return `Llevá la tartita individual del freezer directo al horno o sartén tapada a fuego corona por 12 minutos para que la base quede bien crocante. Acompañala con un bowl mediano de repollo y zanahoria o verdes frescos para completar el ${vegPct}% de vegetales.`;
        }
        if (protKey === 'milanesas') {
            return `Precalentá la asadera en el horno 3 minutos. Poné las 2 milanesas directo del freezer con un hilo de aceite (7 min por lado). Mientras tanto, armá medio plato (${vegPct}%) de vegetales y sumá tu cuarto de plato (${carbPct}%) de guarnición (${flavor}).`;
        }
        return `Calentá el wok a fuego bien fuerte. Salteá primero la proteína (${protPct}% del plato) por 4 min. Sumá los vegetales directo sin descongelar (${vegPct}% del plato) para que queden crocantes, incorporá el carbohidrato (${carbPct}%) y terminá con el aderezo ${flavor}.`;
    }

    function render() {
        const container = document.getElementById('module-view-mealprep');
        if (!container) return;

        const state = AppCore.getState();
        const fin = AppCore.getFinancialSummary();
        const { vegPct, protPct, carbPct, vegKey, protKey, carbKey, flavor, title, time } = state.plate;

        const deg1 = vegPct;
        const deg2 = vegPct + protPct;
        const isBalanced = vegPct >= 40 && vegPct <= 55 && protPct >= 25 && carbPct <= 30;

        const vegStockMap = { wok_mix: 'mixWok', acelga_sesamo: 'acelga', ensalada_repollo: null, relleno_tarta: 'acelga' };
        const protStockMap = { tiras_wok: 'marinadas', milanesas: 'milanesas', tarta_proteica: 'tartitas', huevos_queso: null };
        const carbStockMap = { arroz_freezer: 'arroz', arroz_carolina: null, fideos_lomein: null, masa_tartita: null, papas_rusticas: null };

        const foodPct = Math.min(100, Math.round((fin.foodSpent / fin.foodLimit) * 100));
        const totalModules = state.freezer.reduce((a, b) => a + b.count, 0);

        container.innerHTML = `
            <!-- BARRA INTERNA DEL MÓDULO MEAL-PREP -->
            <div class="retro-panel p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-l-4 border-l-amber-400">
                <div>
                    <span class="text-[10px] font-bold px-2 py-0.5 bg-amber-400 text-black uppercase">MÓDULO NUTRICIÓN & STOCK</span>
                    <h2 class="font-pixel text-3xl text-white mt-1">MEAL-PREP 10-15 MIN (REGLA 45/30/25) & FREEZER ($150K)</h2>
                </div>
                <div class="flex gap-1.5 text-xs">
                    <button onclick="SyncAI.askGeminiQuick('¿Qué almuerzo o cena me recomendás armar hoy en 10 minutos según lo que me queda en el freezer respetando el 45/30/25?')"
                            class="retro-btn retro-btn-purple px-3 py-1.5 font-bold">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> ¿Qué cocino hoy?
                    </button>
                </div>
            </div>

            <!-- BLOQUE A: VISUALIZADOR DE PLATO + COMBINADOR DE FREEZER -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                <!-- Visualizador Fotolog Gold Frame (5 cols) -->
                <div class="lg:col-span-5 retro-panel p-5 flex flex-col justify-between space-y-5">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="font-pixel text-2xl text-white">VISUALIZADOR DE PLATO</h3>
                            <p class="text-[11px] text-stone-400">Proporción nutricional en vivo</p>
                        </div>
                        <span class="px-2.5 py-1 text-[10px] font-bold border ${isBalanced ? 'bg-acid-dark text-acid border-acid' : 'bg-amber-950 text-amber-300 border-amber-400'}">
                            ${isBalanced ? '✓ REGLA 45/30/25 OK' : '! AJUSTAR PROPORCIÓN'}
                        </span>
                    </div>

                    <div class="flex flex-col items-center justify-center py-2">
                        <div class="relative w-56 h-56 rounded-full p-3 bg-black border-4 border-stone-600 plate-retro-shadow flex items-center justify-center">
                            <div class="w-full h-full rounded-full flex items-center justify-center"
                                 style="background: conic-gradient(#76ff03 0% ${deg1}%, #ff4757 ${deg1}% ${deg2}%, #ffab00 ${deg2}% 100%);">
                                <div class="w-28 h-28 rounded-full bg-black border-2 border-stone-600 flex flex-col items-center justify-center text-center p-2">
                                    <span class="text-[9px] uppercase font-bold text-purple-300">${flavor}</span>
                                    <span class="text-[11px] font-bold text-white leading-tight mt-0.5 line-clamp-2">${title}</span>
                                    <span class="text-[10px] text-acid mt-1">${time}</span>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-3 gap-2 w-full mt-5 text-center text-xs">
                            <div class="bg-black border border-acid p-2">
                                <span class="font-pixel text-xl text-acid">${vegPct}%</span>
                                <p class="text-[10px] text-stone-300">VERDURAS</p>
                            </div>
                            <div class="bg-black border border-rose-500 p-2">
                                <span class="font-pixel text-xl text-rose-400">${protPct}%</span>
                                <p class="text-[10px] text-stone-300">PROTEÍNAS</p>
                            </div>
                            <div class="bg-black border border-amber-400 p-2">
                                <span class="font-pixel text-xl text-amber-300">${carbPct}%</span>
                                <p class="text-[10px] text-stone-300">CARBOS</p>
                            </div>
                        </div>
                    </div>

                    <!-- Sliders -->
                    <div class="bg-black p-3 border border-stone-800 space-y-2 text-xs">
                        <div class="flex justify-between">
                            <span class="text-stone-300 font-bold">Ajustar Proporción</span>
                            <button onclick="MealPrepMod.resetPlateProportions()" class="text-acid underline text-[11px]">Reset 45/30/25</button>
                        </div>
                        <div>
                            <div class="flex justify-between text-[11px] mb-1">
                                <span>🥦 Verduras</span>
                                <span class="text-acid font-bold">${vegPct}%</span>
                            </div>
                            <input type="range" min="30" max="60" step="5" value="${vegPct}"
                                   oninput="MealPrepMod.handleProportionSlider('veg', this.value)"
                                   class="w-full accent-lime-400 cursor-pointer">
                        </div>
                        <div>
                            <div class="flex justify-between text-[11px] mb-1">
                                <span>🥩 Proteínas</span>
                                <span class="text-rose-400 font-bold">${protPct}%</span>
                            </div>
                            <input type="range" min="20" max="45" step="5" value="${protPct}"
                                   oninput="MealPrepMod.handleProportionSlider('prot', this.value)"
                                   class="w-full accent-rose-500 cursor-pointer">
                        </div>
                    </div>
                </div>

                <!-- Selector de Módulos del Freezer (7 cols) -->
                <div class="lg:col-span-7 retro-panel p-5 flex flex-col justify-between space-y-4">
                    <div>
                        <h3 class="font-pixel text-2xl text-white">COMBINADOR DE MÓDULOS (FREEZER + ALACENA)</h3>
                        <p class="text-xs text-stone-400">Armá tu plato personalizado o elegí una de las 6 tarjetas pre-armadas abajo</p>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <!-- 1. Verduras -->
                        <div class="bg-black border-2 border-stone-800 p-3 space-y-2">
                            <label class="font-bold text-acid block">1. BASE VERDURAS (~45-50%)</label>
                            <select id="select-veg" onchange="MealPrepMod.updateCustomPlate()" class="w-full retro-input p-2 text-xs">
                                <option value="wok_mix" ${vegKey === 'wok_mix' ? 'selected' : ''}>Mix Wok Congelado + Repollo en juliana</option>
                                <option value="acelga_sesamo" ${vegKey === 'acelga_sesamo' ? 'selected' : ''}>Bollito Acelga al sésamo + Zanahoria</option>
                                <option value="ensalada_repollo" ${vegKey === 'ensalada_repollo' ? 'selected' : ''}>Super Ensalada de Repollo, Zanahoria y Verdeo</option>
                                <option value="relleno_tarta" ${vegKey === 'relleno_tarta' ? 'selected' : ''}>Relleno Acelga y Cebolla (en Tartita) + Verdes</option>
                            </select>
                            <p class="text-[10px] text-sky-300">❄ ${getStockText(vegStockMap[vegKey])}</p>
                        </div>

                        <!-- 2. Proteínas -->
                        <div class="bg-black border-2 border-stone-800 p-3 space-y-2">
                            <label class="font-bold text-rose-400 block">2. PROTEÍNA PRINCIPAL (~30%)</label>
                            <select id="select-prot" onchange="MealPrepMod.updateCustomPlate()" class="w-full retro-input p-2 text-xs">
                                <option value="tiras_wok" ${protKey === 'tiras_wok' ? 'selected' : ''}>Bolsita Carne/Pollo/Cerdo en tiras + 1 Huevo</option>
                                <option value="milanesas" ${protKey === 'milanesas' ? 'selected' : ''}>2 Milanesas caseras (Pollo o Carne) al horno</option>
                                <option value="tarta_proteica" ${protKey === 'tarta_proteica' ? 'selected' : ''}>Pollo + Huevo + Queso Port Salut (en Tartita)</option>
                                <option value="huevos_queso" ${protKey === 'huevos_queso' ? 'selected' : ''}>3 Huevos revueltos/plancha + Queso Port Salut</option>
                            </select>
                            <p class="text-[10px] text-sky-300">❄ ${getStockText(protStockMap[protKey])}</p>
                        </div>

                        <!-- 3. Carbohidratos -->
                        <div class="bg-black border-2 border-stone-800 p-3 space-y-2">
                            <label class="font-bold text-amber-300 block">3. CARBOHIDRATO (~25%)</label>
                            <select id="select-carb" onchange="MealPrepMod.updateCustomPlate()" class="w-full retro-input p-2 text-xs">
                                <option value="arroz_freezer" ${carbKey === 'arroz_freezer' ? 'selected' : ''}>Bloque Arroz pre-cocido freezer (Chao Fan)</option>
                                <option value="arroz_carolina" ${carbKey === 'arroz_carolina' ? 'selected' : ''}>Arroz Doble Carolina tibio (Bibimbap)</option>
                                <option value="fideos_lomein" ${carbKey === 'fideos_lomein' ? 'selected' : ''}>Fideos Tallarines salteados (Lo Mein)</option>
                                <option value="masa_tartita" ${carbKey === 'masa_tartita' ? 'selected' : ''}>Masa casera rápida de Tartita individual</option>
                                <option value="papas_rusticas" ${carbKey === 'papas_rusticas' ? 'selected' : ''}>Papas rústicas al horno con piel</option>
                            </select>
                            <p class="text-[10px] text-sky-300">❄ ${getStockText(carbStockMap[carbKey])}</p>
                        </div>

                        <!-- 4. Perfil de Sabor -->
                        <div class="bg-black border-2 border-stone-800 p-3 space-y-2">
                            <label class="font-bold text-purple-300 block">4. PERFIL DE SABOR / TOQUE FINAL</label>
                            <select id="select-flavor" onchange="MealPrepMod.updateCustomPlate()" class="w-full retro-input p-2 text-xs">
                                <option value="Estilo Chao Fan" ${flavor === 'Estilo Chao Fan' ? 'selected' : ''}>Estilo Chao Fan (Soja, ostras, jengibre, verdeo)</option>
                                <option value="Estilo Bibimbap" ${flavor === 'Estilo Bibimbap' ? 'selected' : ''}>Estilo Bibimbap (Ajo, soja, sésamo y yema)</option>
                                <option value="Estilo Lo Mein" ${flavor === 'Estilo Lo Mein' ? 'selected' : ''}>Estilo Lo Mein Oriental (Soja, ostras, ajo)</option>
                                <option value="Clásico Argentino" ${flavor === 'Clásico Argentino' ? 'selected' : ''}>Clásico Argentino (Ajo, perejil, mostaza, limón)</option>
                            </select>
                            <p class="text-[10px] text-stone-400">🔥 Sartén/Wok fuerte o asadera precalentada</p>
                        </div>
                    </div>

                    <!-- Instrucciones Express -->
                    <div class="flog-frame p-3.5 space-y-1 text-xs">
                        <div class="flex justify-between items-center">
                            <span class="font-bold text-amber-300 uppercase">⚡ PASO A PASO EXPRESS (10-15 MIN)</span>
                            <span class="text-[10px] bg-stone-900 px-2 py-0.5 text-acid border border-stone-700">~$2.650 ARS / plato</span>
                        </div>
                        <p class="text-stone-200 leading-relaxed">
                            ${generateDynamicInstructions(vegKey, protKey, carbKey, flavor, vegPct, protPct, carbPct)}
                        </p>
                    </div>

                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <span class="text-[11px] text-stone-400">
                            Descuenta los módulos usados de tu <strong>Freezer</strong> y tilda el <strong>hábito diario</strong>.
                        </span>
                        <button onclick="MealPrepMod.logCurrentPlateMeal()" class="retro-btn retro-btn-acid px-5 py-2.5 text-xs font-bold">
                            <i class="fa-solid fa-fire-burner"></i> COCINAR Y DESCONTAR DEL FREEZER
                        </button>
                    </div>
                </div>
            </div>

            <!-- 6 ALTERNATIVAS PRE-ARMADAS -->
            <div class="space-y-3">
                <h3 class="font-pixel text-2xl text-white">
                    6 RECETAS BASE PRE-ARMADAS (CHAO FAN, BIBIMBAP, LO MEIN, MILANESAS & TARTITAS)
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${PRESET_MEALS.map(meal => `
                        <div class="retro-panel p-4 flex flex-col justify-between space-y-3">
                            <div class="space-y-1.5">
                                <div class="flex justify-between items-center text-[10px]">
                                    <span class="px-2 py-0.5 bg-purple-950 text-purple-300 border border-purple-500 font-bold">${meal.flavor}</span>
                                    <span class="text-acid font-bold">${meal.time}</span>
                                </div>
                                <h4 class="font-bold text-sm text-white">${meal.title}</h4>
                                <p class="text-xs text-stone-400 leading-relaxed">${meal.desc}</p>
                            </div>
                            <div class="space-y-2 pt-2 border-t border-stone-800 text-xs">
                                <div class="flex justify-between text-[11px] font-bold">
                                    <span class="text-acid">🥦 ${meal.vegPct}%</span>
                                    <span class="text-rose-400">🥩 ${meal.protPct}%</span>
                                    <span class="text-amber-300">🍚 ${meal.carbPct}%</span>
                                </div>
                                <div class="flex gap-2">
                                    <button onclick="MealPrepMod.loadPresetMeal('${meal.id}')" class="flex-1 retro-btn bg-black text-stone-200 py-1.5 text-xs">
                                        Cargar en Plato
                                    </button>
                                    <button onclick="MealPrepMod.cookPresetDirectly('${meal.id}')" class="retro-btn retro-btn-acid px-3 py-1.5 text-xs">
                                        Cocinar
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- BLOQUE B: STOCK DEL FREEZER + LISTA DE COMPRAS $150.000 ARS -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                <!-- Inventario Freezer (5 cols) -->
                <div class="lg:col-span-5 retro-panel p-5 space-y-4">
                    <div class="flex items-center justify-between border-b-2 border-stone-800 pb-2">
                        <div>
                            <h3 class="font-pixel text-2xl text-white">STOCK DE MÓDULOS EN FREEZER (${totalModules} U.)</h3>
                            <p class="text-[11px] text-stone-400">Controlá tus porciones congeladas listas</p>
                        </div>
                        <button onclick="MealPrepMod.refillFullBatch()" class="retro-btn bg-sky-950 text-sky-300 px-2.5 py-1 text-[10px] font-bold">
                            + Llenar Tanda
                        </button>
                    </div>

                    <div class="space-y-2.5">
                        ${state.freezer.map(mod => {
                            const pctBar = Math.min(100, Math.round((mod.count / mod.max) * 100));
                            return `
                                <div class="bg-black border border-stone-800 p-3 space-y-1.5">
                                    <div class="flex items-center justify-between gap-2">
                                        <div>
                                            <h4 class="text-xs font-bold text-white">${mod.name}</h4>
                                            <p class="text-[10px] text-stone-400">Ideal: ${mod.max} ${mod.unit}</p>
                                        </div>
                                        <div class="flex items-center gap-1.5">
                                            <button onclick="MealPrepMod.adjustFreezerStock('${mod.id}', -1)" class="retro-btn bg-stone-900 text-white w-7 h-7 text-xs font-bold">-</button>
                                            <span class="hit-counter text-acid min-w-[34px] text-center">${mod.count}</span>
                                            <button onclick="MealPrepMod.adjustFreezerStock('${mod.id}', 1)" class="retro-btn bg-acid-dark text-acid w-7 h-7 text-xs font-bold">+</button>
                                        </div>
                                    </div>
                                    <div class="w-full h-1.5 bg-stone-900 overflow-hidden">
                                        <div class="h-full bg-acid" style="width: ${pctBar}%"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Lista de Compras $150k (7 cols) -->
                <div class="lg:col-span-7 retro-panel p-5 space-y-4">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-stone-800 pb-2">
                        <div>
                            <div class="flex items-center gap-2">
                                <h3 class="font-pixel text-2xl text-white">LISTA DE COMPRAS MEAL-PREP (${AppCore.formatARS(fin.foodSpent)} / ${AppCore.formatARS(fin.foodLimit)})</h3>
                                <button onclick="MealPrepMod.editMonthlyBudgetLimit()" class="text-[10px] text-amber-300 underline">[Editar tope]</button>
                            </div>
                            <p class="text-[11px] text-stone-400">Lo que tildes como comprado se descuenta automáticamente en la pestaña Finanzas (${foodPct}% ejecutado)</p>
                        </div>
                        <div class="flex gap-1.5 text-xs">
                            <button onclick="MealPrepMod.markAllShopping(true)" class="retro-btn bg-black text-acid px-2 py-1 text-[10px]">Todo</button>
                            <button onclick="MealPrepMod.markAllShopping(false)" class="retro-btn bg-black text-stone-400 px-2 py-1 text-[10px]">Nada</button>
                        </div>
                    </div>

                    <div class="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                        ${state.shoppingList.map(item => `
                            <div class="p-2.5 border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${item.bought ? 'bg-acid-dark/20 border-acid/50' : 'bg-black border-stone-800'}">
                                <div class="flex items-start gap-2.5">
                                    <input type="checkbox" ${item.bought ? 'checked' : ''} onchange="MealPrepMod.toggleShoppingItem('${item.id}')" class="mt-1 w-4 h-4 accent-lime-400 cursor-pointer">
                                    <div>
                                        <div class="flex flex-wrap items-center gap-1.5">
                                            <span class="text-xs font-bold ${item.bought ? 'line-through text-stone-400' : 'text-white'}">${item.name}</span>
                                            <span class="text-[9px] px-1.5 py-0.2 bg-stone-900 border border-stone-700 text-amber-300">${item.block}</span>
                                            <span class="text-[10px] text-stone-400">(${item.qty})</span>
                                        </div>
                                        <p class="text-[10px] text-stone-400">${item.destiny}</p>
                                    </div>
                                </div>
                                <div class="flex items-center justify-end gap-2 shrink-0">
                                    <div class="flex items-center bg-stone-950 border border-stone-700 px-2 py-1">
                                        <span class="text-xs text-stone-400 mr-1">$</span>
                                        <input type="number" value="${item.price}" onchange="MealPrepMod.updateShoppingItemPrice('${item.id}', this.value)" class="w-20 bg-transparent text-xs font-bold text-white focus:outline-none text-right">
                                    </div>
                                    <button onclick="MealPrepMod.deleteShoppingItem('${item.id}')" class="text-stone-500 hover:text-rose-400 text-xs px-1">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <form onsubmit="MealPrepMod.addCustomFoodItem(event)" class="pt-2 border-t border-stone-800 grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                        <input type="text" id="new-food-name" required placeholder="Sumar ítem de comida (ej. Sésamo, Maple huevos...)" class="sm:col-span-5 retro-input px-2.5 py-1.5">
                        <input type="text" id="new-food-qty" required placeholder="Cant. (ej. 250g)" class="sm:col-span-3 retro-input px-2.5 py-1.5">
                        <input type="number" id="new-food-price" required min="1" placeholder="Precio ARS" class="sm:col-span-2 retro-input px-2.5 py-1.5">
                        <button type="submit" class="sm:col-span-2 retro-btn retro-btn-acid py-1.5 font-bold">+ SUMAR</button>
                    </form>
                </div>
            </div>
        `;
    }

    AppCore.registerModule({
        id: 'mealprep',
        title: '2. MEAL-PREP & FREEZER ($150K)',
        icon: 'fa-bowl-rice',
        order: 2,
         render
    });

    return {
        handleProportionSlider,
        resetPlateProportions,
        updateCustomPlate,
        loadPresetMeal,
        logCurrentPlateMeal,
        cookPresetDirectly,
        adjustFreezerStock,
        refillFullBatch,
        toggleShoppingItem,
        updateShoppingItemPrice,
        deleteShoppingItem,
        markAllShopping,
        addCustomFoodItem,
        editMonthlyBudgetLimit
    };
})();