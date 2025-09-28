"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Bell, CheckCircle, XCircle, Clock, Users, Eye } from "lucide-react";
import { toast } from "react-hot-toast";

interface SuggestionRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  suggestionCount: number;
  isIncoming: boolean;
  isOutgoing: boolean;
  message?: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<SuggestionRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [respondingToRequests, setRespondingToRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/notifications/suggestion-requests`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch requests");
      }

      const data = await response.json();
      setRequests(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const respondToRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      setRespondingToRequests(prev => new Set(prev).add(requestId));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/notifications/suggestion-requests/${requestId}/respond`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        toast.success(`Request ${status} successfully!`);
        fetchRequests(); // Refresh requests
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || `Failed to ${status} request`);
      }
    } catch (err) {
      toast.error(`Failed to ${status} request`);
      console.error("Error responding to request:", err);
    } finally {
      setRespondingToRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-400" />;
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Bell className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400';
      case 'accepted':
        return 'text-green-400';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const incomingRequests = requests.filter(req => req.isIncoming);
  const outgoingRequests = requests.filter(req => req.isOutgoing);
  const pendingIncomingRequests = incomingRequests.filter(req => req.status === 'pending');
  const otherRequests = requests.filter(req => req.status !== 'pending');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-black text-white"
    >
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-purple-400 bg-clip-text text-transparent">
                Notifications
              </h1>
              <p className="text-gray-400 mt-2">
                Manage suggestion requests from other users
              </p>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Pending Incoming Requests */}
          {pendingIncomingRequests.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Bell className="h-6 w-6 text-yellow-400" />
                Pending Requests ({pendingIncomingRequests.length})
              </h2>
              <div className="space-y-4">
                {pendingIncomingRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-500/20 rounded-lg">
                          <Users className="h-6 w-6 text-yellow-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            Suggestion Request from {request.fromUserName}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {request.suggestionCount} suggestions available
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <span className={`text-sm ${getStatusColor(request.status)}`}>
                          {getStatusText(request.status)}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-300 mb-2">
                        {request.message || `${request.fromUserName} wants to see detailed suggestions from your family tree.`}
                      </p>
                      <p className="text-sm text-gray-400">
                        Request sent on {formatDate(request.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => respondToRequest(request.id, 'accepted')}
                        disabled={respondingToRequests.has(request.id)}
                        className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-4 py-2 rounded-lg transition-all duration-300 text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {respondingToRequests.has(request.id) ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Accept
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => respondToRequest(request.id, 'rejected')}
                        disabled={respondingToRequests.has(request.id)}
                        className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white px-4 py-2 rounded-lg transition-all duration-300 text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Outgoing Requests */}
          {outgoingRequests.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-400" />
                Your Sent Requests ({outgoingRequests.length})
              </h2>
              <div className="space-y-4">
                {outgoingRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: (pendingIncomingRequests.length + index) * 0.1 }}
                    className="bg-gradient-to-br from-gray-900/60 to-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/30 p-6 shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <Users className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            Request to {request.toUserName}
                          </h3>
                          <p className="text-gray-300 text-sm mb-1">
                            {request.message || `${request.suggestionCount} suggestions available`}
                          </p>
                          <p className="text-gray-500 text-xs">
                            Sent on {new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {request.status === 'pending' && (
                          <div className="flex items-center gap-2 text-yellow-400">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">Pending</span>
                          </div>
                        )}
                        {request.status === 'accepted' && (
                          <div className="flex items-center gap-2 text-green-400">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Accepted</span>
                          </div>
                        )}
                        {request.status === 'rejected' && (
                          <div className="flex items-center gap-2 text-red-400">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm">Rejected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Other Requests */}
          {otherRequests.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Eye className="h-6 w-6 text-gray-400" />
                Request History ({otherRequests.length})
              </h2>
              <div className="space-y-4">
                {otherRequests.map((request, index) => (
                  <motion.div
                    key={request.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: (pendingIncomingRequests.length + outgoingRequests.length + index) * 0.1 }}
                    className="bg-gradient-to-br from-gray-900/60 to-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700/30 p-6 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gray-500/20 rounded-lg">
                          <Users className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {request.status === 'accepted' ? 'Accepted' : 'Rejected'} Request
                          </h3>
                          <p className="text-sm text-gray-300 mb-1">
                            {request.message || `${request.status === 'accepted' ? 'From' : 'To'} ${request.status === 'accepted' ? request.fromUserName : request.toUserName}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <span className={`text-sm ${getStatusColor(request.status)}`}>
                          {getStatusText(request.status)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">
                      {formatDate(request.createdAt)}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* No Requests */}
          {requests.length === 0 && (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">No Notifications</h3>
              <p className="text-gray-500">
                You don't have any suggestion requests at this time.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
