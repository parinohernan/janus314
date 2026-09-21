/** Passthrough for QZ Tray's optional Chrome Local Network Access helper. */
export function detectLna(
	address: string,
	connectFn: (address: string) => Promise<unknown>
) {
	return connectFn(address);
}

export class LnaError extends Error {
	denied = false;
}

const lna = { detectLna, LnaError };
export default lna;
