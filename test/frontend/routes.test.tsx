import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../../src/auth/AuthProvider';
import Router from '../../src/routes/sections';
import type { ReactNode } from 'react';

vi.mock('../../src/auth/AuthProvider', () => ({ useAuth: vi.fn() }));
vi.mock('../../src/layouts/dashboard', () => ({ default: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock('../../src/pages/results', () => ({ default: () => <h1>Results</h1> }));
vi.mock('../../src/pages/comitards-page', () => ({ default: () => <h1>Profiles</h1> }));
vi.mock('../../src/pages/rules', () => ({ default: () => <h1>Rules</h1> }));
vi.mock('../../src/pages/account', () => ({ default: () => <h1>Member account</h1> }));
vi.mock('../../src/pages/admin-account', () => ({ default: () => <h1>Admin account</h1> }));
vi.mock('../../src/pages/login', () => ({ default: () => <h1>Login</h1> }));
vi.mock('../../src/pages/page-not-found', () => ({ default: () => <h1>Page not found</h1> }));
vi.mock('../../src/pages/work-in-progress', () => ({ default: () => <h1>Work in progress</h1> }));

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({ user: null, loading: false, isAdmin: () => false });
});

function renderRoute(path: string) {
  render(<MemoryRouter initialEntries={[path]}><Router /></MemoryRouter>);
}

describe('application routes', () => {
  it.each([['/', 'Results'], ['/comitards', 'Profiles'], ['/rules', 'Rules'],
    ['/login', 'Login'], ['/wip', 'Work in progress'], ['/404', 'Page not found'],
    ['/unknown', 'Page not found']])('renders %s', async (path, heading) => {
    renderRoute(path);
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
  });

  it('shows login to visitors opening the account route', async () => {
    renderRoute('/account');
    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.queryByText('Admin account')).not.toBeInTheDocument();
  });

  it.each([[false, 'Member account'], [true, 'Admin account']])(
    'selects the account page for admin=%s', async (admin, heading) => {
      vi.mocked(useAuth).mockReturnValue({
        user: { uid: 'member' } as NonNullable<ReturnType<typeof useAuth>['user']>,
        loading: false, isAdmin: () => admin,
      });
      renderRoute('/account');
      expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
    },
  );
});
