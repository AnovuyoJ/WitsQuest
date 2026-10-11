import { fireEvent, render, screen } from '@testing-library/react';
import Sidebar from '../components/Sidebar';
import { useAdminAccess } from '../lib/useAdminAccess';
import { useTheme } from '../components/ThemeProvider';
jest.mock('next/navigation', () => ({ usePathname: () => '/dashboard/cards/detail' }));
jest.mock('../lib/useAdminAccess', () => ({ useAdminAccess: jest.fn() }));
jest.mock('../components/ThemeProvider', () => ({ useTheme: jest.fn() }));
jest.mock('../components/LogoutButton', () => ({ __esModule: true, default: () => <button>Logout</button> }));
const toggleDarkMode = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  (useAdminAccess as jest.Mock).mockReturnValue({ isAdmin: false });
  (useTheme as jest.Mock).mockReturnValue({ darkMode: false, toggleDarkMode });
});
test('normal players cannot see admin navigation and nested pages mark the correct link active', () => {
  render(<Sidebar />);
  expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Cards' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: /^Dashboard$/ })).not.toHaveAttribute('aria-current');
});
test('admins can navigate to administration, collapse and expand the sidebar, and toggle the theme', () => {
  (useAdminAccess as jest.Mock).mockReturnValue({ isAdmin: true });
  (useTheme as jest.Mock).mockReturnValue({ darkMode: true, toggleDarkMode });
  render(<Sidebar />);
  expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/dashboard/admin');
  fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
  expect(screen.getByRole('link', { name: 'Cards' })).toHaveAttribute('title', 'Cards');
  fireEvent.click(screen.getByRole('switch', { name: 'Switch to light mode' }));
  expect(toggleDarkMode).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
  expect(screen.getByText('Dark mode')).toBeInTheDocument();
});
test('mobile menu opens and closes after selecting a destination or the close control', () => {
  const { container } = render(<Sidebar />);
  const aside = container.querySelector('aside')!;
  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
  expect(aside).not.toHaveClass('-translate-x-full');
  fireEvent.click(screen.getByRole('link', { name: 'Cards' }));
  expect(aside).toHaveClass('-translate-x-full');
  fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
  fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));
  expect(aside).toHaveClass('-translate-x-full');
  fireEvent.click(screen.getByRole('switch'));
  expect(toggleDarkMode).toHaveBeenCalled();
});
