import { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

const defaultForm = {
  name: '',
  phoneNumber: '',
  email: '',
  company: '',
  tags: '',
  notes: '',
};

export default function ContactForm({ contact, onSubmit, onCancel, loading = false }) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (contact) {
      setForm({
        name: contact.name || '',
        phoneNumber: contact.phoneNumber?.replace('+', '') || '',
        email: contact.email || '',
        company: contact.company || '',
        tags: contact.tags?.join(', ') || '',
        notes: contact.notes || '',
      });
    }
  }, [contact]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      phoneNumber: form.phoneNumber.startsWith('+') ? form.phoneNumber : `+${form.phoneNumber}`,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        required
      />
      <Input
        label="Phone Number"
        placeholder="+1234567890"
        value={form.phoneNumber}
        onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
        required
      />
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <Input
        label="Company"
        value={form.company}
        onChange={(e) => setForm({ ...form, company: e.target.value })}
      />
      <Input
        label="Tags (comma separated)"
        placeholder="vip, lead, support"
        value={form.tags}
        onChange={(e) => setForm({ ...form, tags: e.target.value })}
      />
      <Input
        label="Notes"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={loading}>{contact ? 'Update' : 'Create'} Contact</Button>
      </div>
    </form>
  );
}
