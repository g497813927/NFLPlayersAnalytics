import { useSearchParams } from 'react-router-dom';
import { Alert, Card, Tabs } from 'antd';
import { PageHeading } from '../components';
import { ENTITIES, isEditableResource } from './config';
import { ManagementTable } from './ManagementTable';

export default function ManagementPage() {
  const [params, setParams] = useSearchParams();
  const selected = params.get('entity');
  const entity = selected && isEditableResource(selected) ? selected : 'teams';
  return (
    <>
      <PageHeading
        eyebrow="WORKSPACE"
        title="Data management"
        description="Add, edit, and remove records. Database rules keep connected data consistent."
      />
      <Alert
        className="prototype-alert"
        type="info"
        showIcon
        message="Admin workspace · changes are shared with all users"
        description="Changes are saved to your local demo database. Related records are selected from the database, and rejected changes receive a readable explanation."
      />
      <Card className="data-card management-card">
        <Tabs
          activeKey={entity}
          onChange={(key) => {
            if (isEditableResource(key)) setParams({ entity: key });
          }}
          items={Object.entries(ENTITIES).map(([key, value]) => ({ key, label: value.label }))}
        />
        <ManagementTable
          key={entity}
          entity={entity}
        />
      </Card>
    </>
  );
}
