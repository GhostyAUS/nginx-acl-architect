
import { FC, useState } from 'react';
import { UrlAclEntry } from '@/types/nginx';
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
import { Checkbox } from '@/components/ui/checkbox';
import { validateUrlPattern } from '@/services/nginx-service';

interface UrlAclEntryRowProps {
  entry: UrlAclEntry;
  onEdit: (original: UrlAclEntry, updated: UrlAclEntry) => void;
  onDelete: (entry: UrlAclEntry) => void;
}

const UrlAclEntryRow: FC<UrlAclEntryRowProps> = ({ entry, onEdit, onDelete }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedEntry, setEditedEntry] = useState<UrlAclEntry>({ ...entry });
  const [error, setError] = useState<string | null>(null);

  const handleEditSubmit = () => {
    if (!validateUrlPattern(editedEntry.pattern, editedEntry.isRegex)) {
      setError('Invalid URL pattern');
      return;
    }
    
    onEdit(entry, editedEntry);
    setIsEditDialogOpen(false);
    setError(null);
  };

  return (
    <>
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
          {entry.isRegex ? <span className="font-mono">^{entry.pattern}$</span> : entry.pattern}
        </td>
        <td className="px-4 py-3 text-sm">
          <StatusBadge status={entry.value === '1' ? 'active' : 'error'} />
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
          {entry.isRegex ? (
            <span className="inline-flex items-center rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              Regex
            </span>
          ) : (
            <span className="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              Exact
            </span>
          )}
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
            <DialogTitle>Edit URL ACL Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="pattern">URL Pattern</Label>
              <Input
                id="pattern"
                value={editedEntry.pattern}
                onChange={(e) => setEditedEntry({ ...editedEntry, pattern: e.target.value })}
                placeholder="example.com"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-regex"
                checked={editedEntry.isRegex}
                onCheckedChange={(checked) => 
                  setEditedEntry({ ...editedEntry, isRegex: !!checked })
                }
              />
              <Label htmlFor="is-regex">Treat as regular expression</Label>
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
              Are you sure you want to delete the entry for <strong>{entry.pattern}</strong>? This action cannot be undone.
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

export default UrlAclEntryRow;
