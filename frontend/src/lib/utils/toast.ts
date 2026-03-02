/**
 * Utilidades de notificación basadas en svelte-sonner.
 * Reemplaza alert() y confirm() nativos por una experiencia más moderna.
 */
import { toast as sonnerToast } from 'svelte-sonner';

export const toast = {
	/** Mensaje de éxito (verde) */
	success: (message: string) => sonnerToast.success(message),
	/** Mensaje de error (rojo) */
	error: (message: string) => sonnerToast.error(message),
	/** Mensaje informativo (azul) */
	info: (message: string) => sonnerToast.info(message),
	/** Mensaje de advertencia (amarillo) */
	warning: (message: string) => sonnerToast.warning(message),
	/** Toast neutro */
	message: (message: string) => sonnerToast(message),
	/** Cerrar todos los toasts */
	dismiss: (id?: number | string) => sonnerToast.dismiss(id),
};

/**
 * Diálogo de confirmación que reemplaza confirm() nativo.
 * Muestra un toast con botones Sí/No y retorna una Promise<boolean>.
 */
export function confirm(message: string, options?: { confirmLabel?: string; cancelLabel?: string }): Promise<boolean> {
	const { confirmLabel = 'Sí', cancelLabel = 'No' } = options ?? {};

	return new Promise((resolve) => {
		const id = sonnerToast(message, {
			duration: Number.POSITIVE_INFINITY,
			dismissable: true,
			action: {
				label: confirmLabel,
				onClick: () => {
					sonnerToast.dismiss(id);
					resolve(true);
				},
			},
			cancel: {
				label: cancelLabel,
				onClick: () => {
					sonnerToast.dismiss(id);
					resolve(false);
				},
			},
			onDismiss: () => resolve(false),
		});
	});
}
