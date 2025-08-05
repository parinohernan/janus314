import { z as current_component } from "./index3.js";
import { w as noop } from "./utils.js";
function onDestroy(fn) {
  var context = (
    /** @type {Component} */
    current_component
  );
  (context.d ??= []).push(fn);
}
function createEventDispatcher() {
  return noop;
}
export {
  createEventDispatcher as c,
  onDestroy as o
};
