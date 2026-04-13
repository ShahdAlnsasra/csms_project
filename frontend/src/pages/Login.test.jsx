/**
 * Tests for Login component
 * Tests input validation, error handling, and form submission
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';
import * as api from '../api/api';

// Mock the API
jest.mock('../api/api');

// react-router-dom is mocked via __mocks__ directory

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders login form', () => {
    render(<Login />);
    
    expect(screen.getByPlaceholderText(/enter your username or email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^login$/i })).toBeInTheDocument();
  });

  test('validates empty form submission', async () => {
    render(<Login />);
    
    const submitButton = screen.getByRole('button', { name: /^login$/i });
    fireEvent.click(submitButton);
    
    // Form should prevent submission or show validation
    await waitFor(() => {
      expect(api.login).not.toHaveBeenCalled();
    });
  });

  test('handles successful login', async () => {
    const mockUser = {
      id: 1,
      email: 'test@test.com',
      role: 'LECTURER',
      first_name: 'Test',
      last_name: 'User'
    };
    
    api.login.mockResolvedValue(mockUser);
    
    render(<Login />);
    
    const emailInput = screen.getByPlaceholderText(/enter your username or email/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /^login$/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith('test@test.com', 'password123');
      expect(localStorage.getItem('csmsUser')).toBeTruthy();
    });
  });

  test('handles login error', async () => {
    const errorMessage = 'Invalid credentials';
    api.login.mockRejectedValue({
      response: { data: { detail: errorMessage } }
    });
    
    render(<Login />);
    
    const emailInput = screen.getByPlaceholderText(/enter your username or email/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /^login$/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('stores user data on successful login', async () => {
    const mockUser = {
      id: 1,
      email: 'test@test.com',
      role: 'LECTURER',
      first_name: 'Test',
      last_name: 'User'
    };
    
    api.login.mockResolvedValue(mockUser);
    
    render(<Login />);
    
    const emailInput = screen.getByPlaceholderText(/enter your username or email/i);
    const passwordInput = screen.getByPlaceholderText(/enter your password/i);
    const submitButton = screen.getByRole('button', { name: /^login$/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      const storedUser = JSON.parse(localStorage.getItem('csmsUser'));
      expect(storedUser).toEqual(mockUser);
    });
  });
});
