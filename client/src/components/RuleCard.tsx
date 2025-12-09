import '../styles/rule-card.styles.css';

type Condition = {
	field: string;
	operator: string;
	value: string | string[];
};

export type RuleCardData = {
	id?: string;
	name: string;
	active: boolean;
	conditions: Condition[];
	assignee: { name: string; email: string };
	notes?: string;
	updatedAt?: string;
};

type RuleCardProps = {
	rule: RuleCardData;
	onEdit: (rule: RuleCardData) => void;
	onDelete: (rule: RuleCardData) => void;
};

const formatCondition = (cond: Condition) => {
	const value = Array.isArray(cond.value) ? cond.value.join(', ') : cond.value;
	return `${cond.field} ${cond.operator} ${value}`;
};

export default function RuleCard({ rule, onEdit, onDelete }: RuleCardProps) {
	return (
		<div className="rule-card">
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
			<div className="rule-actions">
				<div className="rule-actions__buttons">
					<button className="ghost-btn" type="button" onClick={() => onEdit(rule)}>
						Edit
					</button>
					<button className="danger-btn" type="button" onClick={() => onDelete(rule)}>
						Delete
					</button>
				</div>
			</div>
		</div>
	);
}
