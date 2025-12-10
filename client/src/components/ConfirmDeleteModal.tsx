import { FormEvent, useEffect, useState } from 'react';
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

type ConfirmDeleteModalProps = {
	open: boolean;
	ruleName?: string;
	onClose: () => void;
	onConfirm: () => Promise<void> | void;
	saving?: boolean;
	error?: string | null;
};

export default function ConfirmDeleteModal({
	open,
	ruleName,
	onClose,
	onConfirm,
	saving = false,
	error = null,
}: ConfirmDeleteModalProps) {
	const [input, setInput] = useState('');

	useEffect(() => {
		if (open) {
			setInput('');
		}
	}, [open]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (input.trim() !== (ruleName ?? '')) return;
		await onConfirm();
	};

	const canDelete = input.trim() === (ruleName ?? '');

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent>
				<DialogHeader>
					<p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
						Confirm delete
					</p>
					<DialogTitle>Delete "{ruleName || 'this rule'}"?</DialogTitle>
					<DialogDescription className="text-slate-300">
						This action cannot be undone. Type the rule name to confirm.
					</DialogDescription>
				</DialogHeader>

				<form className="space-y-6" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<label className="text-sm font-medium text-slate-200" htmlFor="rule-name">
							Rule name
						</label>
						<Input
							id="rule-name"
							type="text"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder={ruleName}
							autoFocus
							className="bg-slate-800/60 text-white border-slate-700/70 placeholder:text-slate-400 focus-visible:ring-slate-300/70"
						/>
					</div>

					{error && (
						<div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{error}
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
							disabled={!canDelete || saving}
							variant="destructive"
							className="bg-red-500 text-white hover:bg-red-500/90"
						>
							{saving ? 'Deleting…' : 'Delete rule'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
