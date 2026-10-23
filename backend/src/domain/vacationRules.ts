// Business rules 1, 2 and 4. Dates are "YYYY-MM-DD" strings, so lexicographic
// comparison is also chronological and no timezone ever enters the calculation.
// Callers pass the rows in, which keeps every rule a pure function of its inputs.

export type DateRange = {
	startDate: string;
	endDate: string;
};

export const todayUtc = (): string => new Date().toISOString().slice(0, 10);

// Rule 1 — the spec requires the end date to be strictly after the start date,
// so a single-day request is rejected (noted as a limitation in the README).
export const endsAfterStart = (range: DateRange): boolean => range.endDate > range.startDate;

// Rule 4 — a request may start today, but not before.
export const startsNotInPast = (range: DateRange, today: string = todayUtc()): boolean =>
	range.startDate >= today;

// Rule 2 — two ranges overlap unless one ends before the other begins.
export const overlapsAny = (existing: DateRange[], range: DateRange): boolean =>
	existing.some(
		(other) => other.startDate <= range.endDate && other.endDate >= range.startDate
	);
