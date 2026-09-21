import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Card from '../components/ui/Card';
import ContactTable from '../components/contacts/ContactTable';
import ContactForm from '../components/contacts/ContactForm';
import ContactFilters from '../components/contacts/ContactFilters';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import { FiPlus, FiUpload, FiDownload } from 'react-icons/fi';

export default function Contacts() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [deletingContact, setDeletingContact] = useState(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', page, search],
    queryFn: async () => {
      const { data } = await api.get('/contacts', { params: { page, limit: 20, search } });
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (values) => api.post('/contacts', values),
    onSuccess: () => {
      toast.success('Contact created');
      queryClient.invalidateQueries(['contacts']);
      setShowForm(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => api.put(`/contacts/${id}`, values),
    onSuccess: () => {
      toast.success('Contact updated');
      queryClient.invalidateQueries(['contacts']);
      setEditingContact(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/contacts/${id}`),
    onSuccess: () => {
      toast.success('Contact deleted');
      queryClient.invalidateQueries(['contacts']);
      setDeletingContact(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const importMutation = useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post('/contacts/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries(['contacts']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Import failed'),
  });

  const handleExport = async () => {
    try {
      const { data } = await api.get('/contacts/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contacts.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed');
    }
  };

  const contacts = data?.data || [];
  const pagination = data?.pagination || { pages: 1 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => {
            if (e.target.files[0]) importMutation.mutate(e.target.files[0]);
            e.target.value = '';
          }} />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} loading={importMutation.isPending}>
            <FiUpload className="w-4 h-4 mr-1" /> Import CSV
          </Button>
          <Button variant="secondary" onClick={handleExport}>
            <FiDownload className="w-4 h-4 mr-1" /> Export
          </Button>
          <Button onClick={() => { setEditingContact(null); setShowForm(true); }}>
            <FiPlus className="w-4 h-4 mr-1" /> Add Contact
          </Button>
        </div>
      </div>

      <ContactFilters
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        page={page}
        pages={pagination.pages}
        onPageChange={setPage}
      />

      <Card padding={false}>
        {isLoading ? (
          <div className="p-6"><Skeleton count={5} className="h-12" /></div>
        ) : contacts.length === 0 ? (
          <EmptyState
            title="No contacts"
            description="Add your first contact to get started"
            action={<Button onClick={() => setShowForm(true)}><FiPlus className="w-4 h-4 mr-1" /> Add Contact</Button>}
          />
        ) : (
          <ContactTable
            contacts={contacts}
            onEdit={(c) => { setEditingContact(c); setShowForm(true); }}
            onDelete={(c) => setDeletingContact(c)}
          />
        )}
      </Card>

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditingContact(null); }} title={editingContact ? 'Edit Contact' : 'Add Contact'}>
        <ContactForm
          contact={editingContact}
          onSubmit={(values) => editingContact ? updateMutation.mutate({ id: editingContact._id, values }) : createMutation.mutate(values)}
          onCancel={() => { setShowForm(false); setEditingContact(null); }}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingContact}
        onClose={() => setDeletingContact(null)}
        onConfirm={() => deleteMutation.mutate(deletingContact._id)}
        title="Delete Contact"
        message={`Are you sure you want to delete ${deletingContact?.name}? This action cannot be undone.`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
