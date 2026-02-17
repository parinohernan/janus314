import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export interface Tab {
  id: string;           // UUID único
  label: string;        // Título mostrado
  url: string;          // URL del contenido
  icon?: string;        // Icono opcional
  modified?: boolean;   // Si tiene cambios sin guardar
  pinned?: boolean;     // Si está anclado
  type: 'view' | 'edit' | 'create'; // Tipo de tab
}

interface TabsState {
  tabs: Tab[];
  activeTabId: string | null;
}

const MAX_TABS = 10;
const STORAGE_KEY = 'janus314_tabs';

// Función para generar UUID simple
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Estado inicial
const initialState: TabsState = {
  tabs: [],
  activeTabId: null
};

// Crear el store
function createTabsStore() {
  const { subscribe, set, update } = writable<TabsState>(initialState);

  return {
    subscribe,

    // Cargar tabs desde localStorage
    loadTabs: () => {
      if (!browser) return;
      
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const state: TabsState = JSON.parse(saved);
          // Validar que los tabs tengan estructura correcta
          if (state.tabs && Array.isArray(state.tabs)) {
            set(state);
          }
        }
      } catch (error) {
        console.error('Error cargando tabs:', error);
      }
    },

    // Persistir tabs en localStorage
    persistTabs: (state: TabsState) => {
      if (!browser) return;
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error('Error guardando tabs:', error);
      }
    },

    // Abrir o activar tab existente
    openTab: (tab: Partial<Tab>) => {
      update(state => {
        // Validar que tenga url y label
        if (!tab.url || !tab.label) {
          console.error('Tab debe tener url y label');
          return state;
        }

        // Buscar si ya existe un tab con la misma URL
        const existingTab = state.tabs.find(t => t.url === tab.url);
        
        if (existingTab) {
          // Si existe, solo activarlo
          const newState = {
            ...state,
            activeTabId: existingTab.id
          };
          tabsStore.persistTabs(newState);
          return newState;
        }

        // Si llegamos al máximo de tabs, cerrar el más antiguo no anclado
        let tabs = [...state.tabs];
        if (tabs.length >= MAX_TABS) {
          const nonPinnedIndex = tabs.findIndex(t => !t.pinned);
          if (nonPinnedIndex !== -1) {
            tabs.splice(nonPinnedIndex, 1);
          } else {
            // Si todos están anclados, no permitir abrir más
            console.warn('Máximo de tabs alcanzado');
            return state;
          }
        }

        // Crear nuevo tab
        const newTab: Tab = {
          id: tab.id || generateId(),
          label: tab.label,
          url: tab.url,
          icon: tab.icon,
          modified: tab.modified || false,
          pinned: tab.pinned || false,
          type: tab.type || 'view'
        };

        tabs.push(newTab);

        const newState = {
          tabs,
          activeTabId: newTab.id
        };

        tabsStore.persistTabs(newState);
        return newState;
      });
    },

    // Cerrar tab
    closeTab: (id: string, force: boolean = false) => {
      update(state => {
        const tab = state.tabs.find(t => t.id === id);
        
        // Si el tab tiene cambios sin guardar y no es forzado, no cerrar
        if (tab?.modified && !force) {
          // Aquí se podría mostrar un modal de confirmación
          // Por ahora simplemente retornamos el estado sin cambios
          console.warn('Tab tiene cambios sin guardar');
          return state;
        }

        const tabs = state.tabs.filter(t => t.id !== id);
        let activeTabId = state.activeTabId;

        // Si cerramos el tab activo, activar otro
        if (activeTabId === id) {
          if (tabs.length > 0) {
            // Activar el tab anterior o el primero
            const closedIndex = state.tabs.findIndex(t => t.id === id);
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
        tabsStore.persistTabs(newState);
        return newState;
      });
    },

    // Cambiar tab activo
    setActiveTab: (id: string) => {
      update(state => {
        const tab = state.tabs.find(t => t.id === id);
        if (!tab) return state;

        const newState = {
          ...state,
          activeTabId: id
        };

        tabsStore.persistTabs(newState);
        return newState;
      });
    },

    // Cerrar todos los tabs
    closeAllTabs: () => {
      update(state => {
        // Solo mantener tabs anclados
        const tabs = state.tabs.filter(t => t.pinned);
        const activeTabId = tabs.length > 0 ? tabs[0].id : null;

        const newState = { tabs, activeTabId };
        tabsStore.persistTabs(newState);
        return newState;
      });
    },

    // Cerrar otros tabs (excepto el especificado)
    closeOtherTabs: (id: string) => {
      update(state => {
        const tab = state.tabs.find(t => t.id === id);
        if (!tab) return state;

        // Mantener solo el tab especificado y los anclados
        const tabs = state.tabs.filter(t => t.id === id || t.pinned);

        const newState = {
          tabs,
          activeTabId: id
        };

        tabsStore.persistTabs(newState);
        return newState;
      });
    },

    // Cerrar tabs a la derecha
    closeTabsToRight: (id: string) => {
      update(state => {
        const index = state.tabs.findIndex(t => t.id === id);
        if (index === -1) return state;

        // Mantener tabs hasta el índice especificado y los anclados
        const tabs = [
          ...state.tabs.slice(0, index + 1),
          ...state.tabs.slice(index + 1).filter(t => t.pinned)
        ];

        let activeTabId = state.activeTabId;
        // Si el tab activo fue cerrado, activar el especificado
        if (activeTabId && !tabs.find(t => t.id === activeTabId)) {
          activeTabId = id;
        }

        const newState = { tabs, activeTabId };
        tabsStore.persistTabs(newState);
        return newState;
      });
    },

    // Anclar/desanclar tab
    togglePinTab: (id: string) => {
      update(state => {
        const tabs = state.tabs.map(t => 
          t.id === id ? { ...t, pinned: !t.pinned } : t
        );

        const newState = { ...state, tabs };
        tabsStore.persistTabs(newState);
        return newState;
      });
    },

    // Marcar tab como modificado
    setTabModified: (id: string, modified: boolean) => {
      update(state => {
        const tabs = state.tabs.map(t => 
          t.id === id ? { ...t, modified } : t
        );

        const newState = { ...state, tabs };
        tabsStore.persistTabs(newState);
        return newState;
      });
    },

    // Actualizar etiqueta de tab
    updateTabLabel: (id: string, label: string) => {
      update(state => {
        const tabs = state.tabs.map(t => 
          t.id === id ? { ...t, label } : t
        );

        const newState = { ...state, tabs };
        tabsStore.persistTabs(newState);
        return newState;
      });
    },

    // Limpiar todos los tabs (útil al cerrar sesión)
    clearAllTabs: () => {
      const newState = { tabs: [], activeTabId: null };
      if (browser) {
        localStorage.removeItem(STORAGE_KEY);
      }
      set(newState);
    },

    // Obtener tab activo
    getActiveTab: (): Tab | null => {
      const state = get({ subscribe });
      if (!state.activeTabId) return null;
      return state.tabs.find(t => t.id === state.activeTabId) || null;
    }
  };
}

export const tabsStore = createTabsStore();
