import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import FeedbackButton from '../../frontend/components/common/FeedbackButton';

const server = setupServer(
  rest.post('/api/feedback', (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('FeedbackButton', () => {
  it('should open feedback form on click', async () => {
    const user = userEvent.setup();
    render(<FeedbackButton />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Send Feedback')).toBeInTheDocument();
  });

  it('should submit feedback successfully', async () => {
    const user = userEvent.setup();
    render(<FeedbackButton />);

    // Open form
    await user.click(screen.getByRole('button'));

    // Fill out form
    await user.selectOptions(screen.getByRole('combobox'), 'bug');
    await user.type(
      screen.getByPlaceholderText('Please describe your feedback...'),
      'Test feedback message'
    );

    // Submit form
    await user.click(screen.getByText('Submit'));

    await waitFor(() => {
      // Form should close after successful submission
      expect(screen.queryByText('Send Feedback')).not.toBeInTheDocument();
    });
  });

  it('should handle submission errors', async () => {
    server.use(
      rest.post('/api/feedback', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    const user = userEvent.setup();
    render(<FeedbackButton />);

    // Open form
    await user.click(screen.getByRole('button'));

    // Fill out form
    await user.selectOptions(screen.getByRole('combobox'), 'bug');
    await user.type(
      screen.getByPlaceholderText('Please describe your feedback...'),
      'Test feedback message'
    );

    // Submit form
    await user.click(screen.getByText('Submit'));

    // Form should stay open on error
    expect(screen.getByText('Send Feedback')).toBeInTheDocument();
  });

  it('should close form when cancelled', async () => {
    const user = userEvent.setup();
    render(<FeedbackButton />);

    // Open form
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Send Feedback')).toBeInTheDocument();

    // Close form
    await user.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Send Feedback')).not.toBeInTheDocument();
  });

  it('should apply PepeUSB theme styling', async () => {
    render(<FeedbackButton />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-pepe-primary', 'text-pepe-dark');

    // Open form
    fireEvent.click(button);

    const form = screen.getByRole('dialog');
    expect(form).toHaveClass('bg-pepe-dark/90', 'border-pepe-primary');
  });

  it('should include metadata in submission', async () => {
    const user = userEvent.setup();
    let submittedData = null;

    server.use(
      rest.post('/api/feedback', async (req, res, ctx) => {
        submittedData = await req.json();
        return res(ctx.json({ success: true }));
      })
    );

    render(<FeedbackButton />);

    // Open form and submit
    await user.click(screen.getByRole('button'));
    await user.selectOptions(screen.getByRole('combobox'), 'bug');
    await user.type(
      screen.getByPlaceholderText('Please describe your feedback...'),
      'Test feedback'
    );
    await user.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(submittedData).toMatchObject({
        type: 'bug',
        description: 'Test feedback',
        url: expect.any(String),
        userAgent: expect.any(String),
        timestamp: expect.any(String)
      });
    });
  });
});