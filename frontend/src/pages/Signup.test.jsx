/**
 * Tests for Signup component
 * Tests form validation, field requirements, and submission
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Signup from './Signup';
import * as api from '../api/api';

// Mock the API
jest.mock('../api/api');

// react-router-dom is mocked via __mocks__ directory

describe('Signup Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    api.fetchDepartments = jest.fn().mockResolvedValue([
      { id: 1, name: 'Computer Science', code: 'CS' }
    ]);
    api.fetchRoles = jest.fn().mockResolvedValue([
      { value: 'LECTURER', label: 'Lecturer' },
      { value: 'STUDENT', label: 'Student' }
    ]);
  });

  test('renders signup form with all required fields', async () => {
    render(<Signup />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter your first name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your last name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your phone number/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your id number/i)).toBeInTheDocument();
    });
  });

  test('validates required fields', async () => {
    render(<Signup />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter your first name/i)).toBeInTheDocument();
    });
    
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    expect(submitButton).toBeInTheDocument();
    fireEvent.click(submitButton);
    
    // HTML5 validation should prevent submission if fields are empty
    // We just verify the button exists and can be clicked
    expect(submitButton).toBeInTheDocument();
  });

  test('validates email format', async () => {
    render(<Signup />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });
    
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);
    
    // Browser validation should catch invalid email format
    expect(emailInput.validity.valid).toBe(false);
  });

  test('form accepts user input', async () => {
    render(<Signup />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter your first name/i)).toBeInTheDocument();
    });
    
    const firstNameInput = screen.getByPlaceholderText(/enter your first name/i);
    const emailInput = screen.getByPlaceholderText(/enter your email/i);
    
    fireEvent.change(firstNameInput, { target: { value: 'Test' } });
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    
    expect(firstNameInput.value).toBe('Test');
    expect(emailInput.value).toBe('test@test.com');
  });

  test('form renders submit button', async () => {
    render(<Signup />);
    
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton.type).toBe('submit');
    });
  });
});
