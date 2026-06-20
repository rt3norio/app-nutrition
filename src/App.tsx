import { useEffect } from 'react';
import { HashRouter, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { StoreProvider, useStore } from './store';
import Today from './pages/Today';
import Plan from './pages/Plan';
import History from './pages/History';
import Coach from './pages/Coach';
import Data from './pages/Data';
import Help from './pages/Help';
import Settings from './pages/Settings';
import Workout from './pages/Workout';

function Shell() {
  const { doc, status, signedIn, effectiveClientId, settings } = useStore();
  const hasFood = doc.plan.meals.length > 0;
  const hasWorkouts = (doc.workouts?.length ?? 0) > 0;
  return (
    <div className="app">
      <Landing hasFood={hasFood} hasWorkouts={hasWorkouts} />
      <header className="topbar">
        <span className="logo" aria-hidden>🥗</span>
        <h1>MealMind</h1>
        <span className="spacer" />
        <span className="sync-dot">
          {effectiveClientId ? (signedIn ? '● Drive' : '○ Drive') : ''}
        </span>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/plano" element={<Plan />} />
          <Route path="/treino" element={<Workout />} />
          <Route path="/historico" element={<History />} />
          <Route path="/coach" element={<Coach />} />
          <Route path="/dados" element={<Data />} />
          <Route path="/ajuda" element={<Help />} />
          <Route path="/config" element={<Settings />} />
        </Routes>
      </main>

      {status && <div className="status-toast">{status}</div>}

      <div className="tabbar">
        <nav>
          {hasFood && <Tab to="/" icon="📅" label="Hoje" />}
          {hasFood && <Tab to="/plano" icon="📋" label="Plano" />}
          {hasWorkouts && <Tab to="/treino" icon="🏋️" label="Treino" />}
          {hasFood && <Tab to="/historico" icon="📊" label="Hist." />}
          {hasFood && settings.openrouterKey && <Tab to="/coach" icon="💬" label="Coach" />}
          <Tab to="/dados" icon="🔄" label="Dados" />
          <Tab to="/ajuda" icon="❓" label="Ajuda" />
          <Tab to="/config" icon="⚙️" label="Config" />
        </nav>
      </div>
    </div>
  );
}

/** When the active tab has no data behind it, send the user to one that does. */
function Landing({ hasFood, hasWorkouts }: { hasFood: boolean; hasWorkouts: boolean }) {
  const nav = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => {
    const foodPaths = ['/', '/plano', '/historico', '/coach'];
    if (!hasFood && foodPaths.includes(pathname)) {
      nav(hasWorkouts ? '/treino' : '/dados', { replace: true });
    } else if (!hasWorkouts && pathname === '/treino') {
      nav(hasFood ? '/' : '/dados', { replace: true });
    }
  }, [hasFood, hasWorkouts, pathname, nav]);
  return null;
}

function Tab({ to, icon, label }: { to: string; icon: string; label: string }) {
  return (
    <NavLink to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
      <span className="ic" aria-hidden>{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export default function App() {
  return (
    <HashRouter>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </HashRouter>
  );
}
