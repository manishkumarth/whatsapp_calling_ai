import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user } = useAuth();
  const [phoneNumberId, setPhoneNumberId] = useState(user?.phoneNumberId || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', { phoneNumberId });
      const updatedUser = { ...user, phoneNumberId: data.data.phoneNumberId };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.location.reload();
      toast.success('WhatsApp Phone Number ID saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <div className="space-y-4 max-w-md">
          <Input label="Name" value={user?.name || ''} readOnly />
          <Input label="Email" value={user?.email || ''} readOnly />
          <Input label="Company" value={user?.companyName || ''} readOnly />
          <Input label="Role" value={user?.role || ''} readOnly />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-4">WhatsApp Connection</h2>
        <p className="text-sm text-gray-500 mb-4">
          Enter your Meta WhatsApp Cloud API Phone Number ID to link incoming webhook messages to your account.
          Find this in Meta Developer Dashboard → WhatsApp → Configuration → Phone Numbers.
        </p>
        <div className="space-y-4 max-w-md">
          <Input
            label="Phone Number ID"
            placeholder="e.g. 1335519452979441"
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
          />
          <Button onClick={handleSave} loading={saving}>Save</Button>
        </div>
        {user?.phoneNumberId && (
          <p className="text-sm text-green-600 mt-3">
            Linked to Phone Number ID: <code className="bg-green-50 px-1 rounded">{user.phoneNumberId}</code>
          </p>
        )}
      </Card>
    </div>
  );
}
