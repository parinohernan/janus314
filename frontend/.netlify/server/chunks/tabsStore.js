import { w as writable, g as get } from "./index2.js";
const MAX_TABS = 10;
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
const initialState = {
  tabs: [],
  activeTabId: null
};
function createTabsStore() {
  const { subscribe, set, update } = writable(initialState);
  return {
    subscribe,
    // Cargar tabs desde localStorage
    loadTabs: () => {
      return;
    },
    // Persistir tabs en localStorage
    persistTabs: (state) => {
      return;
    },
    // Abrir o activar tab existente
    openTab: (tab) => {
      update((state) => {
        if (!tab.url || !tab.label) {
          console.error("Tab debe tener url y label");
          return state;
        }
        const existingTab = state.tabs.find((t) => t.url === tab.url);
        if (existingTab) {
          const newState2 = {
            ...state,
            activeTabId: existingTab.id
          };
          return newState2;
        }
        let tabs = [...state.tabs];
        if (tabs.length >= MAX_TABS) {
          const nonPinnedIndex = tabs.findIndex((t) => !t.pinned);
          if (nonPinnedIndex !== -1) {
            tabs.splice(nonPinnedIndex, 1);
          } else {
            console.warn("Máximo de tabs alcanzado");
            return state;
          }
        }
        const newTab = {
          id: tab.id || generateId(),
          label: tab.label,
          url: tab.url,
          icon: tab.icon,
          modified: tab.modified || false,
          pinned: tab.pinned || false,
          type: tab.type || "view"
        };
        tabs.push(newTab);
        const newState = {
          tabs,
          activeTabId: newTab.id
        };
        return newState;
      });
    },
    // Cerrar tab
    closeTab: (id, force = false) => {
      update((state) => {
        const tab = state.tabs.find((t) => t.id === id);
        if (tab?.modified && !force) {
          console.warn("Tab tiene cambios sin guardar");
          return state;
        }
        const tabs = state.tabs.filter((t) => t.id !== id);
        let activeTabId = state.activeTabId;
        if (activeTabId === id) {
          if (tabs.length > 0) {
            const closedIndex = state.tabs.findIndex((t) => t.id === id);
            if (closedIndex > 0) {
              activeTabId = tabs[closedIndex - 1].id;
            } else {
              activeTabId = tabs[0].id;
            }
          } else {
            activeTabId = null;
          }
        }
        const newState = { tabs, activeTabId };
        return newState;
      });
    },
    // Cambiar tab activo
    setActiveTab: (id) => {
      update((state) => {
        const tab = state.tabs.find((t) => t.id === id);
        if (!tab) return state;
        const newState = {
          ...state,
          activeTabId: id
        };
        return newState;
      });
    },
    // Cerrar todos los tabs
    closeAllTabs: () => {
      update((state) => {
        const tabs = state.tabs.filter((t) => t.pinned);
        const activeTabId = tabs.length > 0 ? tabs[0].id : null;
        const newState = { tabs, activeTabId };
        return newState;
      });
    },
    // Cerrar otros tabs (excepto el especificado)
    closeOtherTabs: (id) => {
      update((state) => {
        const tab = state.tabs.find((t) => t.id === id);
        if (!tab) return state;
        const tabs = state.tabs.filter((t) => t.id === id || t.pinned);
        const newState = {
          tabs,
          activeTabId: id
        };
        return newState;
      });
    },
    // Cerrar tabs a la derecha
    closeTabsToRight: (id) => {
      update((state) => {
        const index = state.tabs.findIndex((t) => t.id === id);
        if (index === -1) return state;
        const tabs = [
          ...state.tabs.slice(0, index + 1),
          ...state.tabs.slice(index + 1).filter((t) => t.pinned)
        ];
        let activeTabId = state.activeTabId;
        if (activeTabId && !tabs.find((t) => t.id === activeTabId)) {
          activeTabId = id;
        }
        const newState = { tabs, activeTabId };
        return newState;
      });
    },
    // Anclar/desanclar tab
    togglePinTab: (id) => {
      update((state) => {
        const tabs = state.tabs.map(
          (t) => t.id === id ? { ...t, pinned: !t.pinned } : t
        );
        const newState = { ...state, tabs };
        return newState;
      });
    },
    // Marcar tab como modificado
    setTabModified: (id, modified) => {
      update((state) => {
        const tabs = state.tabs.map(
          (t) => t.id === id ? { ...t, modified } : t
        );
        const newState = { ...state, tabs };
        return newState;
      });
    },
    // Actualizar etiqueta de tab
    updateTabLabel: (id, label) => {
      update((state) => {
        const tabs = state.tabs.map(
          (t) => t.id === id ? { ...t, label } : t
        );
        const newState = { ...state, tabs };
        return newState;
      });
    },
    // Limpiar todos los tabs (útil al cerrar sesión)
    clearAllTabs: () => {
      const newState = { tabs: [], activeTabId: null };
      set(newState);
    },
    // Obtener tab activo
    getActiveTab: () => {
      const state = get({ subscribe });
      if (!state.activeTabId) return null;
      return state.tabs.find((t) => t.id === state.activeTabId) || null;
    }
  };
}
createTabsStore();
