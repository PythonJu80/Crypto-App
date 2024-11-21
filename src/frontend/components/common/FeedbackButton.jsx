import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FeedbackForm = ({ onClose, onSubmit }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
  >
    <div className="bg-pepe-dark/90 rounded-lg border-2 border-pepe-primary p-6 w-full max-w-md">
      <h3 className="text-lg font-['Press_Start_2P'] text-pepe-primary mb-4">
        Send Feedback
      </h3>
      
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-['Press_Start_2P'] text-pepe-light mb-2">
            Type
          </label>
          <select
            name="type"
            required
            className="w-full bg-pepe-dark/50 border-2 border-pepe-primary rounded-lg px-4 py-2
                     text-pepe-light focus:outline-none focus:ring-2 focus:ring-pepe-primary"
          >
            <option value="bug">Bug Report</option>
            <option value="feature">Feature Request</option>
            <option value="usability">Usability Issue</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-['Press_Start_2P'] text-pepe-light mb-2">
            Description
          </label>
          <textarea
            name="description"
            required
            rows={4}
            className="w-full bg-pepe-dark/50 border-2 border-pepe-primary rounded-lg px-4 py-2
                     text-pepe-light focus:outline-none focus:ring-2 focus:ring-pepe-primary
                     resize-none"
            placeholder="Please describe your feedback..."
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full font-['Press_Start_2P'] text-xs
                     bg-pepe-dark/50 text-pepe-light hover:bg-pepe-dark/70
                     transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-full font-['Press_Start_2P'] text-xs
                     bg-pepe-primary text-pepe-dark hover:brightness-110
                     transition-all duration-200"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  </motion.div>
);

const FeedbackButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.target);
    const feedback = {
      type: formData.get('type'),
      description: formData.get('description'),
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedback)
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setIsOpen(false);
      // Show success notification (assuming you have a notification system)
      // notificationService.show('Thank you for your feedback!', 'success');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      // notificationService.show('Failed to submit feedback. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-4 right-4 bg-pepe-primary text-pepe-dark rounded-full p-4
                   shadow-pepe hover:shadow-pepe-hover transition-shadow duration-300"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <FeedbackForm
            onClose={() => setIsOpen(false)}
            onSubmit={handleSubmit}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedbackButton;