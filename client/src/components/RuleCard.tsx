import { Button } from '@/components/ui/button';

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
		<div className="rounded-xl border border-slate-600/40 bg-slate-800/90 p-4 text-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.35)]">
			<div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<div className="flex items-center gap-2 text-lg font-bold text-white">
						{rule.name}
						{!rule.active && (
							<span className="whitespace-nowrap rounded-full border border-slate-400/50 bg-slate-500/20 px-2.5 py-1 text-xs font-semibold text-slate-200">
								Inactive
							</span>
						)}
					</div>
					{rule.notes && <p className="mt-1 text-slate-300">{rule.notes}</p>}
				</div>
				<div className="whitespace-nowrap rounded-full border border-sky-400/40 bg-sky-500/15 px-3 py-1 text-sm font-semibold text-sky-100">
					{rule.assignee.name} · {rule.assignee.email}
				</div>
			</div>

			<div className="mt-1 flex flex-col gap-2 text-sm text-slate-300">
				{rule.updatedAt && <div>Updated {new Date(rule.updatedAt).toLocaleDateString()}</div>}
			</div>

			<div className="mt-3 flex flex-wrap gap-2">
				{rule.conditions.map((cond, cIdx) => (
					<span
						className="rounded-lg border border-slate-500/40 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-100"
						key={cIdx}
					>
						{formatCondition(cond)}
					</span>
				))}
			</div>
			<div className="mt-4 flex justify-end">
				<div className="flex gap-2">
					<Button
						variant="ghost"
						type="button"
						onClick={() => onEdit(rule)}
						className="border border-sky-400/40 bg-sky-500/55 px-3.5 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-500/85"
					>
						Edit
					</Button>
					<Button variant="destructive" type="button" onClick={() => onDelete(rule)}>
						Delete
					</Button>
				</div>
			</div>
		</div>
	);
}
