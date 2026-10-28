import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { BackButton } from './back-button';

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

function app(entries: string[]) {
  render(
    <MemoryRouter initialEntries={entries} initialIndex={entries.length - 1}>
      <Routes>
        <Route path="/backpack" element={<BackButton dataId="back" />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(cleanup);

describe('BackButton', () => {
  it('goes back to the screen the child came from', () => {
    app(['/region/rung', '/backpack']);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('where').textContent).toBe('/region/rung');
  });

  it('goes Home when the screen was opened straight from a link', () => {
    app(['/backpack']);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('where').textContent).toBe('/home');
  });
});
