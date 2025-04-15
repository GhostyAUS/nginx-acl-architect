
import { FC, useState } from 'react';
import { IpAclEntry } from '@/types/nginx';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Edit, Trash2 } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { validateCidr } from '@/services/nginx-service';

interface IpAclEntryRowProps {
  entry: IpAclEntry;
  onEdit: (original: IpAclEntry, updated: IpAclEntry) => void;
  onDelete: (entry: IpAclEntry) => void;
}

const IpAclEntryRow: FC<IpAclEntryRowProps> = ({ entry, onEdit, onDelete }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedEntry, setEditedEntry] = useState<IpAclEntry>({ ...entry });
  const [error, setError] = useState<string | null>(null);

  const handleEditSubmit = () => {
    if (!validateCidr(editedEntry.cidr)) {
      setError('Invalid IP address or CIDR format');
      return;
    }
    
    onEdit(entry, editedEntry);
    setIsEditDialogOpen(false);
    setError(null);
  };

  return (
    <>
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{entry.cidr}</td>
        <td className="px-4 py-3 text-sm">
          <StatusBadge status={entry.value === '1' ? 'active' : 'error'} />
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{entry.description}</td>
        <td className="px-4 py-3 text-sm text-right">
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditDialogOpen(true)}
              title="Edit entry"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDeleteDialogOpen(true)}
              title="Delete entry"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </td>
      </tr>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit IP ACL Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cidr">IP Address / CIDR</Label>
              <Input
                id="cidr"
                value={editedEntry.cidr}
                onChange={(e) => setEditedEntry({ ...editedEntry, cidr: e.target.value })}
                placeholder="192.168.1.0/24"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Action</Label>
              <select
                id="value"
                value={editedEntry.value}
                onChange={(e) => setEditedEntry({ ...editedEntry, value: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="1">Allow</option>
                <option value="0">Deny</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={editedEntry.description}
                onChange={(e) => setEditedEntry({ ...editedEntry, description: e.target.value })}
                placeholder="Description for this rule"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete ACL Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the entry for <strong>{entry.cidr}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(entry)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default IpAclEntryRow;
