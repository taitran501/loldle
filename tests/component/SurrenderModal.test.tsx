import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SurrenderModal } from '../../src/components/SurrenderModal';

describe('SurrenderModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <SurrenderModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        streak={5}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders confirmation text and streak warning when streak > 0', () => {
    render(
      <SurrenderModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        streak={7}
      />
    );

    expect(screen.getByText('Surrender Round?')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText(/your current streak of/i)).toBeInTheDocument();
  });

  it('renders loss warning when streak is 0', () => {
    render(
      <SurrenderModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        streak={0}
      />
    );

    expect(screen.getByText(/this round will be counted as a loss/i)).toBeInTheDocument();
  });

  it('calls onClose when clicking Keep Trying button', () => {
    const onClose = vi.fn();
    render(
      <SurrenderModal
        isOpen={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        streak={3}
      />
    );

    const keepTryingBtn = screen.getByRole('button', { name: /keep trying/i });
    fireEvent.click(keepTryingBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when clicking Give Up button', () => {
    const onConfirm = vi.fn();
    render(
      <SurrenderModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={onConfirm}
        streak={3}
      />
    );

    const giveUpBtn = screen.getByRole('button', { name: /give up/i });
    fireEvent.click(giveUpBtn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
