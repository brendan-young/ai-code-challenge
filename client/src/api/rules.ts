const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8999';

export type Condition = {
	field: string;
	operator: string;
	value: string | string[];
};

export type Rule = {
	id?: string;
	name: string;
	active: boolean;
	conditions: Condition[];
	assignee: { name: string; email: string };
	notes?: string;
	createdAt?: string;
	updatedAt?: string;
};

export type RuleDraft = Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>;

export async function listRules(): Promise<Rule[]> {
	const res = await fetch(`${API_BASE_URL}/api/rules`);
	if (!res.ok) {
		throw new Error('Failed to fetch rules');
	}
	const data = (await res.json()) as Rule[];
	return data;
}

export async function createRule(draft: RuleDraft): Promise<Rule> {
	const res = await fetch(`${API_BASE_URL}/api/rules`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(draft),
	});

	if (!res.ok) {
		throw new Error('Failed to create rule');
	}

	const created = (await res.json()) as Rule;
	return created;
}

export async function updateRule(id: string, draft: RuleDraft): Promise<Rule> {
	const res = await fetch(`${API_BASE_URL}/api/rules/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(draft),
	});

	if (!res.ok) {
		throw new Error('Failed to update rule');
	}

	const updated = (await res.json()) as Rule;
	return updated;
}

export async function deleteRule(id: string): Promise<void> {
	const res = await fetch(`${API_BASE_URL}/api/rules/${id}`, {
		method: 'DELETE',
	});

	if (!res.ok) {
		throw new Error('Failed to delete rule');
	}
}
