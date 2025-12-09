import { readFileSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

const RULES_PATH = path.resolve(__dirname, '../data/rules.json');

export type ConditionOperator = 'equals' | 'oneOf' | 'includes';

type RuleCondition = {
	field: 'requestType' | 'department' | 'location' | 'keywords';
	operator: ConditionOperator;
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

const rawSeed = readFileSync(RULES_PATH, 'utf8');
const parsedSeed = JSON.parse(rawSeed);
let rules: Rule[] = Array.isArray(parsedSeed) ? parsedSeed.map((r) => withDefaults(r)) : [];

export async function listRules(): Promise<Rule[]> {
	return rules;
}

export async function createRule(input: RuleInput): Promise<Rule> {
	const rule = withDefaults(input);
	rules.push(rule);
	return rule;
}

export async function updateRule(id: string, data: Partial<RuleInput>): Promise<Rule | null> {
	const idx = rules.findIndex((r) => r.id === id);
	if (idx === -1) return null;
	const merged = { ...rules[idx], ...data, updatedAt: new Date().toISOString() };
	rules[idx] = merged;
	return merged;
}

export async function deleteRule(id: string): Promise<boolean> {
	const before = rules.length;
	rules = rules.filter((r) => r.id !== id);
	return rules.length !== before;
}
