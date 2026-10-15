import { Tag } from 'antd';

export function DatasetRibbon() {
  return (
    <div className="dataset-ribbon">
      <span className="dataset-dot" />
      <span>Synthetic football data</span>
      <Tag bordered={false}>LOCAL DEMO</Tag>
    </div>
  );
}
