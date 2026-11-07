import { Drawer } from 'antd';
import { NavigationMenu } from './NavigationMenu';

interface Props {
  open: boolean;
  pathname: string;
  onClose: () => void;
}

export function MobileNavigation({ open, pathname, onClose }: Props) {
  return (
    <Drawer
      rootClassName="mobile-navigation"
      title="Navigation"
      placement="left"
      width="100%"
      open={open}
      onClose={onClose}
    >
      <NavigationMenu
        collapsed={false}
        pathname={pathname}
        onNavigate={onClose}
      />
    </Drawer>
  );
}
