
import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageTitle from '@/components/common/PageTitle';
import { Server, Globe, CheckCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  description: string;
  color: string;
}

const StatsCard: FC<StatsCardProps> = ({ title, value, icon: Icon, description, color }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </CardContent>
    </Card>
  );
};

const Dashboard: FC = () => {
  const stats = [
    {
      title: 'IP ACL Groups',
      value: '2',
      icon: Server,
      description: 'Production and Test networks',
      color: 'text-blue-500',
    },
    {
      title: 'URL ACL Groups',
      value: '3',
      icon: Globe,
      description: 'Microsoft, RedHat, and CDN domains',
      color: 'text-indigo-500',
    },
    {
      title: 'Allow Rules',
      value: '8',
      icon: CheckCircle,
      description: 'Total allowed entries',
      color: 'text-green-500',
    },
    {
      title: 'Deny Rules',
      value: '0',
      icon: AlertTriangle,
      description: 'Total denied entries',
      color: 'text-red-500',
    },
  ];

  return (
    <div>
      <PageTitle
        title="NGINX ACL Dashboard"
        description="Manage and monitor your NGINX forward proxy access control lists"
        actions={
          <Button asChild>
            <Link to="/settings">Configuration</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            description={stat.description}
            color={stat.color}
          />
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>IP-based ACL Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Control access to the proxy based on source IP addresses. Configure internal networks,
              specific hosts, and test environments.
            </p>
            <Button asChild variant="outline">
              <Link to="/ip-acls">Manage IP ACLs</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>URL-based ACL Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Define which destination domains are allowed or blocked. Configure access to services
              like Microsoft, RedHat, and CDN providers.
            </p>
            <Button asChild variant="outline">
              <Link to="/url-acls">Manage URL ACLs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
