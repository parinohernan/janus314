import { describe, expect, it, beforeEach } from 'vitest';
import {
	POS_PANTALLA_STORAGE_KEY,
	aplicarPantallaPos,
	loadPosPantallaConfig,
	quitarPantallaPos,
	savePosPantallaConfig,
	tamanoSugerido
} from '../src/lib/utils/posPantallaConfig';

describe('posPantallaConfig', () => {
	beforeEach(() => {
		localStorage.removeItem(POS_PANTALLA_STORAGE_KEY);
		quitarPantallaPos();
	});

	it('arranca en tamaño normal y modo claro', () => {
		expect(loadPosPantallaConfig()).toEqual({ tamano: 'normal', oscuro: false });
	});

	it('persiste tamaño y modo oscuro', () => {
		savePosPantallaConfig({ tamano: '14', oscuro: true });
		expect(loadPosPantallaConfig()).toEqual({ tamano: '14', oscuro: true });
	});

	it('ignora valores guardados inválidos', () => {
		localStorage.setItem(POS_PANTALLA_STORAGE_KEY, JSON.stringify({ tamano: '21', oscuro: 'si' }));
		expect(loadPosPantallaConfig()).toEqual({ tamano: 'normal', oscuro: false });
		localStorage.setItem(POS_PANTALLA_STORAGE_KEY, '{roto');
		expect(loadPosPantallaConfig()).toEqual({ tamano: 'normal', oscuro: false });
	});

	it('sugiere el tamaño según el alto de la pantalla', () => {
		expect(tamanoSugerido(1366, 768)).toBe('14');
		expect(tamanoSugerido(1280, 720)).toBe('14');
		expect(tamanoSugerido(1440, 900)).toBe('15');
		expect(tamanoSugerido(1600, 900)).toBe('15');
		expect(tamanoSugerido(1920, 1080)).toBe('normal');
	});

	it('aplica zoom y clase dark en html y los quita al salir', () => {
		const html = document.documentElement;
		aplicarPantallaPos({ tamano: '15', oscuro: true });
		expect(html.style.zoom).toBe('0.9');
		expect(html.style.getPropertyValue('--pos-zoom')).toBe('0.9');
		expect(html.classList.contains('dark')).toBe(true);

		aplicarPantallaPos({ tamano: 'normal', oscuro: false });
		expect(html.style.zoom).toBe('');
		expect(html.style.getPropertyValue('--pos-zoom')).toBe('');
		expect(html.classList.contains('dark')).toBe(false);

		aplicarPantallaPos({ tamano: '14', oscuro: true });
		quitarPantallaPos();
		expect(html.style.zoom).toBe('');
		expect(html.classList.contains('dark')).toBe(false);
	});
});
