import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ticketService, authService } from '../services/api';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false
  });

  const user = authService.getUser();

  const loadTickets = async (searchQuery = '', offset = 0) => {
    try {
      setLoading(true);
      setError('');
      const response = await ticketService.getTickets(pagination.limit, offset, searchQuery);
      setTickets(response.tickets);
      setPagination(response.pagination);
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    await loadTickets(search, 0);
  };

  const handlePageChange = async (newOffset) => {
    await loadTickets(search, newOffset);
  };

  const getStatusBadge = (status) => {
    const baseClasses = "badge";
    switch (status) {
      case 'open':
        return `${baseClasses} badge-open`;
      case 'in_progress':
        return `${baseClasses} badge-in-progress`;
      case 'closed':
        return `${baseClasses} badge-closed`;
      default:
        return baseClasses;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isSlaBreached = (slaDeadline, status) => {
    return status !== 'closed' && new Date(slaDeadline) < new Date();
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading tickets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track support tickets
          </p>
        </div>
        <Link
          to="/tickets/new"
          className="btn-primary inline-flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Ticket
        </Link>
      </div>

      {/* Search */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search tickets by title or description..."
              className="form-input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Tickets List */}
      <div className="card">
        {tickets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No tickets found.</p>
            <Link to="/tickets/new" className="btn-primary mt-4 inline-flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" />
              Create your first ticket
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wide border-b pb-2">
              <div className="col-span-4">Title</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Created By</div>
              <div className="col-span-2">Assigned To</div>
              <div className="col-span-2">Created</div>
            </div>

            {/* Table Rows */}
            {tickets.map((ticket) => (
              <Link
                key={ticket._id}
                to={`/tickets/${ticket._id}`}
                className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="col-span-4">
                  <div className="flex items-start space-x-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {ticket.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {ticket.description}
                      </p>
                      {isSlaBreached(ticket.slaDeadline, ticket.status) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                          SLA Breached
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="col-span-2">
                  <span className={getStatusBadge(ticket.status)}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="col-span-2">
                  <div className="text-sm text-gray-900">
                    {ticket.createdBy.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {ticket.createdBy.email}
                  </div>
                </div>
                
                <div className="col-span-2">
                  {ticket.assignedTo ? (
                    <div>
                      <div className="text-sm text-gray-900">
                        {ticket.assignedTo.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {ticket.assignedTo.email}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Unassigned</span>
                  )}
                </div>
                
                <div className="col-span-2">
                  <div className="text-xs text-gray-500">
                    {formatDate(ticket.createdAt)}
                  </div>
                  <div className="text-xs text-gray-400">
                    SLA: {formatDate(ticket.slaDeadline)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.total > 0 && (
          <div className="flex items-center justify-between border-t pt-4 mt-6">
            <div className="text-sm text-gray-500">
              Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} tickets
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                disabled={pagination.offset === 0}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                disabled={!pagination.hasMore}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}