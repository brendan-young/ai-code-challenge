import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { RuleDraft } from '../api/rules';
import '../styles/modal.styles.css';

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

	const conditionValue = useMemo(
		() => ({
			requestType: draft.conditions.find((c) => c.field === 'requestType')?.value ?? '',
			location: draft.conditions.find((c) => c.field === 'location')?.value ?? '',
			department: draft.conditions.find((c) => c.field === 'department')?.value ?? '',
			keywords: draft.conditions.find((c) => c.field === 'keywords')?.value ?? '',
		}),
		[draft.conditions]
	);

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

	if (!open) return null;

	return (
		<div className="modal-backdrop" role="dialog" aria-modal="true">
			<div className="modal">
				<div className="modal__header">
					<div>
						<p className="eyebrow">{mode === 'create' ? 'New rule' : 'Edit rule'}</p>
						<h2>{draft.name || (mode === 'create' ? 'Create rule' : 'Update rule')}</h2>
					</div>
					<button className="ghost-btn" type="button" onClick={onClose}>
						Close
					</button>
				</div>

				<form className="modal__body" onSubmit={handleSubmit}>
					<div className="form-grid">
						<label className="field">
							<span>Rule name</span>
							<input
								type="text"
								value={draft.name}
								onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
								placeholder="e.g. Sales AU"
							/>
						</label>

						<label className="field">
							<span>Assignee name</span>
							<input
								type="text"
								value={draft.assignee.name}
								onChange={(e) =>
									setDraft((prev) => ({
										...prev,
										assignee: { ...prev.assignee, name: e.target.value },
									}))
								}
								placeholder="Jane Doe"
							/>
						</label>

						<label className="field">
							<span>Assignee email</span>
							<input
								type="email"
								value={draft.assignee.email}
								onChange={(e) =>
									setDraft((prev) => ({
										...prev,
										assignee: { ...prev.assignee, email: e.target.value },
									}))
								}
								placeholder="jane@acme.corp"
							/>
						</label>

						<label className="field checkbox">
							<input
								type="checkbox"
								checked={draft.active}
								onChange={(e) => setDraft((prev) => ({ ...prev, active: e.target.checked }))}
							/>
							<span>Active</span>
						</label>
					</div>

					<div className="form-grid">
						<label className="field">
							<span>Request type</span>
							<input
								type="text"
								value={String(conditionValue.requestType)}
								onChange={(e) => updateCondition('requestType', e.target.value)}
								placeholder="sales contract, employment_contract…"
							/>
						</label>

						<label className="field">
							<span>Location</span>
							<input
								type="text"
								value={String(conditionValue.location)}
								onChange={(e) => updateCondition('location', e.target.value)}
								placeholder="Australia, United States…"
							/>
						</label>

						<label className="field">
							<span>Department</span>
							<input
								type="text"
								value={String(conditionValue.department ?? '')}
								onChange={(e) => updateCondition('department', e.target.value)}
								placeholder="Sales, Marketing…"
							/>
						</label>

						<label className="field">
							<span>Keywords (comma-separated, optional)</span>
							<input
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
							/>
						</label>
					</div>

					<label className="field">
						<span>Notes (optional)</span>
						<textarea
							value={draft.notes ?? ''}
							onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))}
							placeholder="Routing rationale or special cases"
							rows={3}
						/>
					</label>

					{(localError || error) && <div className="notice error">{localError || error}</div>}

					<div className="modal__footer">
						<button className="ghost-btn" type="button" onClick={onClose} disabled={saving}>
							Cancel
						</button>
						<button className="primary-btn" type="submit" disabled={saving}>
							{saving ? 'Saving…' : mode === 'create' ? 'Create rule' : 'Save changes'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
