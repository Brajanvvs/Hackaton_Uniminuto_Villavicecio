import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/tutores', label: 'Tutores' },
  { to: '/historial', label: 'Historial' },
  { to: '/configuracion', label: 'Configuración' },
];

export default function Layout() {
  return (
    <div className="app-shell">
      <aside>
        <div className="brand">
          <span className="brand-mark">Nx</span>
          <div>
            <strong>Nexo</strong>
            <span>Tutorías entre pares</span>
          </div>
        </div>
        <nav>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink to="/solicitud" className="nav-cta">Nueva solicitud</NavLink>
        </nav>
        <p className="aside-foot">Hackatón Uniminuto Villavicencio 2026</p>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
