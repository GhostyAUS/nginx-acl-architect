
import { FC, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash, Plus, Save, Edit } from 'lucide-react';
import { UrlAclGroup } from '@/types/nginx';
import UrlAclRuleRow from './UrlAclRuleRow';

interface UrlAclGroupCardProps {
  group: UrlAclGroup;
  onUpdateGroup: (updatedGroup: UrlAclGroup) => void;
}

const UrlAclGroupCard: FC<UrlAclGroupCardProps> = ({ group, onUpdateGroup }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(group.name);
  const [newRule, setNewRule] = useState('');

  const handleSaveGroupName = () => {
    if (editedName.trim()) {
      onUpdateGroup({
        ...group,
        name: editedName.trim()
      });
      setIsEditing(false);
    }
  };

  const handleAddRule = () => {
    if (newRule.trim()) {
      onUpdateGroup({
        ...group,
        rules: [...group.rules, newRule.trim()]
      });
      setNewRule('');
    }
  };

  const handleRemoveRule = (index: number) => {
    const updatedRules = [...group.rules];
    updatedRules.splice(index, 1);
    onUpdateGroup({
      ...group,
      rules: updatedRules
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        {isEditing ? (
          <div className="flex space-x-2 items-center">
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" size="sm" onClick={handleSaveGroupName}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        ) : (
          <CardTitle className="text-lg font-medium">
            {group.name}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="ml-2"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </CardTitle>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {group.rules.map((rule, index) => (
            <UrlAclRuleRow
              key={`${rule}-${index}`}
              rule={rule}
              onRemove={() => handleRemoveRule(index)}
            />
          ))}

          <div className="flex mt-4">
            <Input
              placeholder="Add new URL rule (e.g. *.microsoft.com)"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddRule} className="ml-2">
              <Plus className="h-4 w-4 mr-1" />
              Add Rule
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UrlAclGroupCard;
