<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import {
		ajustarCampo,
		aplicarLimites,
		debeAvanzarAlTipear,
		esFechaValida,
		fechaLocal,
		interpretarBorrador,
		mismoDia,
		padCampo,
		parsearPegado,
		partesDeFecha,
		siguienteCampo,
		type CampoFecha,
		type PartesFecha
	} from '$lib/utils/fechaCampos';

	export let value: Date = new Date();
	export let id = '';
	export let disabled = false;
	export let min: Date | undefined = undefined;
	export let max: Date | undefined = undefined;
	export let ariaLabel = 'Fecha';
	export let className = '';

	const dispatch = createEventDispatcher<{ change: Date }>();

	let partes: PartesFecha = partesDeFecha(value);
	let textos = textosDesde(partes);
	let editando: CampoFecha | null = null;
	let inputDia: HTMLInputElement;
	let inputMes: HTMLInputElement;
	let inputAnio: HTMLInputElement;

	function textosDesde(p: PartesFecha) {
		return {
			dia: padCampo(p.dia, 'dia'),
			mes: padCampo(p.mes, 'mes'),
			anio: padCampo(p.anio, 'anio')
		};
	}

	function inputs(): Record<CampoFecha, HTMLInputElement | undefined> {
		return { dia: inputDia, mes: inputMes, anio: inputAnio };
	}

	function sincronizar(fecha: Date) {
		partes = partesDeFecha(fecha);
		textos = textosDesde(partes);
	}

	$: if (!editando && esFechaValida(value) && !mismoDia(fechaLocal(partes, value), value)) {
		sincronizar(value);
	}

	function emitir(nuevas: PartesFecha) {
		const siguiente = aplicarLimites(fechaLocal(nuevas, value), min, max);
		sincronizar(siguiente);
		value = siguiente;
		dispatch('change', siguiente);
	}

	function focusCampo(campo: CampoFecha) {
		const el = inputs()[campo];
		if (!el) return;
		el.focus();
		el.select();
	}

	function onWheel(campo: CampoFecha, event: WheelEvent) {
		if (disabled) return;
		event.preventDefault();
		editando = null;
		emitir(ajustarCampo(partes, campo, event.deltaY < 0 ? 1 : -1));
	}

	function onFocus(campo: CampoFecha, event: FocusEvent) {
		editando = campo;
		const el = event.currentTarget as HTMLInputElement;
		requestAnimationFrame(() => el.select());
	}

	function onBlur(campo: CampoFecha) {
		const interpretado = interpretarBorrador(campo, textos[campo], partes);
		emitir(interpretado ?? partes);
		editando = null;
	}

	function onInput(campo: CampoFecha, event: Event) {
		const el = event.currentTarget as HTMLInputElement;
		const maxLen = campo === 'anio' ? 4 : 2;
		const digits = el.value.replace(/\D/g, '').slice(0, maxLen);
		textos = { ...textos, [campo]: digits };
		const interpretado = interpretarBorrador(campo, digits, partes);
		if (!interpretado) return;
		partes = interpretado;
		if (debeAvanzarAlTipear(campo, digits)) {
			editando = null;
			emitir(interpretado);
			const siguiente = siguienteCampo(campo);
			if (siguiente) focusCampo(siguiente);
		}
	}

	function onKeydown(campo: CampoFecha, event: KeyboardEvent) {
		if (disabled) return;
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			emitir(ajustarCampo(partes, campo, 1));
			return;
		}
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			emitir(ajustarCampo(partes, campo, -1));
			return;
		}
		const el = event.currentTarget as HTMLInputElement;
		if (event.key === 'ArrowRight' && el.selectionStart === el.value.length) {
			const siguiente = siguienteCampo(campo);
			if (siguiente) {
				event.preventDefault();
				focusCampo(siguiente);
			}
		}
		if (event.key === 'ArrowLeft' && el.selectionStart === 0) {
			const anterior = campo === 'mes' ? 'dia' : campo === 'anio' ? 'mes' : null;
			if (anterior) {
				event.preventDefault();
				focusCampo(anterior);
			}
		}
	}

	function onPaste(event: ClipboardEvent) {
		const texto = event.clipboardData?.getData('text') ?? '';
		const pegado = parsearPegado(texto);
		if (!pegado) return;
		event.preventDefault();
		editando = null;
		emitir(pegado);
	}

	const inputClass =
		'w-7 bg-transparent p-0 text-center tabular-nums outline-none focus:bg-blue-50 rounded disabled:text-gray-400';
</script>

<div
	class="inline-flex items-center gap-0.5 rounded-md border border-gray-300 bg-white px-2.5 py-2 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 {disabled
		? 'cursor-not-allowed bg-gray-50'
		: ''} {className}"
	role="group"
	aria-label={ariaLabel}
>
	<input
		bind:this={inputDia}
		id={id ? `${id}-dia` : undefined}
		class="{inputClass} w-7"
		inputmode="numeric"
		maxlength="2"
		autocomplete="off"
		spellcheck="false"
		aria-label="Día"
		{disabled}
		value={textos.dia}
		on:focus={(e) => onFocus('dia', e)}
		on:blur={() => onBlur('dia')}
		on:input={(e) => onInput('dia', e)}
		on:keydown={(e) => onKeydown('dia', e)}
		on:wheel|preventDefault={(e) => onWheel('dia', e)}
		on:paste={onPaste}
	/>
	<span class="select-none text-gray-400" aria-hidden="true">/</span>
	<input
		bind:this={inputMes}
		id={id ? `${id}-mes` : undefined}
		class="{inputClass} w-7"
		inputmode="numeric"
		maxlength="2"
		autocomplete="off"
		spellcheck="false"
		aria-label="Mes"
		{disabled}
		value={textos.mes}
		on:focus={(e) => onFocus('mes', e)}
		on:blur={() => onBlur('mes')}
		on:input={(e) => onInput('mes', e)}
		on:keydown={(e) => onKeydown('mes', e)}
		on:wheel|preventDefault={(e) => onWheel('mes', e)}
		on:paste={onPaste}
	/>
	<span class="select-none text-gray-400" aria-hidden="true">/</span>
	<input
		bind:this={inputAnio}
		id={id ? `${id}-anio` : undefined}
		class="{inputClass} w-12"
		inputmode="numeric"
		maxlength="4"
		autocomplete="off"
		spellcheck="false"
		aria-label="Año"
		{disabled}
		value={textos.anio}
		on:focus={(e) => onFocus('anio', e)}
		on:blur={() => onBlur('anio')}
		on:input={(e) => onInput('anio', e)}
		on:keydown={(e) => onKeydown('anio', e)}
		on:wheel|preventDefault={(e) => onWheel('anio', e)}
		on:paste={onPaste}
	/>
</div>
