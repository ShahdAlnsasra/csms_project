// Manual mock for react-router-dom
const React = require('react');
const mockNavigate = jest.fn();
const mockSearchParams = new URLSearchParams();

module.exports = {
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ element }) => element,
  Navigate: () => null,
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' }),
  useParams: () => ({}),
  useSearchParams: () => [mockSearchParams],
  Link: ({ children, to }) => React.createElement('a', { href: to }, children),
  NavLink: ({ children, to, className }) => React.createElement('a', { href: to, className }, children),
  Outlet: () => null,
};

