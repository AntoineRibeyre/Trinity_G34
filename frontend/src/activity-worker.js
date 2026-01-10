/**
 * Service Worker pour la détection d'activité en arrière-plan
 * Ce worker maintient une connexion active et peut recevoir des messages
 * même quand l'onglet est en arrière-plan (avec certaines limitations)
 */

// État de l'activité (synchronisé avec le thread principal)
let lastKnownState = {
  isActive: true,
  timestamp: Date.now()
};

/**
 * Retourne l'état actuel
 */
function getCurrentState() {
  return {
    ...lastKnownState,
    timestamp: Date.now()
  };
}

/**
 * Envoie un message à tous les clients connectés
 */
async function notifyClients(message) {
  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  });

  console.log('[ActivityWorker] Notification à', clients.length, 'client(s):', message.type);

  clients.forEach(client => {
    client.postMessage(message);
  });
}

// Écouter les messages du thread principal
self.addEventListener('message', async (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'INIT':
      console.log('[ActivityWorker] Initialisation');
      event.source.postMessage({
        type: 'INIT_RESULT',
        payload: { success: true }
      });
      break;

    case 'STATE_UPDATE':
      // Le thread principal nous envoie l'état d'activité
      lastKnownState = {
        isActive: payload.isActive,
        timestamp: Date.now()
      };
      console.log('[ActivityWorker] État mis à jour:', lastKnownState);
      
      // Notifier tous les autres clients du changement
      notifyClients({
        type: 'ACTIVITY_CHANGE',
        payload: lastKnownState
      });
      break;

    case 'GET_STATE':
      event.source.postMessage({
        type: 'STATE_RESPONSE',
        payload: getCurrentState()
      });
      break;

    case 'PING':
      // Répondre avec l'état actuel
      event.source.postMessage({
        type: 'PONG',
        payload: getCurrentState()
      });
      break;
  }
});

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[ActivityWorker] Installation');
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[ActivityWorker] Activation');
  event.waitUntil(self.clients.claim());
});

// Écouter les événements de fetch pour garder le worker actif
self.addEventListener('fetch', (event) => {
  // Ne pas intercepter les requêtes, juste garder le worker actif
});
