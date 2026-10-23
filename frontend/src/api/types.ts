export type UserRole = "Requester" | "Validator";

export type VacationStatus = "Pending" | "Approved" | "Rejected";

export interface User {
	id: string;
	name: string;
	email: string;
	role: UserRole;
}

export interface VacationRequest {
	id: string;
	userId: string;
	startDate: string;
	endDate: string;
	reason: string | null;
	status: VacationStatus;
	comments: string | null;
	createdAt: string;
	updatedAt: string;
	user?: Pick<User, "id" | "name"> & Partial<Pick<User, "email" | "role">>;
}

export interface Paginated<T> {
	data: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}
