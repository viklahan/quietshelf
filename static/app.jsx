/* Quiet Shelf — app root. Quiet header, four routes, no storage.
   Browser back/forward navigates between tabs via pushState + popstate. */
const QSDS_app = window.QuietFightClubDesignSystem_fae847;
const { Icon: QSIcoApp } = QSDS_app;

const QS_TABS = [
  { id: 'format', label: 'Format', icon: 'book-open' },
  { id: 'blurb', label: 'Blurb', icon: 'feather' },
  { id: 'promote', label: 'Promote', icon: 'film' },
  { id: 'storymap', label: 'Story Map', icon: 'search' },
  { id: 'scout', label: 'Scout', icon: 'sparkles' },
];

const QS_VALID_TABS = ['home', 'format', 'blurb', 'promote', 'storymap', 'scout', 'about'];

function tabFromLocation() {
  const hash = window.location.hash.replace('#', '');
  return QS_VALID_TABS.includes(hash) ? hash : 'home';
}

function App() {
  const [tab, setTab] = React.useState(tabFromLocation);

  // Push a history entry on every tab change so the browser back button
  // navigates between tabs instead of leaving the site entirely.
  function navigateTo(nextTab) {
    if (nextTab === tab) return;
    window.history.pushState({ tab: nextTab }, '', '#' + nextTab);
    setTab(nextTab);
    window.scrollTo({ top: 0 });
  }

  React.useEffect(() => {
    // Seed the initial history entry.
    window.history.replaceState({ tab: tab }, '', '#' + tab);

    function onPop(e) {
      const t = (e.state && e.state.tab) || tabFromLocation();
      setTab(QS_VALID_TABS.includes(t) ? t : 'home');
      window.scrollTo({ top: 0 });
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  let view = null;
  if (tab === 'home') view = <window.Home onNavigate={navigateTo} />;
  else if (tab === 'format') view = <window.Format />;
  else if (tab === 'blurb') view = <window.Blurb />;
  else if (tab === 'promote') view = <window.Promote />;
  else if (tab === 'storymap') view = <window.StoryMapPage />;
  else if (tab === 'scout') view = <window.ScoutPage />;
  else if (tab === 'about') view = <window.About onNavigate={navigateTo} />;

  return (
    <div className="qs-app">
      <header className="qs-header">
        <button type="button" className="qs-brand" onClick={() => navigateTo('home')} aria-label="Quiet Shelf, home">
          <img src="/static/assets/logo-mark.svg" alt="" width="26" height="26" style={{ display: 'block' }} />
          <span className="qs-brand__text">
            <span className="qs-brand__name">Quiet Shelf</span>
            <span className="qs-brand__sub">Your story, made real.</span>
          </span>
        </button>
        <nav className="qs-nav" aria-label="Sections">
          {QS_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`qs-nav__tab${tab === t.id ? ' qs-nav__tab--active' : ''}`}
              onClick={() => navigateTo(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
            >
              <QSIcoApp name={t.icon} size={15} className="qs-nav__ico" />
              <span>{t.label}</span>
            </button>
          ))}
          <button
            type="button"
            className={`qs-nav__tab${tab === 'about' ? ' qs-nav__tab--active' : ''}`}
            onClick={() => navigateTo('about')}
            aria-current={tab === 'about' ? 'page' : undefined}
            style={{ opacity: 0.7 }}
          >
            <span>About</span>
          </button>
        </nav>
      </header>
      <main className="qs-main" key={tab}>{view}</main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
