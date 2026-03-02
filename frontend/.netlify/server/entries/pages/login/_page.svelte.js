import { k as attr, m as attr_class, c as pop, p as push, n as stringify } from "../../../chunks/index3.js";
import "../../../chunks/authStore.js";
import "../../../chunks/client.js";
import { B as Button } from "../../../chunks/Button.js";
function _page($$payload, $$props) {
  push();
  let usuario = "";
  let password = "";
  let empresa = "1";
  let loading = false;
  $$payload.out += `<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"><div class="max-w-md w-full space-y-8"><div><img class="mx-auto h-12 w-auto" src="/janus314.png" alt="janus314"> <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Iniciar Sesión</h2></div> <form class="mt-8 space-y-6">`;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <div class="rounded-md shadow-sm -space-y-px">`;
  {
    $$payload.out += "<!--[-->";
    $$payload.out += `<div><p>Empresa</p> <label for="empresa" class="sr-only">Empresa</label> <input id="empresa" name="empresa" type="text" required${attr("value", empresa)} class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="Código de Empresa"></div>`;
  }
  $$payload.out += `<!--]--> <div><p>Usuario</p> <label for="usuario" class="sr-only">Usuario</label> <input id="usuario" name="usuario" type="text" required${attr("value", usuario)}${attr_class(`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${stringify("")} focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`)} placeholder="Usuario"></div> <div class="relative"><p>Contraseña</p> <label for="password" class="sr-only">Contraseña</label> <input id="password" name="password"${attr("type", "password")} required${attr("value", password)} class="appearance-none rounded-none relative block w-full px-3 py-2 pr-12 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" placeholder="Contraseña"> <div id="password-toggle" class="absolute inset-y-0 right-0 pr-2 flex items-end"><button type="button" class="pb-2"${attr("aria-label", "Mostrar contraseña")}>`;
  {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
  }
  $$payload.out += `<!--]--></button></div></div></div> <div>`;
  Button($$payload, {
    type: "submit",
    variant: "primary",
    fullWidth: true,
    disabled: loading,
    children: ($$payload2) => {
      {
        $$payload2.out += "<!--[!-->";
      }
      $$payload2.out += `<!--]--> Iniciar Sesión`;
    },
    $$slots: { default: true }
  });
  $$payload.out += `<!----></div> <div class="mt-4 text-center text-sm text-gray-500"><br> Puedes usar la empresa de prueba: <strong>Test S.A.</strong> <br> usa el código de empresa: <strong>1</strong> <br> usa el usuario: <strong>1</strong> <br> usa la contraseña: <strong>1234</strong> <br> <a href="/register" class="font-medium text-blue-500 hover:text-blue-700">¿No tienes una cuenta? Regístrate</a></div></form></div></div>`;
  pop();
}
export {
  _page as default
};
