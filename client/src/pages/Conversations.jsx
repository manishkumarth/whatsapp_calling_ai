import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import { FiMessageSquare } from 'react-icons/fi';

export default function Conversations() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Conversations</h1>
      <Card>
        <EmptyState
          icon={<FiMessageSquare />}
          title="Conversations coming soon"
          description="The conversation inbox will be available in Phase 3. You'll be able to view and manage WhatsApp conversations here."
        />
      </Card>
    </div>
  );
}
