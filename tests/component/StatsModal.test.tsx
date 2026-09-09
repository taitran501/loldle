import React, { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StatsModal } from '../../src/components/StatsModal';
import { createDefaultStats, recordWin } from '../../src/utils/stats';

function makeStats() {
  return recordWin(createDefaultStats(), 'daily', 'classic', 2);
}

describe('StatsModal Component', () => {
  it('renders bucket tabs and per-mode distribution', () => {
    render(
      <StatsModal
        isOpen
        onClose={vi.fn()}
        stats={makeStats()}
        activePlayType="daily"
        onResetStats={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog', { name: 'Statistics' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Daily' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Games Won')).toBeInTheDocument();
    expect(screen.getByText('Average Guesses')).toBeInTheDocument();
    expect(screen.getByText('One Shots')).toBeInTheDocument();
    expect(screen.getByText('2.0')).toBeInTheDocument();
    expect(screen.getByText(/Guesses: 2:1/)).toBeInTheDocument();
    expect(screen.getByText('1/1 wins')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Unlimited' }));
    expect(screen.getByRole('tab', { name: 'Unlimited' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('No completed guesses yet.')).toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the opener', async () => {
    const Harness = () => {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setIsOpen(true)}>Open statistics</button>
          <StatsModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            stats={makeStats()}
            activePlayType="daily"
            onResetStats={vi.fn()}
          />
        </>
      );
    };

    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Open statistics' });
    opener.focus();
    fireEvent.click(opener);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close statistics' })).toHaveFocus());

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Statistics' })).not.toBeInTheDocument());
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it('resets both buckets only after confirmation', () => {
    const onResetStats = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <StatsModal
        isOpen
        onClose={vi.fn()}
        stats={makeStats()}
        activePlayType="daily"
        onResetStats={onResetStats}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Reset statistics' }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(onResetStats).toHaveBeenCalledTimes(1);
    confirmSpy.mockRestore();
  });
});
