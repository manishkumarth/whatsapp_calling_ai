import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import StatCard from '../components/dashboard/StatCard';
import ActivityChart from '../components/dashboard/ActivityChart';
import Card from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import { formatDateTime, timeAgo } from '../utils/helpers';
import { FiUsers, FiMessageSquare, FiPhone, FiCheckCircle, FiXCircle, FiSend } from 'react-icons/fi';

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats');
      return data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Contacts" value={data?.totalContacts || 0} icon={FiUsers} color="primary" />
        <StatCard title="Active Conversations" value={data?.activeConversations || 0} icon={FiMessageSquare} color="blue" />
        <StatCard title="Messages Sent Today" value={data?.todayMessagesSent || 0} icon={FiSend} color="green" />
        <StatCard title="Messages Received Today" value={data?.todayMessagesReceived || 0} icon={FiPhone} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityChart data={data?.messagesByDay || []} />

        <Card>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Recent Conversations</h3>
          {data?.recentConversations?.length ? (
            <div className="space-y-3">
              {data.recentConversations.map((conv) => (
                <div key={conv._id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{conv.contactId?.name || conv.phoneNumber}</p>
                    <p className="text-xs text-gray-500">{conv.phoneNumber}</p>
                  </div>
                  <span className="text-xs text-gray-400">{timeAgo(conv.lastMessageAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No conversations yet</p>
          )}
        </Card>
      </div>
    </div>
  );
}
