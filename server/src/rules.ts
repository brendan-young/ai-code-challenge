import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const RULES_PATH = path.resolve(__dirname, '../data/rules.json');

export type ConditionOperator = 'equals' | 'oneOf' | 'includes';

type RuleCondition = {
	field: 'requestType' | 'department' | 'location' | 'seniority' | 'keywords';
	op: ConditionOperator;
	value: string | string[]; // keywords can be array
};

export type Rule = {
	id: string;
	name: string; // e.g., "Sales AU"
	active: boolean;
	conditions: RuleCondition[];
	assignee: { name: string; email: string };
	notes?: string;
	createdAt: string;
	updatedAt: string;
};

export type RuleSet = Rule[];

export type RuleInput = Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>;

const withDefaults = (rule: Partial<Rule> & RuleInput): Rule => ({
	id: rule.id ?? crypto.randomUUID(),
	createdAt: rule.createdAt ?? new Date().toISOString(),
	updatedAt: new Date().toISOString(),
	...rule,
});

async function loadRaw(): Promise<Rule[]> {
	const raw = await fs.readFile(RULES_PATH, 'utf8');
	const parsed = JSON.parse(raw);
	if (!Array.isArray(parsed)) return [];
	return parsed.map((r) => withDefaults(r));
}

async function save(rules: Rule[]) {
	await fs.mkdir(path.dirname(RULES_PATH), { recursive: true });
	await fs.writeFile(RULES_PATH, JSON.stringify(rules, null, 2), 'utf8');
}

export async function listRules(): Promise<Rule[]> {
	const rules = await loadRaw();
	return rules;
}

export async function createRule(input: RuleInput): Promise<Rule> {
	const rules = await loadRaw();
	const rule = withDefaults(input);
	rules.push(rule);
	await save(rules);
	return rule;
}

export async function updateRule(id: string, patch: Partial<RuleInput>): Promise<Rule | null> {
	const rules = await loadRaw();
	const idx = rules.findIndex((r) => r.id === id);
	if (idx === -1) return null;
	const merged = { ...rules[idx], ...patch, updatedAt: new Date().toISOString() };
	rules[idx] = merged;
	await save(rules);
	return merged;
}

export async function deleteRule(id: string): Promise<boolean> {
	const rules = await loadRaw();
	const next = rules.filter((r) => r.id !== id);
	if (next.length === rules.length) return false;
	await save(next);
	return true;
}
