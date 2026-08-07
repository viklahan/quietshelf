"""Exact-term mode: Thumbnail Studio queries must reach photo APIs unmangled."""
from app.services.format import cover_suggestions as cs


def test_exact_mode_uses_query_verbatim(monkeypatch):
    searched = []
    def fake_search(client, term, n):
        searched.append(term)
        return [{"url": f"https://x/{term}/{i}", "thumb_url": "", "source": "test", "photographer": ""} for i in range(n)]
    monkeypatch.setattr(cs, "_search_term", fake_search)

    out = cs.get_cover_suggestions("woman gentle smile warm window light cinematic", "", n=12, exact=True)
    assert searched == ["woman gentle smile warm window light cinematic"]
    assert len(out) == 12


def test_exact_mode_never_adds_static_fallback_terms(monkeypatch):
    searched = []
    monkeypatch.setattr(cs, "_search_term", lambda c, t, n: (searched.append(t) or []))
    cs.get_cover_suggestions("brooding portrait harsh shadow", "", n=6, exact=True)
    assert "moody landscape" not in searched
    assert "morning light window" not in searched


def test_default_mode_unchanged(monkeypatch):
    searched = []
    monkeypatch.setattr(cs, "_search_term", lambda c, t, n: (searched.append(t) or []))
    monkeypatch.setattr(cs, "_extract_terms", lambda t, p: ["term one", "term two"])
    cs.get_cover_suggestions("My Book", "a passage", n=3)
    assert searched == ["term one", "term two"]


def test_endpoint_honors_n_12(monkeypatch):
    """The ROUTER clamp bit us once: n=12 must survive the full HTTP path."""
    from fastapi.testclient import TestClient
    from app.main import app

    seen = {}
    def fake_get(title, passage, n, exact):
        seen.update(title=title, n=n, exact=exact)
        return []
    import app.services.format.router as fr
    monkeypatch.setattr(fr, "get_cover_suggestions", fake_get)

    client = TestClient(app)
    r = client.post("/api/format/cover-suggestions",
                    data={"title": "brooding portrait close up", "passage": "", "n": "12", "exact": "true"})
    assert r.status_code == 200
    assert seen["n"] == 12
    assert seen["exact"] is True
    assert seen["title"] == "brooding portrait close up"
