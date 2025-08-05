import { w as writable, g as get } from "./index2.js";
const getInitialState = () => {
  {
    return {};
  }
};
const createNavigationStore = () => {
  const { subscribe, set, update } = writable(getInitialState());
  return {
    subscribe,
    saveState: (path, state) => {
      update((states) => ({ ...states, [path]: state }));
    },
    getState: (path) => {
      const states = get({ subscribe });
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
