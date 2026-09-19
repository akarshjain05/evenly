import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Select from './Select';

describe('Select', () => {
  const options = [
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' },
    { value: 'opt3', label: 'Option 3' },
  ];

  it('renders with placeholder', () => {
    render(<Select value="" onChange={vi.fn()} options={options} placeholder="Choose..." />);
    expect(screen.getByText('Choose...')).toBeTruthy();
  });

  it('renders with selected option', () => {
    render(<Select value="opt2" onChange={vi.fn()} options={options} />);
    expect(screen.getByText('Option 2')).toBeTruthy();
  });

  it('opens listbox on click', () => {
    render(<Select value="" onChange={vi.fn()} options={options} placeholder="Choose..." />);
    expect(screen.queryByRole('listbox')).toBeNull();
    
    fireEvent.click(screen.getByRole('button', { name: /choose/i }));
    
    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('selects an option on click', () => {
    const handleChange = vi.fn();
    render(<Select value="" onChange={handleChange} options={options} placeholder="Choose..." />);
    
    fireEvent.click(screen.getByRole('button', { name: /choose/i }));
    fireEvent.click(screen.getByText('Option 3'));
    
    expect(handleChange).toHaveBeenCalledWith('opt3');
  });

  it('supports keyboard navigation', () => {
    const handleChange = vi.fn();
    render(<Select value="" onChange={handleChange} options={options} placeholder="Choose..." />);
    
    const button = screen.getByRole('button', { name: /choose/i });
    
    // Open with Enter
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(screen.getByRole('listbox')).toBeTruthy();
    
    // Navigate with arrow down
    const container = button.parentElement!;
    fireEvent.keyDown(container, { key: 'ArrowDown' }); // Focuses opt1
    fireEvent.keyDown(container, { key: 'ArrowDown' }); // Focuses opt2
    
    // Select with Enter
    fireEvent.keyDown(container, { key: 'Enter' });
    
    expect(handleChange).toHaveBeenCalledWith('opt3');
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
