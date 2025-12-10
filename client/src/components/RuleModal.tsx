import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { RuleDraft } from '../api/rules';

export type ConditionDraft = {
	field: string;
	operator: string;
	value: string | string[];
};

type RuleModalProps = {
	open: boolean;
	mode?: 'create' | 'edit';
	initialValue?: RuleDraft;
	onClose: () => void;
	onSave: (draft: RuleDraft) => Promise<void> | void;
	saving?: boolean;
	error?: string | null;
};

const defaultDraft: RuleDraft = {
	name: '',
	active: true,
	conditions: [
		{ field: 'requestType', operator: 'equals', value: '' },
		{ field: 'location', operator: 'equals', value: '' },
	],
	assignee: { name: '', email: '' },
	notes: '',
};

export default function RuleModal({
	open,
	mode = 'create',
	initialValue,
	onClose,
	onSave,
	saving = false,
	error = null,
}: RuleModalProps) {
	const [draft, setDraft] = useState<RuleDraft>(initialValue ?? defaultDraft);
	const [localError, setLocalError] = useState<string | null>(null);

	useEffect(() => {
		if (open) {
			setDraft(initialValue ?? defaultDraft);
			setLocalError(null);
		}
	}, [open, initialValue]);

	const conditionValue = {
		requestType: draft.conditions.find((c) => c.field === 'requestType')?.value ?? '',
		location: draft.conditions.find((c) => c.field === 'location')?.value ?? '',
		department: draft.conditions.find((c) => c.field === 'department')?.value ?? '',
		keywords: draft.conditions.find((c) => c.field === 'keywords')?.value ?? '',
	};

	const updateCondition = (field: string, value: string | string[], operator = 'equals') => {
		setDraft((prev) => {
			const existing = prev.conditions.find((c) => c.field === field);
			let nextConditions = prev.conditions;

			if (existing) {
				nextConditions = prev.conditions.map((c) =>
					c.field === field ? { ...c, value, operator } : c
				);
			} else {
				nextConditions = [...prev.conditions, { field, operator, value }];
			}

			// prune empty values
			nextConditions = nextConditions.filter((c) => {
				if (Array.isArray(c.value)) return c.value.length > 0;
				return String(c.value).trim().length > 0;
			});

			return { ...prev, conditions: nextConditions };
		});
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLocalError(null);

		if (!draft.name.trim()) {
			setLocalError('Rule name is required.');
			return;
		}

		if (!draft.assignee.name.trim() || !draft.assignee.email.trim()) {
			setLocalError('Assignee name and email are required.');
			return;
		}

		if (!draft.conditions.length) {
			setLocalError('Add at least one condition.');
			return;
		}

		const requestTypeCond = draft.conditions.find((c) => c.field === 'requestType');
		const locationCond = draft.conditions.find((c) => c.field === 'location');
		if (!requestTypeCond || String(requestTypeCond.value).trim().length === 0) {
			setLocalError('Request type is required.');
			return;
		}

		if (!locationCond || String(locationCond.value).trim().length === 0) {
			setLocalError('Location is required.');
			return;
		}

		await onSave(draft);
	};

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent className="sm:max-w-3xl">
				<DialogHeader>
					<p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
						{mode === 'create' ? 'New rule' : 'Edit rule'}
					</p>
					<DialogTitle>{draft.name || (mode === 'create' ? 'Create rule' : 'Update rule')}</DialogTitle>
					<DialogDescription className="text-slate-300">
						Define routing details and required conditions.
					</DialogDescription>
				</DialogHeader>

				<form className="space-y-6" onSubmit={handleSubmit}>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-1.5">
							<label className="text-sm font-medium text-white" htmlFor="rule-name">
								Rule name
							</label>
							<Input
								id="rule-name"
								type="text"
								value={draft.name}
								onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
								placeholder="e.g. Sales AU"
								autoFocus
								className="bg-slate-800/60 text-white border-slate-700/70 placeholder:text-slate-400 focus-visible:ring-slate-300/70"
							/>
						</div>

						<div className="space-y-1.5">
							<label className="text-sm font-medium text-white" htmlFor="assignee-name">
								Assignee name
							</label>
							<Input
								id="assignee-name"
								type="text"
								value={draft.assignee.name}
								onChange={(e) =>
									setDraft((prev) => ({
										...prev,
										assignee: { ...prev.assignee, name: e.target.value },
									}))
								}
								placeholder="Jane Doe"
								className="bg-slate-800/60 text-white border-slate-700/70 placeholder:text-slate-400 focus-visible:ring-slate-300/70"
							/>
						</div>

						<div className="space-y-1.5">
							<label className="text-sm font-medium text-white" htmlFor="assignee-email">
								Assignee email
							</label>
							<Input
								id="assignee-email"
								type="email"
								value={draft.assignee.email}
								onChange={(e) =>
									setDraft((prev) => ({
										...prev,
										assignee: { ...prev.assignee, email: e.target.value },
									}))
								}
								placeholder="jane@acme.corp"
								className="bg-slate-800/60 text-white border-slate-700/70 placeholder:text-slate-400 focus-visible:ring-slate-300/70"
							/>
						</div>

						<label
							className="flex items-center gap-3 self-end rounded-md border border-input bg-muted/20 px-3 py-2 text-sm font-medium text-white shadow-sm"
							htmlFor="rule-active"
						>
							<input
								id="rule-active"
								type="checkbox"
								checked={draft.active}
								onChange={(e) => setDraft((prev) => ({ ...prev, active: e.target.checked }))}
								className="h-4 w-4 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
							/>
							<span>Active</span>
						</label>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-1.5">
							<label className="text-sm font-medium text-white" htmlFor="request-type">
								Request type
							</label>
							<Input
								id="request-type"
								type="text"
								value={String(conditionValue.requestType)}
								onChange={(e) => updateCondition('requestType', e.target.value)}
								placeholder="sales contract, employment_contract…"
								className="bg-slate-800/60 text-white border-slate-700/70 placeholder:text-slate-400 focus-visible:ring-slate-300/70"
							/>
						</div>

						<div className="space-y-1.5">
							<label className="text-sm font-medium text-white" htmlFor="location">
								Location
							</label>
							<Input
								id="location"
								type="text"
								value={String(conditionValue.location)}
								onChange={(e) => updateCondition('location', e.target.value)}
								placeholder="Australia, United States…"
								className="bg-slate-800/60 text-white border-slate-700/70 placeholder:text-slate-400 focus-visible:ring-slate-300/70"
							/>
						</div>

						<div className="space-y-1.5">
							<label className="text-sm font-medium text-white" htmlFor="department">
								Department
							</label>
							<Input
								id="department"
								type="text"
								value={String(conditionValue.department ?? '')}
								onChange={(e) => updateCondition('department', e.target.value)}
								placeholder="Sales, Marketing…"
								className="bg-slate-800/60 text-white border-slate-700/70 placeholder:text-slate-400 focus-visible:ring-slate-300/70"
							/>
						</div>

						<div className="space-y-1.5">
							<label className="text-sm font-medium text-white" htmlFor="keywords">
								Keywords (comma-separated, optional)
							</label>
							<Input
								id="keywords"
								type="text"
								value={
									Array.isArray(conditionValue.keywords)
										? conditionValue.keywords.join(', ')
										: String(conditionValue.keywords ?? '')
								}
								onChange={(e) => {
									const keywords = e.target.value
										.split(',')
										.map((k) => k.trim())
										.filter(Boolean);
									updateCondition('keywords', keywords, 'includes');
								}}
								placeholder="urgent, renewal…"
								className="bg-slate-800/60 text-white border-slate-700/70 placeholder:text-slate-400 focus-visible:ring-slate-300/70"
							/>
						</div>
					</div>

					<div className="space-y-1.5">
						<label className="text-sm font-medium text-white" htmlFor="notes">
							Notes (optional)
						</label>
						<Textarea
							id="notes"
							value={draft.notes ?? ''}
							onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))}
							placeholder="Routing rationale or special cases"
							rows={3}
							className="min-h-28 bg-slate-800/60 text-white border-slate-700/70 placeholder:text-slate-400 focus-visible:ring-slate-300/70"
						/>
					</div>

					{(localError || error) && (
						<div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{localError || error}
						</div>
					)}

					<DialogFooter>
						<Button
							type="button"
							onClick={onClose}
							disabled={saving}
							variant="outline"
							className="border-slate-700 bg-slate-900 text-white hover:bg-slate-800"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={saving}
							className="bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-300"
						>
							{saving ? 'Saving…' : mode === 'create' ? 'Create rule' : 'Save changes'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
