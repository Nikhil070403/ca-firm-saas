import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DataTable from './DataTable';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
];

describe('DataTable', () => {
  it('shows an empty state when there are no rows', () => {
    render(<DataTable columns={columns} rows={[]} emptyTitle="No clients yet" />);
    expect(screen.getByText('No clients yet')).toBeInTheDocument();
  });

  it('renders a row per item using each column\'s render function', () => {
    const rows = [{ _id: '1', name: 'Acme LLP', email: 'billing@acme.example' }];
    render(<DataTable columns={columns} rows={rows} />);

    expect(screen.getByText('Acme LLP')).toBeInTheDocument();
    expect(screen.getByText('billing@acme.example')).toBeInTheDocument();
  });

  it('calls onSearchChange as the user types in the search box', () => {
    const onSearchChange = vi.fn();
    render(<DataTable columns={columns} rows={[]} searchValue="" onSearchChange={onSearchChange} searchPlaceholder="Search clients…" />);

    const input = screen.getByPlaceholderText('Search clients…');
    fireEvent.change(input, { target: { value: 'acme' } });

    expect(onSearchChange).toHaveBeenCalledWith('acme');
  });
});
