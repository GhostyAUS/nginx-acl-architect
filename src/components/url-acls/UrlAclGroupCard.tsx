
import { FC, useState } from 'react';
import { UrlAclGroup, UrlAclEntry } from '@/types/nginx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import UrlAclEntryRow from './UrlAclEntryRow';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { validateUrlPattern } from '@/services/nginx-service';

interface UrlAclGroupCardProps {
  group: UrlAclGroup;
  onUpdateGroup: (updatedGroup: UrlAclGroup) => void;
}

const UrlAclGroupCard: FC<UrlAclGroupCardProps> = ({ group, onUpdateGroup }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState<UrlAclEntry>({
    pattern: '',
    value: '1',
    description: '',
    isRegex: false,
  });
  const [error, setError] = useState<string | null>(null);

  const handleAddEntry = () => {
    if (!validateUrlPattern(newEntry.pattern, newEntry.isRegex)) {
      setError('Invalid URL pattern');
      return;
    }
    
    const updatedGroup: UrlAclGroup = {
      ...group,
      entries: [...group.entries, newEntry],
    };
    
    onUpdateGroup(updatedGroup);
    setIsAddDialogOpen(false);
    setNewEntry({ pattern: '', value: '1', description: '', isRegex: false });
    setError(null);
  };

  const handleEditEntry = (original: UrlAclEntry, updated: UrlAclEntry) => {
    const updatedEntries = group.entries.map((entry) =>
      entry.pattern === original.pattern && entry.isRegex === original.isRegex ? updated : entry
    );
    
    onUpdateGroup({
      ...group,
      entries: updatedEntries,
    });
  };

  const handleDeleteEntry = (entryToDelete: UrlAclEntry) => {
    const updatedEntries = group.entries.filter(
      (entry) => entry.pattern !== entryToDelete.pattern || entry.isRegex !== entryToDelete.isRegex
    );
    
    onUpdateGroup({
      ...group,
      entries: updatedEntries,
    });
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl">{group.description}</CardTitle>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add URL
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    URL Pattern
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {group.entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                      No URL patterns defined in this group
                    </td>
                  </tr>
                ) : (
                  group.entries.map((entry, index) => (
                    <UrlAclEntryRow
                      key={`${entry.pattern}-${index}`}
                      entry={entry}
                      onEdit={handleEditEntry}
                      onDelete={handleDeleteEntry}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add New Entry Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New URL Pattern</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-pattern">URL Pattern</Label>
              <Input
                id="new-pattern"
                value={newEntry.pattern}
                onChange={(e) => setNewEntry({ ...newEntry, pattern: e.target.value })}
                placeholder="example.com"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="new-is-regex"
                checked={newEntry.isRegex}
                onCheckedChange={(checked) => 
                  setNewEntry({ ...newEntry, isRegex: !!checked })
                }
              />
              <Label htmlFor="new-is-regex">Treat as regular expression</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-value">Action</Label>
              <select
                id="new-value"
                value={newEntry.value}
                onChange={(e) => setNewEntry({ ...newEntry, value: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="1">Allow</option>
                <option value="0">Deny</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-description">Description</Label>
              <Input
                id="new-description"
                value={newEntry.description}
                onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                placeholder="Description for this rule"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEntry}>Add Entry</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UrlAclGroupCard;
