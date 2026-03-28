/**
 * Iguala la altura de cada fila de `rightTable` (thead + tbody) a la fila correspondiente de `leftTable`.
 * Útil cuando la tabla de datos hace scroll horizontal y la columna de acciones está en otra tabla fija a la derecha.
 */
export function syncStackedTableRowHeights(
	leftTable: HTMLTableElement,
	rightTable: HTMLTableElement
): void {
	const syncPair = (leftRow: Element | null, rightRow: Element | null) => {
		if (!(leftRow instanceof HTMLTableRowElement) || !(rightRow instanceof HTMLTableRowElement)) return;
		rightRow.style.height = '';
		const h = leftRow.getBoundingClientRect().height;
		if (h > 0) rightRow.style.height = `${h}px`;
	};

	syncPair(leftTable.querySelector('thead tr'), rightTable.querySelector('thead tr'));

	const lRows = leftTable.querySelectorAll<HTMLTableRowElement>('tbody tr');
	const rRows = rightTable.querySelectorAll<HTMLTableRowElement>('tbody tr');
	lRows.forEach((lr, i) => syncPair(lr, rRows[i] ?? null));
}
