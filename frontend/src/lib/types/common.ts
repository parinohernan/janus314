export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	message?: string;
	error?: string;
	meta?: {
		totalItems: number;
		itemsPerPage: number;
		currentPage: number;
		totalPages: number;
	};
}
