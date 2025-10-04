import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../services/api';

export default function NewTicket() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await ticketService.createTicket(formData.title, formData.description);
      navigate(`/tickets/${response.ticket._id}`);
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Failed to create ticket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/tickets');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Ticket</h1>
        <p className="mt-1 text-sm text-gray-500">
          Describe your issue or request and we'll help you resolve it.
        </p>
      </div>

      {/* Form */}
      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <label htmlFor="title" className="form-label">
              Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={200}
              className="form-input"
              placeholder="Brief description of your issue"
              value={formData.title}
              onChange={handleChange}
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.title.length}/200 characters
            </p>
          </div>

          <div>
            <label htmlFor="description" className="form-label">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              required
              maxLength={2000}
              className="form-input"
              placeholder="Provide detailed information about your issue, including steps to reproduce, expected behavior, and any error messages."
              value={formData.description}
              onChange={handleChange}
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/2000 characters
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Service Level Agreement (SLA)
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Your ticket will have a 48-hour SLA deadline from creation. 
                    We aim to respond and resolve issues within this timeframe.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
            >
              {isLoading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}