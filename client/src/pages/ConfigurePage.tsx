import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import RuleModal from '../components/RuleModal';
import RuleCard from '../components/RuleCard';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { createRule, deleteRule, listRules, Rule, RuleDraft, updateRule } from '../api/rules';
import { Button } from '@/components/ui/button';

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
			const fetched = await listRules();
			setRules(fetched);
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
			const created = await createRule(draft);
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
			const updated = await updateRule(editingRuleId, draft);
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
			await deleteRule(deleteTarget.id);
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
		<div className="mx-auto w-full max-w-5xl rounded-2xl bg-slate-900/70 p-8 text-slate-100 shadow-[inset_0_1px_0_rgba(148,163,184,0.08)]">
			<header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
						Routing rules
					</p>
					<h1 className="text-3xl font-bold leading-tight text-white">Configure triage</h1>
					<p className="mt-1 text-sm text-slate-400 pb-4">
						Review the current routing rules that drive the chat assistant.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Button
						type="button"
						onClick={openCreateModal}
						variant="secondary"
						className="border border-sky-400/40 bg-sky-500/55 px-3.5 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-500/85"
					>
						New rule
					</Button>
					<div className="rounded-full border border-sky-400/40 bg-sky-500/15 px-3.5 py-2 text-sm font-semibold text-sky-100">
						{activeCount} active
					</div>
				</div>
			</header>

			{loading && (
				<div className="rounded-xl border border-slate-500/30 bg-slate-600/20 px-4 py-3 text-slate-100">
					Loading rules…
				</div>
			)}
			{error && (
				<div className="rounded-xl border border-red-400/50 bg-red-500/15 px-4 py-3 text-red-100">
					Error: {error}
				</div>
			)}

			{!loading && !error && rules.length === 0 && (
				<div className="rounded-xl border border-slate-500/30 bg-slate-600/20 px-4 py-3 text-slate-100">
					No rules yet. Add one to get started.
				</div>
			)}

			{!loading && !error && rules.length > 0 && (
				<div className="flex flex-col gap-4">
					{rules.map((rule, idx) => (
						<RuleCard
							key={rule.id ?? idx}
							rule={rule}
							onEdit={openEditModal}
							onDelete={openDeleteModal}
						/>
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
