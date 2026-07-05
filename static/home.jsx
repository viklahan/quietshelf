/* Quiet Shelf — Home. Name, one warm line, three soft doorways, the shelf. */
const QSDS_home = window.QuietFightClubDesignSystem_fae847;
const { Icon: QSIconHome } = QSDS_home;

function Door({ icon, title, line, onOpen }) {
  return (
    <button type="button" className="qs-door" onClick={onOpen}>
      <span className="qs-door__ico"><QSIconHome name={icon} size={20} /></span>
      <h2 className="qs-door__title">{title}</h2>
      <p className="qs-door__line">{line}</p>
      <span className="qs-door__go">Open<QSIconHome name="arrow-right" size={13} /></span>
    </button>
  );
}

function Home({ onNavigate }) {
  const Shelf = window.Shelf;
  return (
    <div className="qs-page qs-home">
      <div className="qs-home__hero">
        <h1 className="qs-home__name">Quiet Shelf</h1>
        <p className="qs-home__tag">Your story, made real.</p>
        <p className="qs-home__intro">
          You’ve carried this long enough. Set it down here, and let it become
          something you can hold. Choose where you’d like to begin.
        </p>
      </div>

      <div className="qs-doors">
        <Door
          icon="book-open"
          title="Format"
          line="Turn your manuscript into a beautiful book."
          onOpen={() => onNavigate('format')}
        />
        <Door
          icon="feather"
          title="Blurb"
          line="Find the words to describe your book."
          onOpen={() => onNavigate('blurb')}
        />
        <Door
          icon="film"
          title="Promote"
          line="Turn your writing into a video plan."
          onOpen={() => onNavigate('promote')}
        />
        <Door
          icon="search"
          title="Story Map"
          line="See who’s in your story, and how they connect."
          onOpen={() => onNavigate('storymap')}
        />
      </div>

      <div className="qs-shelfwrap">
        <p className="qs-shelfcap">Your shelf is waiting</p>
        <Shelf />
        <p className="qs-quiethint" style={{ display: 'block', textAlign: 'center', marginTop: 'var(--space-6)' }}>
          Format your first manuscript, and it’ll feel like it belongs on a shelf.
        </p>
      </div>
    </div>
  );
}

window.Home = Home;
