import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout, Menu, theme } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  AlertOutlined,
  UserOutlined,
} from '@ant-design/icons';
import Dashboard from './components/Dashboard';
import ParcelsPage from './components/ParcelsPage';
import MapVisualization from './components/MapVisualization';
import ConflictsPage from './components/ConflictsPage';

const { Header, Content, Sider } = Layout;

function App() {
  const { token: { colorBgContainer } } = theme.useToken();

  const menuItems = [
    {
      key: '1',
      icon: <DashboardOutlined />,
      label: <Link to="/">Dashboard</Link>,
    },
    {
      key: '2',
      icon: <FileTextOutlined />,
      label: <Link to="/parcels">Parcels</Link>,
    },
    {
      key: '3',
      icon: <EnvironmentOutlined />,
      label: <Link to="/map">Map</Link>,
    },
    {
      key: '4',
      icon: <AlertOutlined />,
      label: <Link to="/conflicts">Conflicts</Link>,
    },
    {
      key: '5',
      icon: <UserOutlined />,
      label: <Link to="/owners">Owners</Link>,
    },
  ];

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          breakpoint="lg"
          collapsedWidth={0}
          onBreakpoint={(broken) => console.log(broken)}
          onCollapse={(collapsed) => console.log(collapsed)}
        >
          <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }}>
            <h2 style={{ color: 'white', margin: 0, textAlign: 'center' }}>LandBiznes</h2>
          </div>
          <Menu theme="dark" mode="inline" items={menuItems} />
        </Sider>

        <Layout>
          <Header style={{ background: colorBgContainer }}>
            <h1>Land Registry Management System</h1>
          </Header>

          <Content style={{ margin: '16px' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/parcels" element={<ParcelsPage gridId="default" />} />
              <Route path="/map" element={<MapVisualization />} />
              <Route path="/conflicts" element={<ConflictsPage gridId="default" />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
}

export default App;
