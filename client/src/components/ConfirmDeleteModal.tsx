import { FormEvent, useEffect, useState } from 'react';
import '../styles/modal.styles.css';

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

	if (!open) return null;

	const canDelete = input.trim() === (ruleName ?? '');

	return (
		<div className="modal-backdrop" role="dialog" aria-modal="true">
			<div className="modal">
				<div className="modal__header">
					<div>
						<p className="eyebrow">Confirm delete</p>
						<h2>Delete “{ruleName}”?</h2>
						<p className="subtitle">This action cannot be undone. Type the rule name to confirm.</p>
					</div>
					<button className="ghost-btn" type="button" onClick={onClose}>
						Close
					</button>
				</div>

				<form className="modal__body" onSubmit={handleSubmit}>
					<label className="field">
						<span>Rule name</span>
						<input
							type="text"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder={ruleName}
							autoFocus
						/>
					</label>

					{error && <div className="notice error">{error}</div>}

					<div className="modal__footer">
						<button className="ghost-btn" type="button" onClick={onClose} disabled={saving}>
							Cancel
						</button>
						<button className="danger-btn" type="submit" disabled={!canDelete || saving}>
							{saving ? 'Deleting…' : 'Delete rule'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
