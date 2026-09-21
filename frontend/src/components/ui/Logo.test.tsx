import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Logo from './Logo';

describe('Logo', () => {
  it('renders correctly', () => {
    const { container } = render(<Logo />);
    expect(container.querySelector('svg')).toBeDefined();
  });
});
