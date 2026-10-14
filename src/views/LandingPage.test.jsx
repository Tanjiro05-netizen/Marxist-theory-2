import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import LandingPage from './LandingPage';
import { supabase } from '../supabaseClient';

const mockLogin = jest.fn();
const mockSignUp = jest.fn();
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null, login: mockLogin, signUp: mockSignUp, isAdmin: () => false }),
}));
jest.mock('../supabaseClient', () => {
  const presenceChannel = {
    on: jest.fn(() => presenceChannel),
    subscribe: jest.fn(() => presenceChannel),
    untrack: jest.fn(),
    presenceState: jest.fn(() => ({})),
  };
  return {
    supabase: {
      rpc: jest.fn(),
      functions: { invoke: jest.fn() },
      channel: jest.fn(() => presenceChannel),
      removeChannel: jest.fn(),
    },
  };
});
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key, values) => {
    const locale = require('../i18n/locales/en.json');
    const text = key.split('.').reduce((result, part) => result?.[part], locale) || key;
    return values?.email ? text.replace('{{email}}', values.email) : text;
  } }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockLogin.mockResolvedValue({ error: null });
  mockSignUp.mockResolvedValue({ error: null });
  supabase.rpc.mockResolvedValue({ data: { valid: true }, error: null });
  supabase.functions.invoke.mockResolvedValue({ data: {}, error: null });
});

function openRegistration() {
  fireEvent.click(screen.getByRole('button', { name: 'Register', exact: true }));
  return within(screen.getByRole('dialog'));
}

function completeInviteForm(panel, confirmPassword = 'password123') {
  fireEvent.click(panel.getByLabelText('I have an invite code'));
  fireEvent.change(panel.getByLabelText('Invite Code'), { target: { value: 'test-code' } });
  fireEvent.change(panel.getByLabelText('Username'), { target: { value: 'reader' } });
  fireEvent.change(panel.getByLabelText('Email'), { target: { value: 'reader@example.com' } });
  fireEvent.change(panel.getByLabelText('Password', { exact: true }), { target: { value: 'password123' } });
  fireEvent.change(panel.getByLabelText('Confirm Password'), { target: { value: confirmPassword } });
}

test('front page retains public navigation without promotional descriptions', () => {
  render(<LandingPage />);
  const navigation = within(screen.getByRole('navigation', { name: 'Main navigation' }));
  expect(navigation.getByRole('link', { name: 'Digital Library' })).toHaveAttribute('href', '/digital-library');
  expect(navigation.getByRole('link', { name: 'Submit Work' })).toHaveAttribute('href', '/submit');
  expect(screen.getByRole('link', { name: 'Enter the Platform' })).toHaveAttribute('href', '/home');
  expect(screen.getByTestId('publication-contents').querySelectorAll('a')).toHaveLength(10);
  expect(screen.queryByText('Platform Features')).not.toBeInTheDocument();
  expect(screen.queryByText(/An expanding collection/)).not.toBeInTheDocument();
  expect(screen.queryByText('Cinematic View')).not.toBeInTheDocument();
});

test('login errors remain retryable and successful login enters home', async () => {
  mockLogin.mockResolvedValueOnce({ error: { message: 'Please try again.' } });
  render(<LandingPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Log In', exact: true }));
  const panel = within(screen.getByRole('dialog'));
  fireEvent.change(panel.getByLabelText('Email'), { target: { value: 'reader@example.com' } });
  fireEvent.change(panel.getByLabelText('Password'), { target: { value: 'password123' } });
  fireEvent.click(panel.getByRole('button', { name: 'Log In', exact: true }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Please try again.');
  fireEvent.click(panel.getByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/home'));
  expect(mockLogin).toHaveBeenLastCalledWith({ email: 'reader@example.com', password: 'password123' });
});

test('registration without an invite joins the waitlist, not an account', async () => {
  render(<LandingPage />);
  const panel = openRegistration();
  expect(panel.queryByLabelText('Password')).not.toBeInTheDocument();
  fireEvent.change(panel.getByLabelText('Email'), { target: { value: 'Reader@Example.com' } });
  fireEvent.click(panel.getByRole('button', { name: 'Join the Waitlist' }));
  await waitFor(() => expect(supabase.functions.invoke).toHaveBeenCalledWith('waitlist-signup', {
    body: { email: 'reader@example.com', notify_invite_codes: true, notify_public_beta: true },
  }));
  expect(await panel.findByRole('status')).toHaveTextContent("You're on the list!");
  expect(mockSignUp).not.toHaveBeenCalled();
});

test('invite registration validates passwords and the invite before signup', async () => {
  render(<LandingPage />);
  const panel = openRegistration();
  completeInviteForm(panel, 'different123');
  fireEvent.click(panel.getByRole('button', { name: 'Register', exact: true }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Passwords do not match');
  expect(supabase.rpc).not.toHaveBeenCalled();
  fireEvent.change(panel.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
  supabase.rpc.mockResolvedValueOnce({ data: { valid: false }, error: null });
  fireEvent.click(panel.getByRole('button', { name: 'Register', exact: true }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Invalid or already used invite code'));
  expect(mockSignUp).not.toHaveBeenCalled();
  fireEvent.click(panel.getByRole('button', { name: 'Register', exact: true }));
  await waitFor(() => expect(mockSignUp).toHaveBeenCalledWith({
    email: 'reader@example.com', password: 'password123', username: 'reader', inviteCode: 'TEST-CODE', betaReason: null,
  }));
  expect(await screen.findByRole('status')).toHaveTextContent('Check Your Email');
});

test('a rejected signup is recoverable rather than leaving the form stuck', async () => {
  mockSignUp.mockRejectedValueOnce(new Error('Connection interrupted'));
  render(<LandingPage />);
  const panel = openRegistration();
  completeInviteForm(panel);
  fireEvent.click(panel.getByRole('button', { name: 'Register', exact: true }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Connection interrupted');
  expect(panel.getByRole('button', { name: 'Register', exact: true })).toBeEnabled();
});
