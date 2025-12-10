import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import RuleModal from '../components/RuleModal';

const baseProps = () => ({
	open: true,
	mode: 'create' as const,
	onClose: vi.fn(),
	onSave: vi.fn(),
	saving: false,
	error: null,
});

describe('RuleModal', () => {
	test('shows create mode heading and helper copy', () => {
		render(<RuleModal {...baseProps()} />);

		expect(screen.getByText(/new rule/i)).toBeInTheDocument();
		expect(
			screen.getByText(/Define routing details and required conditions./i)
		).toBeInTheDocument();
	});

	test('validates required fields before submit', async () => {
		render(<RuleModal {...baseProps()} />);

		fireEvent.click(screen.getByRole('button', { name: /create rule/i }));

		expect(await screen.findByText(/Rule name is required/i)).toBeInTheDocument();
	});
});
