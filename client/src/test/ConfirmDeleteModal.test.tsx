import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

const baseProps = () => ({
	open: true,
	ruleName: 'My Rule',
	onClose: vi.fn(),
	onConfirm: vi.fn(),
	saving: false,
	error: null,
});

describe('ConfirmDeleteModal', () => {
	test('disables delete button until input matches rule name', () => {
		const onConfirm = vi.fn();
		render(<ConfirmDeleteModal {...baseProps()} onConfirm={onConfirm} />);

		const deleteBtn = screen.getByRole('button', { name: /delete rule/i });
		expect(deleteBtn).toBeDisabled();

		fireEvent.change(screen.getByLabelText(/rule name/i), { target: { value: 'Wrong Name' } });
		expect(deleteBtn).toBeDisabled();

		fireEvent.change(screen.getByLabelText(/rule name/i), { target: { value: 'My Rule' } });
		expect(deleteBtn).toBeEnabled();

		fireEvent.click(deleteBtn);
		expect(onConfirm).toHaveBeenCalledTimes(1);
	});
});
