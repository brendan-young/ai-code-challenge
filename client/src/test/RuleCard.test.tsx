import { render, screen, fireEvent } from '@testing-library/react';
import { test, expect, vi } from 'vitest';
import RuleCard, { type RuleCardData } from '../components/RuleCard';

const rule: RuleCardData = {
	id: '1',
	name: 'Sales AU',
	active: false,
	assignee: { name: 'Jane', email: 'jane@example.com' },
	conditions: [{ field: 'location', operator: 'equals', value: 'Australia' }],
	notes: 'Route to AU team',
	updatedAt: '2024-01-01',
};

test('renders rule info and tags', () => {
	render(<RuleCard rule={rule} onEdit={() => {}} onDelete={() => {}} />);
	expect(screen.getByText('Sales AU')).toBeInTheDocument();
	expect(screen.getByText(/inactive/i)).toBeInTheDocument();
	expect(screen.getByText(/jane@example.com/i)).toBeInTheDocument();
	expect(screen.getByText(/location equals Australia/i)).toBeInTheDocument();
});

test('fires callbacks', () => {
	const onEdit = vi.fn();
	const onDelete = vi.fn();
	render(<RuleCard rule={rule} onEdit={onEdit} onDelete={onDelete} />);
	fireEvent.click(screen.getByRole('button', { name: /edit/i }));
	fireEvent.click(screen.getByRole('button', { name: /delete/i }));
	expect(onEdit).toHaveBeenCalledTimes(1);
	expect(onDelete).toHaveBeenCalledTimes(1);
});
