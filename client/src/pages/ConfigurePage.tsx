import '../styles/configure-page.styles.css';

import { useEffect, useMemo, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

type Condition = {
	field: string;
	op: string;
	value: string | string[];
};

type Rule = {
	id?: string;
	name: string;
	active: boolean;
	conditions: Condition[];
	assignee: { name: string; email: string };
	notes?: string;
	updatedAt?: string;
};

export default function ConfigurePage() {
	const [rules, setRules] = useState<Rule[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadRules = async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`${API_BASE_URL}/api/rules`);
			if (!res.ok) {
				throw new Error('Failed to fetch rules');
			}
			const data = (await res.json()) as Rule[];
			setRules(data);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unable to load rules';
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadRules();
	}, []);

	const activeCount = useMemo(() => rules.filter((r) => r.active).length, [rules]);

	const formatCondition = (cond: Condition) => {
		const value = Array.isArray(cond.value) ? cond.value.join(', ') : cond.value;
		return `${cond.field} ${cond.op} ${value}`;
	};

	return (
		<div className="configure-page">
			<header className="configure-header">
				<div>
					<p className="eyebrow">Routing rules</p>
					<h1>Configure triage</h1>
					<p className="subtitle">
						Review the current routing rules that drive the chat assistant.
					</p>
				</div>
				<div className="pill">{activeCount} active</div>
			</header>

			{loading && <div className="notice">Loading rules…</div>}
			{error && <div className="notice error">Error: {error}</div>}

			{!loading && !error && rules.length === 0 && (
				<div className="notice">No rules yet. Add one to get started.</div>
			)}

			{!loading && !error && rules.length > 0 && (
				<div className="rule-list">
					{rules.map((rule, idx) => (
						<div className="rule-card" key={rule.id ?? idx}>
							<div className="rule-card__row">
								<div>
									<div className="rule-name">
										{rule.name}
										{!rule.active && <span className="tag muted">Inactive</span>}
									</div>
									{rule.notes && <p className="rule-notes">{rule.notes}</p>}
								</div>
								<div className="tag">
									{rule.assignee.name} · {rule.assignee.email}
								</div>
							</div>

							<div className="rule-card__row meta">
								{rule.updatedAt && (
									<div className="tag muted">
										Updated {new Date(rule.updatedAt).toLocaleDateString()}
									</div>
								)}
							</div>

							<div className="conditions">
								{rule.conditions.map((cond, cIdx) => (
									<span className="chip" key={cIdx}>
										{formatCondition(cond)}
									</span>
								))}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
