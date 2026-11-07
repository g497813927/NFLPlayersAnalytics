import { Layout } from 'antd';
import { NavigationMenu } from './NavigationMenu';

interface Props {
  collapsed: boolean;
  pathname: string;
}

export function Sidebar({ collapsed, pathname }: Props) {
  return (
    <Layout.Sider
      width={236}
      collapsedWidth={72}
      collapsed={collapsed}
      className="sidebar"
    >
      <NavigationMenu
        collapsed={collapsed}
        pathname={pathname}
      />
    </Layout.Sider>
  );
}
