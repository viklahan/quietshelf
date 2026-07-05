/* Quiet Shelf — app root. Quiet header, four routes, no storage. */
const QSDS_app = window.QuietFightClubDesignSystem_fae847;
const { Icon: QSIcoApp } = QSDS_app;

const QS_TABS = [
  { id: 'format', label: 'Format', icon: 'book-open' },
  { id: 'blurb', label: 'Blurb', icon: 'feather' },
  { id: 'promote', label: 'Promote', icon: 'film' },
  { id: 'storymap', label: 'Story Map', icon: 'search' },
];

function App() {
  const [tab, setTab] = React.useState('home');

  React.useEffect(() => { window.scrollTo({ top: 0 }); }, [tab]);

  let view = null;
  if (tab === 'home') view = <window.Home onNavigate={setTab} />;
  else if (tab === 'format') view = <window.Format />;
  else if (tab === 'blurb') view = <window.Blurb />;
  else if (tab === 'promote') view = <window.Promote />;
  else if (tab === 'storymap') view = <window.StoryMapPage />;

  return (
    <div className="qs-app">
      <header className="qs-header">
        <button type="button" className="qs-brand" onClick={() => setTab('home')} aria-label="Quiet Shelf, home">
          <span className="qs-brand__name">Quiet Shelf</span>
          <span className="qs-brand__sub">Your story, made real.</span>
        </button>
        <nav className="qs-nav" aria-label="Sections">
          {QS_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`qs-nav__tab${tab === t.id ? ' qs-nav__tab--active' : ''}`}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
            >
              <QSIcoApp name={t.icon} size={15} className="qs-nav__ico" />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      </header>
      <main className="qs-main" key={tab}>{view}</main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
