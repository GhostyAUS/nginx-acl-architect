
import { FC, useState } from 'react';
import { IpAclGroup, IpAclEntry } from '@/types/nginx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import IpAclEntryRow from './IpAclEntryRow';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { validateCidr } from '@/services/nginx-service';

interface IpAclGroupCardProps {
  group: IpAclGroup;
  onUpdateGroup: (updatedGroup: IpAclGroup) => void;
}

const IpAclGroupCard: FC<IpAclGroupCardProps> = ({ group, onUpdateGroup }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState<IpAclEntry>({
    cidr: '',
    value: '1',
    description: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleAddEntry = () => {
    if (!validateCidr(newEntry.cidr)) {
      setError('Invalid IP address or CIDR format');
      return;
    }
    
    const updatedGroup: IpAclGroup = {
      ...group,
      entries: [...group.entries, newEntry],
    };
    
    onUpdateGroup(updatedGroup);
    setIsAddDialogOpen(false);
    setNewEntry({ cidr: '', value: '1', description: '' });
    setError(null);
  };

  const handleEditEntry = (original: IpAclEntry, updated: IpAclEntry) => {
    const updatedEntries = group.entries.map((entry) =>
      entry.cidr === original.cidr ? updated : entry
    );
    
    onUpdateGroup({
      ...group,
      entries: updatedEntries,
    });
  };

  const handleDeleteEntry = (entryToDelete: IpAclEntry) => {
    const updatedEntries = group.entries.filter(
      (entry) => entry.cidr !== entryToDelete.cidr
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
            Add IP
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    IP/CIDR
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
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
                    <td colSpan={4} className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                      No IP addresses defined in this group
                    </td>
                  </tr>
                ) : (
                  group.entries.map((entry) => (
                    <IpAclEntryRow
                      key={entry.cidr}
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
            <DialogTitle>Add New IP Address</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-cidr">IP Address / CIDR</Label>
              <Input
                id="new-cidr"
                value={newEntry.cidr}
                onChange={(e) => setNewEntry({ ...newEntry, cidr: e.target.value })}
                placeholder="192.168.1.0/24"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
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

export default IpAclGroupCard;
