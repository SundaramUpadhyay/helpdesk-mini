import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketService, authService, userService } from '../services/api';
import { ArrowLeftIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline';

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [availableUsers, setAvailableUsers] = useState([]);

  const user = authService.getUser();

  const loadTicket = async () => {
    try {
      setError('');
      const promises = [
        ticketService.getTicket(id),
        ticketService.getComments(id)
      ];
      
      // Load users if current user can assign tickets
      if (user.role === 'admin') {
        promises.push(userService.getUsers());
      }
      
      const responses = await Promise.all(promises);
      const [ticketResponse, commentsResponse, usersResponse] = responses;
      
      setTicket(ticketResponse.ticket);
      setComments(commentsResponse.comments);
      setEditData({
        title: ticketResponse.ticket.title,
        description: ticketResponse.ticket.description,
        status: ticketResponse.ticket.status,
        assignedTo: ticketResponse.ticket.assignedTo?._id || ''
      });
      
      if (usersResponse) {
        setAvailableUsers(usersResponse.users);
      }
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [id]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsAddingComment(true);
    try {
      const response = await ticketService.addComment(id, newComment);
      setComments([...comments, response.comment]);
      setNewComment('');
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Failed to add comment');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      const updates = {};
      if (editData.title !== ticket.title) updates.title = editData.title;
      if (editData.description !== ticket.description) updates.description = editData.description;
      if (editData.status !== ticket.status) updates.status = editData.status;
      if (editData.assignedTo !== (ticket.assignedTo?._id || '')) {
        updates.assignedTo = editData.assignedTo || null;
      }

      if (Object.keys(updates).length > 0) {
        const response = await ticketService.updateTicket(id, updates, ticket.__v);
        setTicket(response.ticket);
      }
      setEditMode(false);
    } catch (error) {
      setError(error.response?.data?.error?.message || 'Failed to update ticket');
    } finally {
      setIsUpdating(false);
    }
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

  const canEdit = () => {
    return user.role === 'admin' || 
           (user.role === 'agent' && (ticket.assignedTo?._id === user.id || !ticket.assignedTo)) ||
           (user.role === 'user' && ticket.createdBy._id === user.id);
  };

  const canAssign = () => {
    return user.role === 'admin';
  };

  const canChangeStatus = () => {
    return user.role === 'admin' || user.role === 'agent';
  };

  const isSlaBreached = (slaDeadline, status) => {
    return status !== 'closed' && new Date(slaDeadline) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading ticket...</div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button onClick={() => navigate('/tickets')} className="btn-primary">
          Back to Tickets
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/tickets')}
          className="btn-secondary flex items-center"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ticket Details</h1>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Ticket Information */}
      <div className="card">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            {editMode && canEdit() ? (
              <form onSubmit={handleUpdateTicket} className="space-y-4">
                <input
                  type="text"
                  className="form-input text-xl font-bold"
                  value={editData.title}
                  onChange={(e) => setEditData({...editData, title: e.target.value})}
                  maxLength={200}
                />
                <textarea
                  className="form-input"
                  rows={4}
                  value={editData.description}
                  onChange={(e) => setEditData({...editData, description: e.target.value})}
                  maxLength={2000}
                />
                <div className="flex space-x-4">
                  {canChangeStatus() && (
                    <div>
                      <label className="form-label">Status</label>
                      <select
                        className="form-input"
                        value={editData.status}
                        onChange={(e) => setEditData({...editData, status: e.target.value})}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  )}
                  {canAssign() && (
                    <div>
                      <label className="form-label">Assigned To</label>
                      <select
                        className="form-input"
                        value={editData.assignedTo}
                        onChange={(e) => setEditData({...editData, assignedTo: e.target.value})}
                      >
                        <option value="">Unassigned</option>
                        {availableUsers.map(user => (
                          <option key={user._id} value={user._id}>
                            {user.name} ({user.email}) - {user.role}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button type="submit" disabled={isUpdating} className="btn-primary">
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEditMode(false)} 
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{ticket.title}</h2>
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{ticket.description}</p>
              </>
            )}
          </div>
          
          {!editMode && canEdit() && (
            <button onClick={() => setEditMode(true)} className="btn-secondary ml-4">
              Edit
            </button>
          )}
        </div>

        {/* Ticket Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1">
              <span className={getStatusBadge(ticket.status)}>
                {ticket.status.replace('_', ' ')}
              </span>
              {isSlaBreached(ticket.slaDeadline, ticket.status) && (
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    SLA Breached
                  </span>
                </div>
              )}
            </dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <UserIcon className="h-4 w-4 mr-1" />
              Created By
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              <div>{ticket.createdBy.name}</div>
              <div className="text-gray-500">{ticket.createdBy.email}</div>
            </dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <UserIcon className="h-4 w-4 mr-1" />
              Assigned To
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              {ticket.assignedTo ? (
                <div>
                  <div>{ticket.assignedTo.name}</div>
                  <div className="text-gray-500">{ticket.assignedTo.email}</div>
                </div>
              ) : (
                <span className="text-gray-400">Unassigned</span>
              )}
            </dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              Timeline
            </dt>
            <dd className="mt-1 text-sm text-gray-900">
              <div>Created: {formatDate(ticket.createdAt)}</div>
              <div className={`${isSlaBreached(ticket.slaDeadline, ticket.status) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                SLA: {formatDate(ticket.slaDeadline)}
              </div>
            </dd>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Comments</h3>
        
        {/* Add Comment Form */}
        <form onSubmit={handleAddComment} className="mb-6">
          <div>
            <label htmlFor="comment" className="form-label">
              Add a comment
            </label>
            <textarea
              id="comment"
              rows={3}
              className="form-input"
              placeholder="Write your comment here..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={1000}
            />
            <p className="mt-1 text-xs text-gray-500">
              {newComment.length}/1000 characters
            </p>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={!newComment.trim() || isAddingComment}
              className="btn-primary"
            >
              {isAddingComment ? 'Adding...' : 'Add Comment'}
            </button>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No comments yet.</p>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        {comment.author.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {comment.author.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(comment.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{comment.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}