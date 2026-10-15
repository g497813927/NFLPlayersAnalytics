import { useState } from 'react';
import { Alert, Card, Tabs } from 'antd';
import { PageHeading } from '../components';
import type { EditableResource } from '../types';
import { ENTITIES, isEditableResource } from './config';
import { ManagementTable } from './ManagementTable';

export default function ManagementPage() {
  const [entity, setEntity] = useState<EditableResource>('teams');
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
        message="Prototype workspace · no sign-in required"
        description="Changes are saved to your local demo database. Related records are selected from the database, and rejected changes receive a readable explanation."
      />
      <Card className="data-card management-card">
        <Tabs
          activeKey={entity}
          onChange={(key) => {
            if (isEditableResource(key)) setEntity(key);
          }}
          items={Object.entries(ENTITIES).map(([key, value]) => ({ key, label: value.label }))}
        />
        <ManagementTable key={entity} entity={entity} />
      </Card>
    </>
  );
}
