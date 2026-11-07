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

    function saveGistSettingsFromModal() {
        const pat = document.getElementById('modal-github-pat').value.trim();
        const gistId = document.getElementById('modal-gist-id').value.trim();
        const autoSync = document.getElementById('modal-gist-autosync').checked;

        if (pat) localStorage.setItem(LS_GITHUB_PAT, pat);
        else localStorage.removeItem(LS_GITHUB_PAT);

        if (gistId) localStorage.setItem(LS_GIST_ID, gistId);
        else localStorage.removeItem(LS_GIST_ID);

        localStorage.setItem(LS_GIST_AUTOSYNC, autoSync ? 'true' : 'false');
        updateSyncStatusUI();
        AppCore.showToast('Credenciales de GitHub Gist actualizadas');
    }

    function getSanitizedStateForExport() {
        const copy = JSON.parse(JSON.stringify(AppCore.getState()));
        delete copy.customApiKey;
        copy.exportedAt = new Date().toISOString();
        return copy;
    }

    async function createNewSecretGist() {
        saveGistSettingsFromModal();
        const pat = getStoredGithubPat();
        if (!pat) {
            AppCore.showToast('Ingresá primero tu GitHub Personal Access Token', 'warning');
            return;
        }

        const btn = document.getElementById('btn-create-gist');
        btn.disabled = true;
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

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (data && data.id) {
                localStorage.setItem(LS_GIST_ID, data.id);
                document.getElementById('modal-gist-id').value = data.id;
                const stamp = new Date().toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
                localStorage.setItem(LS_GIST_LAST_SYNC, stamp);
                updateSyncStatusUI();
                AppCore.showToast(`¡Gist secreto creado! ID: ${data.id.slice(0, 8)}...`);
            }
        } catch (err) {
            AppCore.showToast('Error al crear Gist. Revisá el permiso "gist" de tu Token.', 'warning');
        } finally {
            btn.disabled = false;
        }
    }

    async function pushToGist(isSilentAutoSync = false) {
        const pat = getStoredGithubPat();
        const gistId = getStoredGistId();

        if (!pat || !gistId) {
            if (!isSilentAutoSync) {
                openBackupModal();
                AppCore.showToast('Configurá tu Token y Gist ID primero', 'warning');
            }
            return;
        }

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

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const stamp = new Date().toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
            localStorage.setItem(LS_GIST_LAST_SYNC, stamp);
            updateSyncStatusUI();
            if (!isSilentAutoSync) AppCore.showToast('¡Datos subidos a GitHub Gist (PUSH)!');
        } catch (err) {
            if (!isSilentAutoSync) AppCore.showToast('Error al subir a Gist.', 'warning');
        }
    }

    async function pullFromGist() {
        const pat = getStoredGithubPat();
        const gistId = getStoredGistId();
        if (!gistId) {
            openBackupModal();
            AppCore.showToast('Ingresá tu Gist ID para descargar datos', 'warning');
            return;
        }

        try {
            const headers = { 'Accept': 'application/vnd.github+json' };
            if (pat) headers['Authorization'] = `Bearer ${pat}`;
            const response = await fetch(`https://api.github.com/gists/${gistId}`, { method: 'GET', headers });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            const fileObj = data?.files?.['mealprep_data.json'] || Object.values(data?.files || {})[0];
            if (!fileObj || !fileObj.content) throw new Error('Archivo no encontrado');

            const imported = JSON.parse(fileObj.content);
            delete imported.customApiKey;
            AppCore.setState(imported, true);

            const stamp = new Date().toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
            localStorage.setItem(LS_GIST_LAST_SYNC, stamp);
            updateSyncStatusUI();
            AppCore.showToast('¡Datos sincronizados desde GitHub Gist (PULL)!');
        } catch (err) {
            AppCore.showToast('Error al descargar del Gist.', 'warning');
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
                const imported = JSON.parse(e.target.result);
                delete imported.customApiKey;
                AppCore.setState(imported);
                closeBackupModal();
                AppCore.showToast('Datos restaurados desde el archivo .JSON');
            } catch (err) {
                AppCore.showToast('Archivo JSON inválido', 'warning');
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

Respondé con onda, directo al grano, usando viñetas claras y ayudándolo a cuidar su bolsillo, comer rico en 10-15 minutos y sostener sus hábitos.`;
    }

    function formatMarkdownSimple(text) {
        const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const withBold = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return withBold.split('\n').map(l => l.trim() ? `<p>${l}</p>` : '').join('');
    }

    async function sendMessageToGemini(userQuery) {
        const chatContainer = document.getElementById('chat-messages');
        const sendBtn = document.getElementById('chat-send-btn');

        const userBubble = document.createElement('div');
        userBubble.className = 'retro-box bg-purple-950/60 border-purple-500 text-white p-3 ml-6 text-xs';
        userBubble.innerHTML = `<span class="text-purple-300 font-bold block mb-0.5">&lt;DANI&gt;:</span>${userQuery}`;
        chatContainer.appendChild(userBubble);

        const loadingBubble = document.createElement('div');
        loadingBubble.className = 'retro-box bg-black p-3 mr-6 text-acid text-xs';
        loadingBubble.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Leyendo balance y freezer...`;
        chatContainer.appendChild(loadingBubble);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        sendBtn.disabled = true;

        try {
            const apiKey = getStoredGeminiKey();
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: userQuery }] }],
                    systemInstruction: { parts: [{ text: buildLiveSystemPrompt() }] }
                })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const result = await response.json();
            const answer = result?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta.';

            loadingBubble.className = 'retro-box bg-black p-3 mr-4 text-stone-200 chat-msg border-l-4 border-l-acid';
            loadingBubble.innerHTML = `<p class="text-acid font-bold mb-1">&lt;ORÁCULO_420&gt;:</p>` + formatMarkdownSimple(answer);
        } catch (err) {
            loadingBubble.className = 'retro-box bg-rose-950 text-rose-200 p-3 text-xs';
            loadingBubble.innerHTML = `<p class="font-bold">Error de conexión con Gemini API</p><p>Hacé clic en el ícono de llave <i class="fa-solid fa-key"></i> arriba a la derecha para configurar tu API Key local.</p>`;
        } finally {
            sendBtn.disabled = false;
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
        handleChatSubmit
    };
})();

// Inicializar aplicación al cargar el DOM
window.addEventListener('DOMContentLoaded', () => {
    AppCore.initApp();
    SyncAI.updateSyncStatusUI();
});