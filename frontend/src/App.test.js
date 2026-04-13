import { render, screen } from '@testing-library/react';
import App from './App';

// react-router-dom is mocked via __mocks__ directory

test('renders CSMS application', () => {
  render(<App />);
  // App should render without crashing
  expect(document.body).toBeInTheDocument();
});
