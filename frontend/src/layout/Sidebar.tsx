import { ApartmentOutlined } from '@ant-design/icons';
import { Layout, Menu } from 'antd';
import { Link } from 'react-router-dom';
import { navigation } from './navigation';

interface Props {
  collapsed: boolean;
  pathname: string;
  onBreakpoint: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, pathname, onBreakpoint }: Props) {
  return (
    <Layout.Sider
      width={236}
      collapsedWidth={72}
      collapsed={collapsed}
      breakpoint="lg"
      onBreakpoint={onBreakpoint}
      className="sidebar"
    >
      <Link to="/" className="brand" aria-label="NFL Players Analytics home">
        <span className="brand-symbol">
          <ApartmentOutlined />
        </span>
        {!collapsed && (
          <span>
            NFL ANALYTICS<small>Prototype workspace</small>
          </span>
        )}
      </Link>
      {!collapsed && <div className="nav-label">EXPLORE</div>}
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[pathname]}
        items={navigation.map((item) =>
          item.type === 'divider'
            ? item
            : { ...item, label: <Link to={item.key}>{item.label}</Link> },
        )}
      />
      <div className={`sidebar-footer ${collapsed ? 'collapsed' : ''}`}>
        <span className="prototype-dot" />
        {!collapsed && (
          <div>
            Prototype 01<small>Built for discovery.</small>
          </div>
        )}
      </div>
    </Layout.Sider>
  );
}
