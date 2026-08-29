// Site admin Westeros — ce fichier tourne dans le navigateur.
// Pas d'IP à configurer : le site et l'API sont servis par le même serveur
// (web/server.js), donc on appelle simplement "/api/..." (chemin relatif).

let etatActuel = { collection: null, data: [] };

async function chargerDonnees(collection) {
    etatActuel = { collection, data: [] };
    document.getElementById('titre-section').innerText = `Gestion des ${collection}`;
    const contenuDiv = document.getElementById('contenu');
    contenuDiv.innerHTML = "<p class='text-gray-400'>Chargement des données en cours...</p>";

    try {
        const response = await fetch(`/api/${collection}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        etatActuel.data = data;
        afficherFormulaires(collection, data);
    } catch (error) {
        contenuDiv.innerHTML = `<p class="text-red-500 font-bold">Erreur de connexion à l'API (${error.message}). Vérifie que le serveur (web/server.js) tourne bien et que tu es connecté avec le bon identifiant/mot de passe.</p>`;
        console.error("Erreur Fetch:", error);
    }
}

function afficherFormulaires(collection, dataList) {
    const contenuDiv = document.getElementById('contenu');
    contenuDiv.innerHTML = '';

    if (!dataList || dataList.length === 0) {
        contenuDiv.innerHTML = "<p class='text-gray-400'>Aucune donnée trouvée pour cette catégorie.</p>";
        return;
    }

    dataList.forEach(item => {
        const carte = document.createElement('div');
        carte.className = "bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700";
        carte.innerHTML = collection === 'maisons' ? carteMaison(item)
                         : collection === 'regions' ? carteRegion(item)
                         : carteProfil(item);
        contenuDiv.appendChild(carte);
    });
}

// --- Petits helpers d'affichage ---
function champLecture(label, value) {
    return `
        <div class="mb-3">
            <label class="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">${label}</label>
            <div class="bg-gray-700 text-gray-300 p-2 rounded w-full">${value ?? '—'}</div>
        </div>`;
}

function champEdit(id, label, value, type = 'text') {
    const val = value === null || value === undefined ? '' : String(value).replace(/"/g, '&quot;');
    return `
        <div class="mb-3">
            <label class="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">${label}</label>
            <input type="${type}" id="${id}" value="${val}" class="bg-gray-900 text-white border border-gray-600 focus:border-red-500 focus:outline-none p-2 rounded w-full">
        </div>`;
}

function blocHistorique(collection, key, historique) {
    const lignes = (historique || []).map(h =>
        `<li class="text-sm text-gray-400 border-b border-gray-700 py-1">${h.texte} <span class="text-gray-600 italic">— ${h.auteurLabel || ''}</span></li>`
    ).join('') || '<li class="text-sm text-gray-600 italic">Aucun historique.</li>';

    return `
        <div class="mt-4 border-t border-gray-700 pt-3">
            <label class="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Historique</label>
            <ul class="mb-2 max-h-32 overflow-y-auto">${lignes}</ul>
            <div class="flex gap-2">
                <input type="text" id="hist-${collection}-${key}" placeholder="Ajouter une entrée..." class="bg-gray-900 text-white border border-gray-600 focus:border-red-500 focus:outline-none p-2 rounded flex-1 text-sm">
                <button onclick="ajouterHistorique('${collection}', '${key}')" class="bg-gray-700 hover:bg-gray-600 text-white px-3 rounded text-sm font-semibold">Ajouter</button>
            </div>
        </div>`;
}

// --- Cartes par collection ---
function carteMaison(m) {
    return `
        <h3 class="text-xl font-bold text-red-500 mb-3">${m.nom}</h3>
        ${champLecture('Type', m.type)}
        ${champLecture('Région', m.region)}
        ${champLecture('Armée', (m.armeeLines || []).join('<br>'))}
        ${champLecture('Renommée de base', m.renommeeBase)}
        ${champLecture('Argent de base', m.argentBase)}
        ${champEdit(`maisons-${m.key}-renommeeOverride`, 'Renommée (override)', m.renommeeOverride, 'number')}
        ${champEdit(`maisons-${m.key}-argentOverride`, 'Argent (override)', m.argentOverride)}
        ${champEdit(`maisons-${m.key}-leaderId`, 'ID Discord du chef', m.leaderId)}
        <button onclick="sauvegarder('maisons', '${m.key}')" class="w-full bg-red-700 hover:bg-red-600 text-white p-3 rounded font-bold mt-4 transition">Enregistrer les modifications</button>
        ${blocHistorique('maisons', m.key, m.historique)}
    `;
}

function carteRegion(r) {
    return `
        <h3 class="text-xl font-bold text-red-500 mb-3">${r.nom}</h3>
        ${champLecture('Maison dirigeante', r.maisonDirigeante)}
        ${champLecture('Capitale', r.capitale)}
        ${champLecture('Richesse', r.richesse)}
        ${champLecture('Spécialité', r.specialite)}
        ${champLecture('Climat', r.climat)}
        ${champLecture('Armée', (r.armeeLines || []).join('<br>'))}
        ${champLecture('Statut politique de base', r.statutPolitiqueBase)}
        ${champLecture('Instabilité de base', r.instabiliteBase)}
        ${champEdit(`regions-${r.key}-statutOverride`, 'Statut politique (override)', r.statutOverride)}
        ${champEdit(`regions-${r.key}-instabiliteOverride`, 'Instabilité (override)', r.instabiliteOverride, 'number')}
        <button onclick="sauvegarder('regions', '${r.key}')" class="w-full bg-red-700 hover:bg-red-600 text-white p-3 rounded font-bold mt-4 transition">Enregistrer les modifications</button>
        ${blocHistorique('regions', r.key, r.historique)}
    `;
}

function carteProfil(p) {
    return `
        <h3 class="text-xl font-bold text-red-500 mb-3">${p.nomPrenom || p._id}</h3>
        ${champLecture('Surnom', p.surnom)}
        ${champLecture('Maison', p.maisonName)}
        ${champLecture('Région', p.regionName)}
        ${champLecture('Rôle', p.roleName)}
        ${champEdit(`profils-${p._id}-statut`, 'Statut', p.statut)}
        ${champEdit(`profils-${p._id}-gardePersonnelle`, 'Garde personnelle', p.gardePersonnelle)}
        ${champEdit(`profils-${p._id}-boursePersonnelle`, 'Bourse personnelle', p.boursePersonnelle)}
        ${champEdit(`profils-${p._id}-allies`, 'Alliés', p.allies)}
        ${champEdit(`profils-${p._id}-rivaux`, 'Rivaux', p.rivaux)}
        ${champEdit(`profils-${p._id}-renommee`, 'Renommée', p.renommee, 'number')}
        ${champEdit(`profils-${p._id}-notes`, 'Notes', p.notes)}
        <button onclick="sauvegarder('profils', '${p._id}')" class="w-full bg-red-700 hover:bg-red-600 text-white p-3 rounded font-bold mt-4 transition">Enregistrer les modifications</button>
    `;
}

// --- Sauvegarde ---
async function sauvegarder(collection, id) {
    const prefix = `${collection}-${id}-`;
    const inputs = document.querySelectorAll(`[id^="${prefix}"]`);
    const nouvellesDonnees = {};

    inputs.forEach(input => {
        const key = input.id.slice(prefix.length);
        nouvellesDonnees[key] = input.value;
    });

    try {
        const response = await fetch(`/api/${collection}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nouvellesDonnees)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await response.json();
        alert("Mise à jour réussie !");
        chargerDonnees(collection); // on recharge pour voir les valeurs à jour
    } catch (error) {
        alert("Erreur lors de la sauvegarde. Vérifie la console (F12).");
        console.error("Erreur PATCH:", error);
    }
}

async function ajouterHistorique(collection, key) {
    const input = document.getElementById(`hist-${collection}-${key}`);
    const texte = input.value.trim();
    if (!texte) return;

    try {
        const response = await fetch(`/api/${collection}/${key}/historique`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texte })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        chargerDonnees(collection);
    } catch (error) {
        alert("Erreur lors de l'ajout à l'historique.");
        console.error("Erreur historique:", error);
    }
}