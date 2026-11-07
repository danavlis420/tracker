// =========================================================
// SYNC-AI.JS - GitHub Gist Cloud, JSON Backup & Oráculo Gemini
// =========================================================

const SyncAI = (function () {

    function getStoredGeminiKey() {
        return (localStorage.getItem(LS_GEMINI_KEY) || '').trim();
    }
    function getStoredGithubPat() {
        return (localStorage.getItem(LS_GITHUB_PAT) || '').trim();
    }
    function getStoredGistId() {
        return (localStorage.getItem(LS_GIST_ID) || '').trim();
    }

    function updateSyncStatusUI() {
        const hasGeminiKey = Boolean(getStoredGeminiKey());
        const hasPat = Boolean(getStoredGithubPat());
        const hasGistId = Boolean(getStoredGistId());
        const lastSync = localStorage.getItem(LS_GIST_LAST_SYNC);

        const headerDot = document.getElementById('header-sync-dot');
        if (headerDot) {
            headerDot.className = hasPat && hasGistId
                ? 'w-2.5 h-2.5 inline-block bg-acid border border-black'
                : hasGeminiKey
                ? 'w-2.5 h-2.5 inline-block bg-sky-400 border border-black'
                : 'w-2.5 h-2.5 inline-block bg-amber-400 border border-black';
        }

        const drawerStatus = document.getElementById('drawer-api-status');
        if (drawerStatus) {
            drawerStatus.textContent = hasGeminiKey ? 'KEY ACTIVA' : 'SIN KEY LOCAL';
            drawerStatus.className = hasGeminiKey
                ? 'text-[10px] px-1.5 py-0.5 bg-acid-dark text-acid border border-acid'
                : 'text-[10px] px-1.5 py-0.5 bg-stone-900 text-stone-400 border border-stone-700';
        }

        const geminiPill = document.getElementById('gemini-key-status-pill');
        if (geminiPill) {
            geminiPill.textContent = hasGeminiKey ? '✓ Guardada en navegador' : 'No configurada';
        }

        const modalSyncBadge = document.getElementById('modal-sync-badge');
        if (modalSyncBadge) {
            modalSyncBadge.textContent = (hasPat && hasGistId) ? 'GIST CONECTADO' : 'SOLO LOCALSTORAGE';
        }

        const lastSyncLbl = document.getElementById('last-synced-label');
        if (lastSyncLbl) {
            lastSyncLbl.textContent = lastSync ? `Últ. sinc: ${lastSync}` : 'Últ. sinc: Nunca';
        }
    }

    function openBackupModal() {
        const modal = document.getElementById('backup-modal');
        document.getElementById('modal-gemini-key').value = getStoredGeminiKey();
        document.getElementById('modal-github-pat').value = getStoredGithubPat();
        document.getElementById('modal-gist-id').value = getStoredGistId();
        document.getElementById('modal-gist-autosync').checked = localStorage.getItem(LS_GIST_AUTOSYNC) === 'true';
        updateSyncStatusUI();
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    function closeBackupModal() {
        const modal = document.getElementById('backup-modal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    function saveGeminiKeyFromModal() {
        const val = document.getElementById('modal-gemini-key').value.trim();
        if (val) {
            localStorage.setItem(LS_GEMINI_KEY, val);
            AppCore.showToast('API Key de Gemini guardada en LocalStorage');
        } else {
            localStorage.removeItem(LS_GEMINI_KEY);
            AppCore.showToast('API Key removida', 'warning');
        }
        updateSyncStatusUI();
    }

    function clearGeminiKey() {
        localStorage.removeItem(LS_GEMINI_KEY);
        document.getElementById('modal-gemini-key').value = '';
        updateSyncStatusUI();
        AppCore.showToast('API Key eliminada del navegador', 'warning');
    }

    function saveGistSettingsFromModal(notify = true) {
        const pat = document.getElementById('modal-github-pat').value.trim();
        const gistId = document.getElementById('modal-gist-id').value.trim();
        const autoSync = document.getElementById('modal-gist-autosync').checked;

        if (pat) localStorage.setItem(LS_GITHUB_PAT, pat);
        else localStorage.removeItem(LS_GITHUB_PAT);

        if (gistId) localStorage.setItem(LS_GIST_ID, gistId);
        else localStorage.removeItem(LS_GIST_ID);

        localStorage.setItem(LS_GIST_AUTOSYNC, autoSync ? 'true' : 'false');
        updateSyncStatusUI();
        if (notify) AppCore.showToast('Credenciales de GitHub Gist actualizadas');
    }

    function getSanitizedStateForExport() {
        const copy = JSON.parse(JSON.stringify(AppCore.getState()));
        delete copy.customApiKey;
        copy.exportedAt = new Date().toISOString();
        return copy;
    }

    function validateImportedState(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            throw new Error('El archivo debe contener un objeto JSON.');
        }

        const assertPlainText = current => {
            if (typeof current === 'string' && /[<>]/.test(current)) {
                throw new Error('El respaldo contiene texto con markup no permitido.');
            }
            if (Array.isArray(current)) current.forEach(assertPlainText);
            else if (current && typeof current === 'object') Object.values(current).forEach(assertPlainText);
        };
        const isSafeId = id => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(id);

        const fields = [
            'foodBudgetLimit', 'monthlySavingsGoal', 'incomes', 'generalExpenses',
            'plate', 'freezer', 'shoppingList', 'habits', 'customTrackers'
        ];
        const imported = Object.fromEntries(fields
            .filter(field => Object.prototype.hasOwnProperty.call(value, field))
            .map(field => [field, value[field]]));
        if (Object.keys(imported).length === 0) {
            throw new Error('El JSON no contiene datos reconocidos de esta app.');
        }
        assertPlainText(imported);

        for (const field of ['foodBudgetLimit', 'monthlySavingsGoal']) {
            if (field in imported && (!Number.isFinite(imported[field]) || imported[field] < 0)) {
                throw new Error(`El campo ${field} debe ser un número válido.`);
            }
        }

        for (const field of ['incomes', 'generalExpenses', 'freezer', 'shoppingList', 'habits', 'customTrackers']) {
            if (field in imported && !Array.isArray(imported[field])) {
                throw new Error(`El campo ${field} debe ser una lista.`);
            }
        }

        for (const [field, entries] of [['incomes', imported.incomes], ['generalExpenses', imported.generalExpenses]]) {
            if (!entries) continue;
            if (entries.some(item => !item || !isSafeId(item.id) || typeof item.desc !== 'string' || typeof item.cat !== 'string' ||
                !Number.isFinite(Number(item.amount)) || Number(item.amount) < 0)) {
                throw new Error(`Hay movimientos inválidos en ${field}.`);
            }
        }
        if (imported.freezer?.some(item => !item || !isSafeId(item.id) || typeof item.name !== 'string' || typeof item.unit !== 'string' ||
            (item.icon !== undefined && !/^fa-[a-z0-9-]+$/i.test(item.icon)) || (item.color !== undefined && !/^[a-z-]+$/i.test(item.color)) ||
            !Number.isFinite(Number(item.count)) || Number(item.count) < 0)) {
            throw new Error('Hay elementos de freezer inválidos.');
        }
        if (imported.shoppingList?.some(item => !item || !isSafeId(item.id) || typeof item.name !== 'string' || typeof item.qty !== 'string' ||
            typeof item.block !== 'string' || typeof item.destiny !== 'string' ||
            !Number.isFinite(Number(item.price)) || Number(item.price) < 0 || typeof item.bought !== 'boolean')) {
            throw new Error('Hay elementos de compras inválidos.');
        }
        if (imported.habits?.some(item => !item || !isSafeId(item.id) || typeof item.name !== 'string' ||
            !Array.isArray(item.days) || item.days.length !== 7 || item.days.some(day => typeof day !== 'boolean'))) {
            throw new Error('Hay hábitos inválidos; cada hábito debe tener siete checks.');
        }
        if (imported.customTrackers?.some(item => !item || !isSafeId(item.id) || typeof item.title !== 'string' ||
            (item.icon !== undefined && !/^fa-[a-z0-9-]+$/i.test(item.icon)) || !Number.isFinite(Number(item.current)) ||
            !Number.isFinite(Number(item.target)) || !Array.isArray(item.logs) || item.logs.some(log => typeof log !== 'string'))) {
            throw new Error('Hay trackers personalizados inválidos.');
        }
        if ('plate' in imported && (!imported.plate || typeof imported.plate !== 'object' || Array.isArray(imported.plate) ||
            !Number.isFinite(Number(imported.plate.vegPct)) || !Number.isFinite(Number(imported.plate.protPct)) ||
            !Number.isFinite(Number(imported.plate.carbPct)))) {
            throw new Error('La configuración del plato es inválida.');
        }

        return imported;
    }

    async function readGitHubError(response) {
        let detail = '';
        try {
            const body = await response.json();
            detail = body?.message || '';
        } catch (err) {
            // Some network/proxy errors do not return a JSON body.
        }
        if (response.status === 401) return 'Token de GitHub inválido o vencido (HTTP 401).';
        if (response.status === 403) return 'GitHub rechazó el acceso. Revisá el permiso gist y los límites de API (HTTP 403).';
        if (response.status === 404) return 'No se encontró el Gist o el token no tiene acceso (HTTP 404).';
        return detail ? `GitHub: ${detail} (HTTP ${response.status}).` : `GitHub respondió HTTP ${response.status}.`;
    }

    let syncInProgress = false;
    function setSyncButtonsBusy(busy) {
        ['btn-create-gist', 'btn-push-gist', 'btn-pull-gist', 'btn-header-pull', 'btn-header-push']
            .forEach(id => {
                const button = document.getElementById(id);
                if (button) button.disabled = busy;
            });
    }

    function beginSync() {
        if (syncInProgress) return false;
        syncInProgress = true;
        setSyncButtonsBusy(true);
        return true;
    }

    function endSync() {
        syncInProgress = false;
        setSyncButtonsBusy(false);
    }

    async function createNewSecretGist() {
        saveGistSettingsFromModal(false);
        const pat = getStoredGithubPat();
        if (!pat) {
            AppCore.showToast('Ingresá primero tu GitHub Personal Access Token', 'warning');
            return;
        }

        if (!beginSync()) return;
        try {
            const response = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: {
                    'Accept': 'application/vnd.github+json',
                    'Authorization': `Bearer ${pat}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: 'Finanzas, MealPrep & Hábitos Hub - Datos Sincronizados',
                    public: false,
                    files: {
                        'mealprep_data.json': {
                            content: JSON.stringify(getSanitizedStateForExport(), null, 2)
                        }
                    }
                })
            });

            if (!response.ok) throw new Error(await readGitHubError(response));
            const data = await response.json();
            if (!data?.id) throw new Error('GitHub respondió correctamente pero no devolvió el ID del Gist.');
            localStorage.setItem(LS_GIST_ID, data.id);
            document.getElementById('modal-gist-id').value = data.id;
            const stamp = new Date().toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
            localStorage.setItem(LS_GIST_LAST_SYNC, stamp);
            updateSyncStatusUI();
            AppCore.showToast(`¡Gist secreto creado! ID: ${data.id.slice(0, 8)}...`);
        } catch (err) {
            AppCore.showToast(`No se pudo crear el Gist: ${err.message || 'error de conexión.'}`, 'warning');
        } finally {
            endSync();
        }
    }

    async function pushToGist(isSilentAutoSync = false) {
        const modal = document.getElementById('backup-modal');
        if (modal && !modal.classList.contains('hidden')) saveGistSettingsFromModal(false);
        const pat = getStoredGithubPat();
        const gistId = getStoredGistId();

        if (!pat || !gistId) {
            if (!isSilentAutoSync) {
                openBackupModal();
                AppCore.showToast('Configurá tu Token y Gist ID primero', 'warning');
            }
            return;
        }
        if (!beginSync()) return;

        try {
            const response = await fetch(`https://api.github.com/gists/${gistId}`, {
                method: 'PATCH',
                headers: {
                    'Accept': 'application/vnd.github+json',
                    'Authorization': `Bearer ${pat}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    files: {
                        'mealprep_data.json': {
                            content: JSON.stringify(getSanitizedStateForExport(), null, 2)
                        }
                    }
                })
            });

            if (!response.ok) throw new Error(await readGitHubError(response));
            const stamp = new Date().toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
            localStorage.setItem(LS_GIST_LAST_SYNC, stamp);
            updateSyncStatusUI();
            if (!isSilentAutoSync) AppCore.showToast('¡Datos subidos a GitHub Gist (PUSH)!');
        } catch (err) {
            if (!isSilentAutoSync) AppCore.showToast(`No se pudo subir al Gist: ${err.message || 'error de conexión.'}`, 'warning');
            else console.error('Error en auto-sync de Gist:', err);
        } finally {
            endSync();
        }
    }

    async function pullFromGist() {
        const modal = document.getElementById('backup-modal');
        if (modal && !modal.classList.contains('hidden')) saveGistSettingsFromModal(false);
        const pat = getStoredGithubPat();
        const gistId = getStoredGistId();
        if (!gistId) {
            openBackupModal();
            AppCore.showToast('Ingresá tu Gist ID para descargar datos', 'warning');
            return;
        }
        if (!beginSync()) return;

        try {
            const headers = { 'Accept': 'application/vnd.github+json' };
            if (pat) headers['Authorization'] = `Bearer ${pat}`;
            const response = await fetch(`https://api.github.com/gists/${gistId}`, { method: 'GET', headers });
            if (!response.ok) throw new Error(await readGitHubError(response));

            const data = await response.json();
            const gistFiles = Object.entries(data?.files || {});
            const fileObj = data?.files?.['mealprep_data.json'] ||
                gistFiles.find(([name]) => name.toLowerCase().endsWith('.json'))?.[1] ||
                (gistFiles.length === 1 ? gistFiles[0][1] : null);
            if (!fileObj) throw new Error('El Gist no contiene un archivo JSON reconocible.');

            let content = fileObj.content;
            if (fileObj.truncated || !content) {
                if (!fileObj.raw_url) throw new Error('GitHub no incluyó el contenido ni una URL de descarga.');
                const rawHeaders = pat ? { 'Authorization': `Bearer ${pat}` } : {};
                const rawResponse = await fetch(fileObj.raw_url, { headers: rawHeaders });
                if (!rawResponse.ok) throw new Error(await readGitHubError(rawResponse));
                content = await rawResponse.text();
            }

            const imported = validateImportedState(JSON.parse(content));
            if (!window.confirm('PULL reemplazará los datos locales de esta app con el contenido del Gist. ¿Continuar?')) return;
            AppCore.setState(imported, true);

            const stamp = new Date().toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
            localStorage.setItem(LS_GIST_LAST_SYNC, stamp);
            updateSyncStatusUI();
            AppCore.showToast('¡Datos sincronizados desde GitHub Gist (PULL)!');
        } catch (err) {
            AppCore.showToast(`No se pudo descargar el Gist: ${err.message || 'error de conexión.'}`, 'warning');
        } finally {
            endSync();
        }
    }

    function exportDataJson() {
        const cleanData = getSanitizedStateForExport();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanData, null, 2));
        const a = document.createElement('a');
        a.setAttribute("href", dataStr);
        a.setAttribute("download", `finanzas_mealprep_dani_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(a);
        a.click();
        a.remove();
        AppCore.showToast('Backup .JSON descargado');
    }

    function importDataJson(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const imported = validateImportedState(JSON.parse(e.target.result));
                AppCore.setState(imported, true);
                closeBackupModal();
                AppCore.showToast('Datos restaurados desde el archivo .JSON');
            } catch (err) {
                AppCore.showToast(`No se pudo importar el archivo: ${err.message || 'JSON inválido.'}`, 'warning');
            } finally {
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    }

    function resetAllAppData() {
        AppCore.resetToDefault();
        closeBackupModal();
        AppCore.showToast('Datos restaurados a valores de fábrica');
    }

    // --- ORÁCULO GEMINI IA ---
    function toggleGeminiDrawer() {
        const drawer = document.getElementById('gemini-drawer');
        const backdrop = document.getElementById('gemini-drawer-backdrop');
        const isOpen = !drawer.classList.contains('translate-x-full');

        if (isOpen) {
            drawer.classList.add('translate-x-full');
            backdrop.classList.add('hidden');
        } else {
            drawer.classList.remove('translate-x-full');
            backdrop.classList.remove('hidden');
            document.getElementById('chat-input').focus();
        }
    }

    function toggleApiKeyConfig() {
        const bar = document.getElementById('api-key-bar');
        bar.classList.toggle('hidden');
        document.getElementById('custom-api-key-input').value = getStoredGeminiKey();
    }

    function saveCustomApiKeyFromDrawer() {
        const key = document.getElementById('custom-api-key-input').value.trim();
        if (key) localStorage.setItem(LS_GEMINI_KEY, key);
        else localStorage.removeItem(LS_GEMINI_KEY);
        document.getElementById('api-key-bar').classList.add('hidden');
        updateSyncStatusUI();
        AppCore.showToast('API Key actualizada');
    }

    function clearChatHistory() {
        document.getElementById('chat-messages').innerHTML = `
            <div class="retro-box bg-black p-3 text-stone-200 chat-msg border-l-4 border-l-acid">
                <p class="text-acid font-bold mb-1">&lt;ORÁCULO_420&gt; dice:</p>
                <p>Consola limpia. Sigo leyendo tus ingresos, egresos, freezer y hábitos en tiempo real.</p>
            </div>
        `;
        pendingProposal = null;
    }

    function askGeminiQuick(promptText) {
        const drawer = document.getElementById('gemini-drawer');
        if (drawer.classList.contains('translate-x-full')) toggleGeminiDrawer();
        sendMessageToGemini(promptText);
    }

    function handleChatSubmit(e) {
        e.preventDefault();
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        sendMessageToGemini(text);
    }

    function buildLiveSystemPrompt() {
        const state = AppCore.getState();
        const fin = AppCore.getFinancialSummary();
        const freezerSummary = state.freezer.map(f => `- ${f.name}: ${f.count} ${f.unit}`).join('\n');
        const trackersSummary = state.customTrackers.map(t => `- ${t.title}: ${t.current}/${t.target} ${t.unit}`).join('\n');
        const actionContext = {
            incomes: state.incomes,
            expenses: state.generalExpenses,
            freezer: state.freezer.map(({ id, name, count, max }) => ({ id, name, count, max })),
            shoppingList: state.shoppingList.map(({ id, name, bought, price }) => ({ id, name, bought, price })),
            habits: state.habits.map(({ id, name, days }) => ({ id, name, days })),
            customTrackers: state.customTrackers.map(({ id, title, current, target }) => ({ id, title, current, target }))
        };

        return `Sos el asistente personal de finanzas, nutrición (Meal Prep) y hábitos de Dani en Buenos Aires.
Estado en vivo de la app de Dani:
1. FINANZAS DEL MES:
   - Ingresos Totales: $${fin.totalIncome} ARS
   - Gastos de Comida Meal-Prep: $${fin.foodSpent} ARS (Tope: $${fin.foodLimit} ARS)
   - Otros Egresos Generales: $${fin.otherExpenses} ARS
   - Egresos Totales: $${fin.totalExpenses} ARS
   - Saldo Neto Disponible: $${fin.netBalance} ARS (Margen libre: ${fin.savingsRate}%)
2. FREEZER Y REGLA 45/30/25:
   - Regla de plato: 45% Verduras, 30% Proteínas, 25% Carbohidratos.
   - Stock en Freezer:
${freezerSummary}
3. MÓDULOS DE HÁBITOS ACTIVOS:
${trackersSummary}

Datos actuales para identificar elementos que el usuario pida actualizar:
${JSON.stringify(actionContext)}

Respondé siempre como JSON válido con esta forma exacta: {"message":"respuesta en español","actions":[]}.
Solo proponé acciones si el usuario pide explícitamente cambiar o registrar algo. Las acciones permitidas son:
- {"type":"add_income"|"add_expense","data":{"desc":"...","amount":numero,"cat":"..."}}
- {"type":"edit_income"|"edit_expense","data":{"id":"id existente","desc":"...","amount":numero,"cat":"..."}} (incluí solo campos que se cambian)
- {"type":"set_freezer_count","data":{"id":"id existente","count":entero}}
- {"type":"set_shopping_bought","data":{"id":"id existente","bought":boolean}}
- {"type":"set_habit_day","data":{"id":"id existente","dayIndex":0-6,"done":boolean}}
- {"type":"set_tracker_current","data":{"id":"id existente","current":numero}}
- {"type":"add_tracker_log","data":{"id":"id existente","text":"..."}}
No inventes IDs; no propongas borrados, otras operaciones ni más de seis acciones. Si faltan datos esenciales, preguntá y devolvé actions vacías. Nunca afirmes que un cambio ya se aplicó: el usuario verá una vista previa y deberá confirmarla.
Respondé con onda, directo al grano, usando viñetas claras y ayudándolo a cuidar su bolsillo, comer rico en 10-15 minutos y sostener sus hábitos.`;
    }

    let pendingProposal = null;

    function validateAgentActions(actions) {
        if (!Array.isArray(actions) || actions.length > 6) throw new Error('La propuesta debe contener como máximo seis acciones.');
        const state = AppCore.getState();
        const allowed = {
            add_income: ['desc', 'amount', 'cat'],
            add_expense: ['desc', 'amount', 'cat'],
            edit_income: ['id', 'desc', 'amount', 'cat'],
            edit_expense: ['id', 'desc', 'amount', 'cat'],
            set_freezer_count: ['id', 'count'],
            set_shopping_bought: ['id', 'bought'],
            set_habit_day: ['id', 'dayIndex', 'done'],
            set_tracker_current: ['id', 'current'],
            add_tracker_log: ['id', 'text']
        };

        return actions.map(action => {
            if (!action || !allowed[action.type] || !action.data || typeof action.data !== 'object' || Array.isArray(action.data)) {
                throw new Error('La IA propuso una operación desconocida. No se aplicó ningún cambio.');
            }
            const data = action.data;
            if (Object.keys(data).some(key => !allowed[action.type].includes(key))) {
                throw new Error('La propuesta contiene campos no permitidos. No se aplicó ningún cambio.');
            }
            const requireText = (key, max = 120) => {
                if (typeof data[key] !== 'string' || !data[key].trim() || data[key].trim().length > max || /[<>]/.test(data[key])) {
                    throw new Error(`El campo ${key} no es válido. No se aplicó ningún cambio.`);
                }
                return data[key].trim();
            };
            const requireNumber = (key, min = 0, max = 1000000000, integer = false) => {
                const value = Number(data[key]);
                if (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
                    throw new Error(`El valor de ${key} no es válido. No se aplicó ningún cambio.`);
                }
                return value;
            };
            const requireExisting = (items, label) => {
                if (typeof data.id !== 'string' || !items.some(item => item.id === data.id)) {
                    throw new Error(`No se encontró el elemento de ${label}. No se aplicó ningún cambio.`);
                }
            };
            const result = { type: action.type, data: { ...data } };

            if (action.type === 'add_income' || action.type === 'add_expense') {
                result.data = { desc: requireText('desc'), amount: requireNumber('amount', 0.01), cat: requireText('cat', 80) };
            } else if (action.type === 'edit_income' || action.type === 'edit_expense') {
                const items = action.type === 'edit_income' ? state.incomes : state.generalExpenses;
                requireExisting(items, 'finanzas');
                const patch = { id: data.id };
                if ('desc' in data) patch.desc = requireText('desc');
                if ('amount' in data) patch.amount = requireNumber('amount', 0.01);
                if ('cat' in data) patch.cat = requireText('cat', 80);
                if (Object.keys(patch).length === 1) throw new Error('La edición no contiene cambios.');
                result.data = patch;
            } else if (action.type === 'set_freezer_count') {
                requireExisting(state.freezer, 'freezer');
                const item = state.freezer.find(entry => entry.id === data.id);
                result.data = { id: data.id, count: requireNumber('count', 0, Number(item.max) || 100000, true) };
            } else if (action.type === 'set_shopping_bought') {
                requireExisting(state.shoppingList, 'lista de compras');
                if (typeof data.bought !== 'boolean') throw new Error('El estado de compra no es válido.');
                result.data = { id: data.id, bought: data.bought };
            } else if (action.type === 'set_habit_day') {
                requireExisting(state.habits, 'hábitos');
                if (!Number.isInteger(data.dayIndex) || data.dayIndex < 0 || data.dayIndex > 6 || typeof data.done !== 'boolean') {
                    throw new Error('El día o el estado del hábito no es válido.');
                }
                result.data = { id: data.id, dayIndex: data.dayIndex, done: data.done };
            } else if (action.type === 'set_tracker_current') {
                requireExisting(state.customTrackers, 'trackers');
                result.data = { id: data.id, current: requireNumber('current', 0, 100000, true) };
            } else if (action.type === 'add_tracker_log') {
                requireExisting(state.customTrackers, 'trackers');
                result.data = { id: data.id, text: requireText('text', 500) };
            }
            return result;
        });
    }

    function describeAction(action) {
        const data = action.data;
        const labels = {
            add_income: 'Crear ingreso', add_expense: 'Crear gasto', edit_income: 'Actualizar ingreso',
            edit_expense: 'Actualizar gasto', set_freezer_count: 'Actualizar stock',
            set_shopping_bought: 'Actualizar compra', set_habit_day: 'Actualizar hábito',
            set_tracker_current: 'Actualizar tracker', add_tracker_log: 'Agregar nota al tracker'
        };
        const item = action.type === 'add_income' || action.type === 'add_expense'
            ? `${data.desc} · $${data.amount} · ${data.cat}`
            : action.type === 'edit_income' || action.type === 'edit_expense'
            ? `${data.id} · ${Object.entries(data).filter(([key]) => key !== 'id').map(([key, value]) => `${key}: ${value}`).join(', ')}`
            : `${data.id} · ${Object.entries(data).filter(([key]) => key !== 'id').map(([key, value]) => `${key}: ${value}`).join(', ')}`;
        return `${labels[action.type]} — ${item}`;
    }

    function renderProposal(actions) {
        pendingProposal = actions;
        const card = document.createElement('div');
        card.id = 'ai-action-proposal';
        card.className = 'retro-box bg-stone-900 border border-amber-400 p-3 text-xs space-y-2';
        const heading = document.createElement('p');
        heading.className = 'font-bold text-amber-300';
        heading.textContent = `VISTA PREVIA · ${actions.length} cambio(s)`;
        const list = document.createElement('ul');
        list.className = 'space-y-1 text-stone-200';
        actions.forEach(action => {
            const item = document.createElement('li');
            item.textContent = `• ${describeAction(action)}`;
            list.appendChild(item);
        });
        const controls = document.createElement('div');
        controls.className = 'flex gap-2 pt-1';
        const confirmButton = document.createElement('button');
        confirmButton.type = 'button';
        confirmButton.className = 'retro-btn retro-btn-acid px-3 py-1 font-bold';
        confirmButton.textContent = 'CONFIRMAR Y APLICAR';
        confirmButton.addEventListener('click', confirmPendingProposal);
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'retro-btn bg-black text-stone-300 px-3 py-1';
        cancelButton.textContent = 'CANCELAR';
        cancelButton.addEventListener('click', cancelPendingProposal);
        controls.append(confirmButton, cancelButton);
        card.append(heading, list, controls);
        document.getElementById('chat-messages').appendChild(card);
    }

    function cancelPendingProposal() {
        pendingProposal = null;
        document.getElementById('ai-action-proposal')?.remove();
    }

    function confirmPendingProposal() {
        if (!pendingProposal?.length) return;
        const actions = pendingProposal;
        const state = AppCore.getState();
        actions.forEach(({ type, data }) => {
            if (type === 'add_income' || type === 'add_expense') {
                const collection = type === 'add_income' ? state.incomes : state.generalExpenses;
                collection.push({ id: `${type === 'add_income' ? 'inc' : 'exp'}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, ...data, date: new Date().toLocaleDateString('es-AR') });
                AppCore.emit('transaction:added', { type: type === 'add_income' ? 'INGRESO' : 'EGRESO', amount: data.amount });
            } else if (type === 'edit_income' || type === 'edit_expense') {
                const collection = type === 'edit_income' ? state.incomes : state.generalExpenses;
                Object.assign(collection.find(item => item.id === data.id), data);
            } else if (type === 'set_freezer_count') {
                state.freezer.find(item => item.id === data.id).count = data.count;
            } else if (type === 'set_shopping_bought') {
                const item = state.shoppingList.find(entry => entry.id === data.id);
                item.bought = data.bought;
                AppCore.emit('shopping:updated', item);
                if (data.bought) AppCore.emit('transaction:added', { type: 'MEALPREP_BUY', amount: item.price });
            } else if (type === 'set_habit_day') {
                state.habits.find(item => item.id === data.id).days[data.dayIndex] = data.done;
            } else if (type === 'set_tracker_current') {
                state.customTrackers.find(item => item.id === data.id).current = data.current;
            } else if (type === 'add_tracker_log') {
                const tracker = state.customTrackers.find(item => item.id === data.id);
                const stamp = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
                tracker.logs.unshift(`${stamp}: ${data.text}`);
                tracker.logs = tracker.logs.slice(0, 6);
            }
        });
        pendingProposal = null;
        AppCore.saveState();
        AppCore.renderAllModules();
        document.getElementById('ai-action-proposal')?.remove();
        AppCore.showToast('Cambios confirmados y guardados.');
    }

    function formatMarkdownSimple(text) {
        const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const withBold = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return withBold.split('\n').map(l => l.trim() ? `<p>${l}</p>` : '').join('');
    }

    async function sendMessageToGemini(userQuery) {
        const chatContainer = document.getElementById('chat-messages');
        const sendBtn = document.getElementById('chat-send-btn');
        cancelPendingProposal();

        const userBubble = document.createElement('div');
        userBubble.className = 'retro-box bg-purple-950/60 border-purple-500 text-white p-3 ml-6 text-xs';
        const userLabel = document.createElement('span');
        userLabel.className = 'text-purple-300 font-bold block mb-0.5';
        userLabel.textContent = '<DANI>:';
        const userText = document.createElement('span');
        userText.textContent = userQuery;
        userBubble.append(userLabel, userText);
        chatContainer.appendChild(userBubble);

        const loadingBubble = document.createElement('div');
        loadingBubble.className = 'retro-box bg-black p-3 mr-6 text-acid text-xs';
        loadingBubble.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Leyendo balance y freezer...`;
        chatContainer.appendChild(loadingBubble);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        if (sendBtn) sendBtn.disabled = true;

        try {
            const apiKey = getStoredGeminiKey();
            if (!apiKey) throw new Error('Falta la API Key de Gemini. Configurala con el botón de llave.');
            const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: userQuery }] }],
                    systemInstruction: { parts: [{ text: buildLiveSystemPrompt() }] },
                    generationConfig: { responseMimeType: 'application/json' }
                })
            });

            if (!response.ok) {
                let detail = '';
                try {
                    const body = await response.json();
                    detail = body?.error?.message || '';
                } catch (parseError) {
                    // The provider may return a non-JSON proxy error.
                }
                throw new Error(detail || `Gemini respondió HTTP ${response.status}.`);
            }
            const result = await response.json();
            const answer = result?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!answer) throw new Error('Gemini no devolvió contenido. Revisá la configuración o los límites de la API.');
            let parsedAnswer;
            try {
                parsedAnswer = JSON.parse(answer);
            } catch (parseError) {
                throw new Error('Gemini devolvió una respuesta con formato inválido; no se aplicó ningún cambio.');
            }
            if (!parsedAnswer || typeof parsedAnswer.message !== 'string' || !Array.isArray(parsedAnswer.actions)) {
                throw new Error('La respuesta de Gemini no tiene el formato esperado; no se aplicó ningún cambio.');
            }
            const actions = validateAgentActions(parsedAnswer.actions);

            loadingBubble.className = 'retro-box bg-black p-3 mr-4 text-stone-200 chat-msg border-l-4 border-l-acid';
            loadingBubble.innerHTML = `<p class="text-acid font-bold mb-1">&lt;ORÁCULO_420&gt;:</p>` + formatMarkdownSimple(parsedAnswer.message);
            if (actions.length) renderProposal(actions);
        } catch (err) {
            loadingBubble.className = 'retro-box bg-rose-950 text-rose-200 p-3 text-xs';
            const errorTitle = document.createElement('p');
            errorTitle.className = 'font-bold';
            errorTitle.textContent = 'No se pudo completar la consulta a Gemini';
            const errorDetail = document.createElement('p');
            errorDetail.textContent = err.message || 'Error de conexión. Revisá tu conexión e intentá nuevamente.';
            loadingBubble.replaceChildren(errorTitle, errorDetail);
        } finally {
            if (sendBtn) sendBtn.disabled = false;
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    return {
        updateSyncStatusUI,
        openBackupModal,
        closeBackupModal,
        saveGeminiKeyFromModal,
        clearGeminiKey,
        saveGistSettingsFromModal,
        createNewSecretGist,
        pushToGist,
        pullFromGist,
        exportDataJson,
        importDataJson,
        resetAllAppData,
        toggleGeminiDrawer,
        toggleApiKeyConfig,
        saveCustomApiKeyFromDrawer,
        clearChatHistory,
        askGeminiQuick,
        handleChatSubmit,
        confirmPendingProposal,
        cancelPendingProposal
    };
})();

window.SyncAI = SyncAI;