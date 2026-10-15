import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import App from './App.jsx';
import 'antd/dist/reset.css';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider theme={{
      token: {
        colorPrimary: '#147c79', colorInfo: '#147c79', colorText: '#172c3e',
        colorBgLayout: '#f4f6f8', borderRadius: 8,
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      },
      components: { Table: { headerBg: '#f7f9fa' }, Menu: { darkItemBg: '#102438', darkItemSelectedBg: '#23465b' } },
    }}>
      <AntApp><BrowserRouter><App /></BrowserRouter></AntApp>
    </ConfigProvider>
  </React.StrictMode>,
);
