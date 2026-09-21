import { formatPhone, formatDate } from '../../utils/helpers';
import Badge from '../ui/Badge';

const statusColors = { active: 'green', inactive: 'gray', blocked: 'red' };

export default function ContactTable({ contacts, onEdit, onDelete }) {
  if (!contacts.length) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Phone</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Company</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Tags</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Created</th>
            <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {contacts.map((contact) => (
            <tr key={contact._id} className="hover:bg-gray-50">
              <td className="py-3 px-4">
                <div className="font-medium text-gray-900">{contact.name}</div>
                {contact.email && <div className="text-xs text-gray-500">{contact.email}</div>}
              </td>
              <td className="py-3 px-4 text-sm text-gray-600">{formatPhone(contact.phoneNumber)}</td>
              <td className="py-3 px-4 text-sm text-gray-600 hidden md:table-cell">{contact.company || '-'}</td>
              <td className="py-3 px-4 hidden lg:table-cell">
                <div className="flex flex-wrap gap-1">
                  {contact.tags?.slice(0, 2).map((tag) => (
                    <Badge key={tag} color="blue">{tag}</Badge>
                  ))}
                  {contact.tags?.length > 2 && <Badge>+{contact.tags.length - 2}</Badge>}
                </div>
              </td>
              <td className="py-3 px-4">
                <Badge color={statusColors[contact.status] || 'gray'}>{contact.status}</Badge>
              </td>
              <td className="py-3 px-4 text-sm text-gray-500 hidden lg:table-cell">{formatDate(contact.createdAt)}</td>
              <td className="py-3 px-4 text-right">
                <button onClick={() => onEdit(contact)} className="text-sm text-primary-600 hover:underline mr-3">Edit</button>
                <button onClick={() => onDelete(contact)} className="text-sm text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
