declare module 'qz-tray' {
	const qz: {
		websocket: {
			connect: (opts?: object) => Promise<void>;
			disconnect: () => Promise<void>;
			isActive: () => boolean;
		};
		printers: { find: () => Promise<string[]> };
		configs: { create: (printer: string, opts?: object) => unknown };
		print: (config: unknown, data: unknown[]) => Promise<void>;
		security: {
			setCertificatePromise: (
				fn: (resolve: (v: string) => void, reject?: (e?: unknown) => void) => void
			) => void;
			setSignaturePromise: (
				fn: (toSign: string) => (resolve: (v: string) => void, reject: (e?: unknown) => void) => void
			) => void;
			setSignatureAlgorithm: (alg: string) => void;
		};
	};
	export default qz;
}
