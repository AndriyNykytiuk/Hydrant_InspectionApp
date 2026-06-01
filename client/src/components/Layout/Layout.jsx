import { Outlet } from 'react-router-dom';
import { Header } from '../Header/Header.jsx';
import './Layout.scss';

export function Layout() {
  return (
    <div className="layout">
      <Header />
      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  );
}
