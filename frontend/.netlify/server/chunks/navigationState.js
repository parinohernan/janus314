import { w as writable, g as get } from "./index2.js";
const getInitialState = () => {
  {
    return {};
  }
};
const createNavigationStore = () => {
  const store = writable(getInitialState());
  const { subscribe, set, update } = store;
  return {
    subscribe,
    saveState: (path, state) => {
      update((states) => {
        const newStates = { ...states, [path]: state };
        return newStates;
      });
    },
    getState: (path) => {
      const states = get(store);
      return states[path] || null;
    },
    clearState: (path) => {
      update((states) => {
        const newStates = { ...states };
        delete newStates[path];
        return newStates;
      });
    },
    clearAll: () => set({})
  };
};
createNavigationStore();
