// =========================================================
// MÓDULO 3: HÁBITOS SEMANALES & MOTOR DE MÓDULOS EXPANSIBLES
// =========================================================

const HabitsMod = (function () {

    function getCurrentDayIndex() {
        const day = new Date().getDay();
        return day === 0 ? 6 : day - 1;
    }

    function markTodayHabit(habitId) {
        const state = AppCore.getState();
        const habit = state.habits.find(h => h.id === habitId);
        if (!habit) return;
        habit.days[getCurrentDayIndex()] = true;
    }

    function init() {
        // Escucha eventos de otros módulos sin acoplamiento directo
        AppCore.on('meal:cooked', () => {
            markTodayHabit('h1');
            markTodayHabit('h2');
            render();
        });

        AppCore.on('transaction:added', () => {
            markTodayHabit('h4');
            render();
        });
    }

    function toggleHabitDay(habitId, dayIdx) {
        const state = AppCore.getState();
        const habit = state.habits.find(h => h.id === habitId);
        if (!habit) return;
        habit.days[dayIdx] = !habit.days[dayIdx];
        AppCore.saveState();
        render();
    }

    function addNewHabit(e) {
        e.preventDefault();
        const input = document.getElementById('new-habit-input');
        const name = input.value.trim();
        if (!name) return;

        const state = AppCore.getState();
        state.habits.push({
            id: 'h_' + Date.now(),
            name,
            days: [false, false, false, false, false, false, false]
        });
        AppCore.saveState();
        render();
        AppCore.showToast('Nuevo hábito agregado a tu matriz semanal');
    }

    function deleteHabit(habitId) {
        const state = AppCore.getState();
        state.habits = state.habits.filter(h => h.id !== habitId);
        AppCore.saveState();
        render();
    }

    function resetWeeklyHabits() {
        const state = AppCore.getState();
        state.habits.forEach(h => {
            h.days = [false, false, false, false, false, false, false];
        });
        AppCore.saveState();
        render();
        AppCore.showToast('Matriz semanal reiniciada');
    }

    // --- GESTIÓN DE MICRO-MÓDULOS EXPANSIBLES ---
    function createCustomTracker(e) {
        e.preventDefault();
        const title = document.getElementById('ct-title').value.trim().toUpperCase();
        const unit = document.getElementById('ct-unit').value.trim();
        const target = parseInt(document.getElementById('ct-target').value, 10) || 1;
        const notes = document.getElementById('ct-notes').value.trim();
        if (!title || !unit) return;

        const state = AppCore.getState();
        state.customTrackers.push({
            id: 'ct_' + Date.now(),
            title,
            icon: 'fa-cube',
            unit,
            current: 0,
            target,
            notes: notes || 'Módulo personalizado activo',
            logs: []
        });

        AppCore.saveState();
        render();
        AppCore.showToast(`¡Nuevo módulo "${title}" acoplado al sistema!`);
    }

    function adjustTrackerCount(id, delta) {
        const state = AppCore.getState();
        const t = state.customTrackers.find(x => x.id === id);
        if (!t) return;
        t.current = Math.max(0, t.current + delta);
        AppCore.saveState();
        render();
    }

    function addTrackerLog(e, id) {
        e.preventDefault();
        const input = document.getElementById(`log-input-${id}`);
        if (!input || !input.value.trim()) return;
        const state = AppCore.getState();
        const t = state.customTrackers.find(x => x.id === id);
        if (!t) return;

        const stamp = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
        t.logs.unshift(`${stamp}: ${input.value.trim()}`);
        if (t.logs.length > 6) t.logs.pop();
        AppCore.saveState();
        render();
        AppCore.showToast('Entrada guardada en la bitácora del módulo');
    }

    function deleteCustomTracker(id) {
        const state = AppCore.getState();
        state.customTrackers = state.customTrackers.filter(x => x.id !== id);
        AppCore.saveState();
        render();
        AppCore.showToast('Módulo eliminado', 'warning');
    }

    function render() {
        const container = document.getElementById('module-view-habitos');
        if (!container) return;

        const state = AppCore.getState();
        let totalChecks = 0;
        const totalPossible = state.habits.length * 7;

        const rowsHtml = state.habits.map(habit => {
            const doneCount = habit.days.filter(Boolean).length;
            totalChecks += doneCount;
            const dayCells = habit.days.map((done, idx) => `
                <td class="py-2.5 text-center">
                    <button onclick="HabitsMod.toggleHabitDay('${habit.id}', ${idx})"
                            class="w-7 h-7 border-2 mx-auto flex items-center justify-center font-bold text-xs ${done ? 'bg-acid text-black border-white' : 'bg-black border-stone-700 text-transparent hover:border-acid'}">
                        ✓
                    </button>
                </td>
            `).join('');

            return `
                <tr class="border-b border-stone-800 hover:bg-black/40">
                    <td class="py-2.5 pr-3 text-xs font-bold text-white flex items-center justify-between gap-2">
                        <span>${habit.name}</span>
                        <button onclick="HabitsMod.deleteHabit('${habit.id}')" class="text-stone-600 hover:text-rose-400 text-xs">x</button>
                    </td>
                    ${dayCells}
                    <td class="py-2.5 text-right pl-2">
                        <span class="hit-counter text-xs ${doneCount >= 5 ? 'text-acid' : 'text-amber-300'}">${doneCount}/7</span>
                    </td>
                </tr>
            `;
        }).join('');

        const overallPct = totalPossible > 0 ? Math.round((totalChecks / totalPossible) * 100) : 0;

        container.innerHTML = `
            <!-- HEADER HÁBITOS -->
            <div class="retro-panel p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-purple-400">
                <div>
                    <span class="text-[10px] font-bold px-2 py-0.5 bg-purple-900 text-purple-200 border border-purple-400">CONSTANCIA & EXPANSIÓN MODULAR</span>
                    <h2 class="font-pixel text-3xl text-white mt-1">MATRIZ DE HÁBITOS SEMANALES & MÓDULOS EXTRA</h2>
                    <p class="text-xs text-stone-400">
                        Los hábitos de cocinar con tu freezer y anotar gastos se tildan solos al usar los módulos de Finanzas y Meal-Prep.
                    </p>
                </div>
                <div class="flex items-center gap-3">
                    <div class="bg-black border-2 border-stone-700 px-3 py-1.5 text-center">
                        <span class="text-[10px] text-stone-400 block">CUMPLIMIENTO</span>
                        <span class="font-pixel text-2xl text-acid">${overallPct}%</span>
                    </div>
                    <button onclick="HabitsMod.resetWeeklyHabits()" class="retro-btn bg-stone-900 text-stone-300 px-3 py-2 text-xs font-bold">
                        Reiniciar Semana
                    </button>
                </div>
            </div>

            <!-- TABLA SEMANAL DE HÁBITOS -->
            <div class="retro-panel p-4 sm:p-5 overflow-x-auto">
                <table class="w-full min-w-[640px] text-left border-collapse">
                    <thead>
                        <tr class="border-b-2 border-stone-700 text-xs text-acid uppercase">
                            <th class="py-2 pr-4 w-2/5">Hábito Diario</th>
                            <th class="py-2 text-center">LUN</th>
                            <th class="py-2 text-center">MAR</th>
                            <th class="py-2 text-center">MIÉ</th>
                            <th class="py-2 text-center">JUE</th>
                            <th class="py-2 text-center">VIE</th>
                            <th class="py-2 text-center">SÁB</th>
                            <th class="py-2 text-center">DOM</th>
                            <th class="py-2 text-right pl-2">META</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>

                <form onsubmit="HabitsMod.addNewHabit(event)" class="mt-4 pt-3 border-t border-stone-800 flex flex-col sm:flex-row gap-2 text-xs">
                    <input type="text" id="new-habit-input" required placeholder="Agregar nuevo hábito fijo a la grilla (ej. Practicar acordes Neo-Soul 20 min...)" class="flex-1 retro-input px-3 py-2">
                    <button type="submit" class="retro-btn retro-btn-acid px-4 py-2 font-bold">+ SUMAR HÁBITO</button>
                </form>
            </div>

            <!-- SECCIÓN DE MÓDULOS EXPANSIBLES (PLUG & PLAY) -->
            <div class="space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <h3 class="font-pixel text-2xl text-acid">
                            ★ MÓDULOS DE HÁBITOS EXPANSIBLES (INDEPENDIENTES DE FINANZAS Y COMIDA)
                        </h3>
                        <p class="text-xs text-stone-400">
                            Cada tarjeta es un micro-módulo autónomo con contador de meta y bitácora propia. Podés crear todos los que quieras abajo.
                        </p>
                    </div>
                </div>

                <!-- Grilla de Micro-Módulos Activos -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${state.customTrackers.map(t => {
                        const pct = Math.min(100, Math.round((t.current / t.target) * 100));
                        return `
                            <div class="retro-panel p-4 flex flex-col justify-between space-y-3 border-t-4 border-t-purple-500">
                                <div class="flex items-start justify-between gap-2">
                                    <div>
                                        <h4 class="font-pixel text-2xl text-white leading-none">${t.title}</h4>
                                        <p class="text-[11px] text-purple-300 mt-0.5">${t.notes}</p>
                                    </div>
                                    <button onclick="HabitsMod.deleteCustomTracker('${t.id}')" class="text-stone-500 hover:text-rose-400 text-xs" title="Eliminar módulo">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                </div>

                                <div class="bg-black border border-stone-800 p-3 flex items-center justify-between">
                                    <div>
                                        <span class="text-[10px] text-stone-400 uppercase block">Progreso / Meta (${t.unit})</span>
                                        <span class="font-pixel text-2xl text-acid">${t.current} / ${t.target} ${t.unit}</span>
                                    </div>
                                    <div class="flex items-center gap-1.5">
                                        <button onclick="HabitsMod.adjustTrackerCount('${t.id}', -1)" class="retro-btn bg-stone-900 text-white w-8 h-8 font-bold">-</button>
                                        <button onclick="HabitsMod.adjustTrackerCount('${t.id}', 1)" class="retro-btn retro-btn-acid w-8 h-8 font-bold">+</button>
                                    </div>
                                </div>

                                <div class="w-full h-2 bg-black border border-stone-700 overflow-hidden">
                                    <div class="h-full bg-purple-400" style="width: ${pct}%"></div>
                                </div>

                                <!-- Bitácora rápida del módulo -->
                                <div class="space-y-1.5 text-xs">
                                    <span class="text-[10px] text-stone-400 uppercase font-bold">Bitácora del módulo:</span>
                                    <div class="bg-black border border-stone-800 p-2 max-h-24 overflow-y-auto space-y-1 text-[11px] text-stone-300">
                                        ${t.logs.length > 0 ? t.logs.map(l => `<div>> ${l}</div>`).join('') : '<div class="text-stone-600">Sin entradas aún.</div>'}
                                    </div>
                                    <form onsubmit="HabitsMod.addTrackerLog(event, '${t.id}')" class="flex gap-1.5 pt-1">
                                        <input type="text" id="log-input-${t.id}" placeholder="Anotar avance en ${t.title}..." class="flex-1 retro-input px-2 py-1 text-xs">
                                        <button type="submit" class="retro-btn bg-purple-900 text-white px-2.5 py-1 text-[10px] font-bold">ANOTAR</button>
                                    </form>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- Creador de Nuevos Módulos sin tocar código -->
                <div class="retro-panel p-4 space-y-3 border-dashed border-2 border-acid/60">
                    <h4 class="font-pixel text-xl text-acid">
                        + ACOPLAR NUEVO MÓDULO DE HÁBITO / SEGUIMIENTO
                    </h4>
                    <form onsubmit="HabitsMod.createCustomTracker(event)" class="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                        <input type="text" id="ct-title" required placeholder="Nombre (ej. PRÁCTICA GUITARRA, LECTURA...)" class="sm:col-span-4 retro-input px-2.5 py-2">
                        <input type="text" id="ct-unit" required placeholder="Unidad (ej. prácticas/sem, libros)" class="sm:col-span-3 retro-input px-2.5 py-2">
                        <input type="number" id="ct-target" required min="1" placeholder="Meta numérica (ej. 4)" class="sm:col-span-2 retro-input px-2.5 py-2">
                        <input type="text" id="ct-notes" placeholder="Nota corta o meta..." class="sm:col-span-3 retro-input px-2.5 py-2">
                        <button type="submit" class="sm:col-span-12 retro-btn retro-btn-purple py-2 font-bold">
                            + CREAR E INYECTAR MÓDULO INDEPENDIENTE
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    AppCore.registerModule({
        id: 'habitos',
        title: '3. HÁBITOS & MÓDULOS (+)',
        icon: 'fa-cubes',
        order: 3,
        init,
        render
    });

    return {
        toggleHabitDay,
        addNewHabit,
        deleteHabit,
        resetWeeklyHabits,
        createCustomTracker,
        adjustTrackerCount,
        addTrackerLog,
        deleteCustomTracker
    };
})();