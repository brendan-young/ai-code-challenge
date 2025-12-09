import '../styles/configure-page.styles.css';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import RuleModal, { RuleDraft } from '../components/RuleModal';
import RuleCard, { RuleCardData } from '../components/RuleCard';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import '../styles/rule-card.styles.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8999';

type Condition = {
	field: string;
	operator: string;
	value: string | string[];
};

type Rule = RuleCardData;

export default function ConfigurePage() {
	const [rules, setRules] = useState<Rule[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [saving, setSaving] = useState(false);
	const [modalError, setModalError] = useState<string | null>(null);
	const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
	const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
	const [editingInitial, setEditingInitial] = useState<RuleDraft | undefined>(undefined);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<Rule | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	const loadRules = async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`${API_BASE_URL}/api/rules`);
			if (!res.ok) {
				throw new Error('Failed to fetch rules');
			}
			const data = (await res.json()) as Rule[];
			const normalized = data.map((rule) => ({
				...rule,
				conditions: rule.conditions.map((cond) => ({
					...cond,
					operator: cond.operator ?? (cond as { op?: string }).op ?? '',
				})),
			}));
			setRules(normalized);
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

	const handleCreateRule = async (draft: RuleDraft) => {
		setSaving(true);
		setModalError(null);
		try {
			const res = await fetch(`${API_BASE_URL}/api/rules`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(draft),
			});

			if (!res.ok) {
				throw new Error('Failed to create rule');
			}

			const created = (await res.json()) as Rule;
			setRules((prev) => [...prev, created]);
			setIsModalOpen(false);
			toast.success(`Created rule "${created.name}"`);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unable to create rule';
			setModalError(message);
		} finally {
			setSaving(false);
		}
	};

	const handleUpdateRule = async (draft: RuleDraft) => {
		if (!editingRuleId) {
			setModalError('No rule selected.');
			return;
		}

		setSaving(true);
		setModalError(null);
		try {
			const res = await fetch(`${API_BASE_URL}/api/rules/${editingRuleId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(draft),
			});

			if (!res.ok) {
				throw new Error('Failed to update rule');
			}

			const updated = (await res.json()) as Rule;
			setRules((prev) => prev.map((rule) => (rule.id === updated.id ? updated : rule)));
			setIsModalOpen(false);
			setEditingRuleId(null);
			setEditingInitial(undefined);
			toast.success(`Updated rule "${updated.name}"`);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unable to update rule';
			setModalError(message);
		} finally {
			setSaving(false);
		}
	};

	const ruleToDraft = (rule: Rule): RuleDraft => ({
		name: rule.name,
		active: rule.active,
		assignee: { ...rule.assignee },
		conditions: rule.conditions.map((cond) => ({
			field: cond.field,
			operator: cond.operator,
			value: cond.value,
		})),
		notes: rule.notes ?? '',
	});

	const openCreateModal = () => {
		setModalMode('create');
		setEditingRuleId(null);
		setEditingInitial(undefined);
		setModalError(null);
		setIsModalOpen(true);
	};

	const openEditModal = (rule: Rule) => {
		setModalMode('edit');
		setEditingRuleId(rule.id ?? null);
		setEditingInitial(ruleToDraft(rule));
		setModalError(null);
		setIsModalOpen(true);
	};

	const openDeleteModal = (rule: Rule) => {
		setDeleteTarget(rule);
		setDeleteError(null);
		setIsDeleteModalOpen(true);
	};

	const handleDeleteRule = async () => {
		if (!deleteTarget || !deleteTarget.id) {
			setDeleteError('No rule selected to delete.');
			return;
		}
		setDeleting(true);
		setDeleteError(null);
		try {
			const res = await fetch(`${API_BASE_URL}/api/rules/${deleteTarget.id}`, {
				method: 'DELETE',
			});

			if (!res.ok) {
				throw new Error('Failed to delete rule');
			}

			setRules((prev) => prev.filter((rule) => rule.id !== deleteTarget.id));
			toast.success(`Deleted rule "${deleteTarget.name}"`);
			setIsDeleteModalOpen(false);
			setDeleteTarget(null);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unable to delete rule';
			setDeleteError(message);
		} finally {
			setDeleting(false);
		}
	};

	const handleSave = (draft: RuleDraft) => {
		if (modalMode === 'edit') {
			return handleUpdateRule(draft);
		}
		return handleCreateRule(draft);
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
				<div className="header-actions">
					<button className="primary-btn" type="button" onClick={openCreateModal}>
						New rule
					</button>
					<div className="pill">{activeCount} active</div>
				</div>
			</header>

			{loading && <div className="notice">Loading rules…</div>}
			{error && <div className="notice error">Error: {error}</div>}

			{!loading && !error && rules.length === 0 && (
				<div className="notice">No rules yet. Add one to get started.</div>
			)}

			{!loading && !error && rules.length > 0 && (
				<div className="rule-list">
					{rules.map((rule, idx) => (
						<RuleCard key={rule.id ?? idx} rule={rule} onEdit={openEditModal} onDelete={openDeleteModal} />
					))}
				</div>
			)}

			<RuleModal
				open={isModalOpen}
				mode={modalMode}
				onClose={() => {
					setModalError(null);
					setIsModalOpen(false);
					setEditingRuleId(null);
					setEditingInitial(undefined);
				}}
				onSave={handleSave}
				saving={saving}
				error={modalError}
				initialValue={editingInitial}
			/>
			<ConfirmDeleteModal
				open={isDeleteModalOpen}
				ruleName={deleteTarget?.name}
				onClose={() => {
					setDeleteError(null);
					setIsDeleteModalOpen(false);
					setDeleteTarget(null);
				}}
				onConfirm={handleDeleteRule}
				saving={deleting}
				error={deleteError}
			/>
		</div>
	);
}
