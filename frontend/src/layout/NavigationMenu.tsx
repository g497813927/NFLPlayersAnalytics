import { ApartmentOutlined } from '@ant-design/icons';
import { Menu } from 'antd';
import { Link } from 'react-router-dom';
import { navigation } from './navigation';

interface Props {
  collapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
}

export function NavigationMenu({ collapsed, pathname, onNavigate }: Props) {
  return (
    <nav
      id="app-navigation"
      className="primary-navigation"
      aria-label="Main navigation"
    >
      <Link
        to="/"
        className="brand"
        aria-label="NFL Players Analytics home"
        onClick={onNavigate}
      >
        <span className="brand-symbol">
          <ApartmentOutlined />
        </span>
        {!collapsed && (
          <span>
            NFL ANALYTICS
            <small>Prototype workspace</small>
          </span>
        )}
      </Link>
      {!collapsed && <div className="nav-label">EXPLORE</div>}
      <Menu
        theme="dark"
        mode="inline"
        inlineCollapsed={collapsed}
        selectedKeys={[pathname]}
        onClick={onNavigate}
        items={navigation.map((item) =>
          item.type === 'divider'
            ? item
            : { ...item, label: <Link to={item.key}>{item.label}</Link> },
        )}
      />
    </nav>
  );
}
