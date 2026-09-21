import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { FiMessageSquare, FiSend, FiUser } from 'react-icons/fi';
import { timeAgo, formatDateTime } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Conversations() {
  const [selectedId, setSelectedId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: convData, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/conversations');
      return data;
    },
    refetchInterval: 5000,
  });

  const { data: msgData } = useQuery({
    queryKey: ['messages', selectedId],
    queryFn: async () => {
      const { data } = await api.get(`/conversations/${selectedId}/messages`);
      return data;
    },
    enabled: !!selectedId,
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: (text) => api.post(`/conversations/${selectedId}/messages`, { text }),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', selectedId]);
      queryClient.invalidateQueries(['conversations']);
      setNewMessage('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to send'),
  });

  const toggleAIMutation = useMutation({
    mutationFn: (convId) => api.patch(`/conversations/${convId}/toggle-ai`),
    onSuccess: () => {
      queryClient.invalidateQueries(['conversations']);
      toast.success('AI toggled');
    },
  });

  const conversations = convData?.data || [];
  const messages = msgData?.data || [];
  const selectedConv = conversations.find((c) => c._id === selectedId);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedId) return;
    sendMutation.mutate(newMessage.trim());
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Conversations</h1>
        <Skeleton count={5} className="h-16" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Conversations</h1>

      {conversations.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FiMessageSquare />}
            title="No conversations yet"
            description="Send a WhatsApp message to your test number to start a conversation"
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: '70vh' }}>
          {/* Conversation list */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-3 border-b font-medium text-sm text-gray-700">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 44px)' }}>
              {conversations.map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => setSelectedId(conv._id)}
                  className={`w-full text-left p-3 border-b hover:bg-gray-50 transition-colors ${
                    selectedId === conv._id ? 'bg-primary-50 border-l-2 border-l-primary-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <FiUser className="w-4 h-4 text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conv.contactId?.name || conv.phoneNumber}
                        </p>
                        <p className="text-xs text-gray-500">{conv.phoneNumber}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs text-gray-400">{timeAgo(conv.lastMessageAt)}</span>
                      <Badge color={conv.aiEnabled ? 'green' : 'gray'}>
                        {conv.aiEnabled ? 'AI On' : 'AI Off'}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Message area */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            {selectedId ? (
              <>
                {/* Header */}
                <div className="p-3 border-b flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{selectedConv?.contactId?.name || selectedConv?.phoneNumber}</p>
                    <p className="text-xs text-gray-500">{selectedConv?.phoneNumber}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={selectedConv?.aiEnabled ? 'primary' : 'secondary'}
                    onClick={() => toggleAIMutation.mutate(selectedId)}
                  >
                    <FiUser className="w-3 h-3 mr-1" />
                    {selectedConv?.aiEnabled ? 'AI Enabled' : 'AI Disabled'}
                  </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: '300px', maxHeight: 'calc(70vh - 130px)' }}>
                  {messages.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-8">No messages yet</p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm ${
                            msg.direction === 'outgoing'
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p>{msg.text}</p>
                          <p className={`text-xs mt-1 ${msg.direction === 'outgoing' ? 'text-primary-100' : 'text-gray-400'}`}>
                            {formatDateTime(msg.timestamp || msg.createdAt)}
                            {msg.direction === 'outgoing' && (
                              <span className="ml-1">
                                {msg.status === 'read' ? '✓✓' : msg.status === 'delivered' ? '✓✓' : msg.status === 'sent' ? '✓' : '⏳'}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-3 border-t flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <Button type="submit" disabled={!newMessage.trim()} loading={sendMutation.isPending}>
                    <FiSend className="w-4 h-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <p className="text-sm">Select a conversation to view messages</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
