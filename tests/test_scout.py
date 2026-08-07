"""Scout harvest: stripper correctness + endpoint contract (mocked network)."""
import json

import pytest
from fastapi.testclient import TestClient

from app.services.scout import reddit


def _child(**kw):
    d = {
        "title": "Why does achieving my goal feel so empty?",
        "selftext": "I finally got the promotion I worked 3 years for and I feel... nothing?",
        "score": 847, "num_comments": 312, "created_utc": 1753700000,
        "permalink": "/r/selfimprovement/comments/abc/", "subreddit": "selfimprovement",
        "stickied": False,
    }
    d.update(kw)
    return {"kind": "t3", "data": d}


def test_strip_post_keeps_human_fields():
    p = reddit.strip_post(_child())
    assert p["title"].startswith("Why does")
    assert p["score"] == 847 and p["comments"] == 312
    assert p["permalink"].startswith("https://reddit.com/r/")
    assert "promotion" in p["body"]


def test_strip_post_drops_stickied_and_empty():
    assert reddit.strip_post(_child(stickied=True)) is None
    assert reddit.strip_post(_child(title="")) is None


def test_strip_post_caps_walls_of_text():
    p = reddit.strip_post(_child(selftext="word " * 1000))
    assert len(p["body"]) <= reddit.SELFTEXT_CAP + 2
    assert p["body"].endswith("\u2026")


def test_clean_source_forms():
    for form in ("selfimprovement", "r/selfimprovement", "/r/selfimprovement/",
                 "https://www.reddit.com/r/selfimprovement"):
        assert reddit._clean_source(form) == "selfimprovement"


def test_build_material_contains_signal_numbers():
    posts = [reddit.strip_post(_child())]
    mat = reddit.build_material(posts)
    assert "\u25b2847" in mat and "312 comments" in mat
    assert "https://reddit.com" in mat


def test_harvest_endpoint_contract(monkeypatch, tmp_path):
    from app.main import app
    client = TestClient(app)

    def fake_fetch(client_, sub, listing):
        return [reddit.strip_post(_child(
            title=f"{sub} {listing} question?",
            permalink=f"/r/{sub}/comments/{listing}/",
            subreddit=sub,
        ))]
    monkeypatch.setattr(reddit, "fetch_listing", fake_fetch)
    monkeypatch.setattr(reddit, "SNAPSHOT_DIR", tmp_path)

    r = client.post("/api/scout/harvest", json={"sources": ["r/selfimprovement", "DecidingToBeBetter"]})
    assert r.status_code == 200
    d = r.json()
    assert d["post_count"] >= 2
    assert d["word_count"] > 0
    assert "selfimprovement" in d["sources"]
    assert d["snapshot"] and d["snapshot"].endswith(".json")
    # snapshot really landed
    assert list(tmp_path.glob("*.json"))


def test_harvest_endpoint_rejects_garbage():
    from app.main import app
    client = TestClient(app)
    r = client.post("/api/scout/harvest", json={"sources": [], "seeds": []})
    assert r.status_code == 422
    r = client.post("/api/scout/harvest", json={"sources": ["///"]})
    assert r.status_code in (422, 502)


def test_harvest_seeds_only_succeeds(monkeypatch):
    from app.main import app
    from app.services.scout import router as scout_router
    monkeypatch.setattr(scout_router.suggest, "gather",
                        lambda seeds: {"section": "SEARCH SUGGESTIONS (what people are typing right now):\n\nwhy am i like this", "count": 3, "errors": []})
    client = TestClient(app)
    r = client.post("/api/scout/harvest", json={"sources": [], "seeds": ["stuck"]})
    assert r.status_code == 200
    d = r.json()
    assert d["post_count"] == 0
    assert d["suggestion_count"] == 3
    assert d["material"].startswith("SEARCH SUGGESTIONS")


def test_synthesize_contract(monkeypatch):
    from app.main import app
    from app.services.scout import router as scout_router

    class FakeProvider:
        def generate(self, system, user, json_mode=True):
            assert json_mode is False
            assert "MATERIAL:" in user
            assert "editorial researcher" in system
            return "## THE ONE TO MAKE THIS WEEK\n\nBeing seen vs being connected."
    monkeypatch.setattr(scout_router.registry, "get_provider", lambda: FakeProvider())

    client = TestClient(app)
    r = client.post("/api/scout/synthesize", json={
        "prompt": "You are an editorial researcher for a quiet channel. Find contradictions.",
        "material": "[r/x] Why does achieving my goal feel empty? " * 5,
    })
    assert r.status_code == 200
    d = r.json()
    assert "THE ONE" in d["result"]
    assert d["material_truncated"] is False


def test_synthesize_caps_huge_material(monkeypatch):
    from app.main import app
    from app.services.scout import router as scout_router

    seen = {}
    class FakeProvider:
        def generate(self, system, user, json_mode=True):
            seen["user_words"] = len(user.split())
            return "ok"
    monkeypatch.setattr(scout_router.registry, "get_provider", lambda: FakeProvider())

    client = TestClient(app)
    r = client.post("/api/scout/synthesize", json={
        "prompt": "Editorial prompt long enough to pass validation here.",
        "material": "word " * 20000,
    })
    assert r.status_code == 200
    assert r.json()["material_truncated"] is True
    assert seen["user_words"] <= scout_router.SYNTH_MATERIAL_CAP + 20


def test_synthesize_rejects_empty_prompt():
    from app.main import app
    client = TestClient(app)
    r = client.post("/api/scout/synthesize", json={"prompt": "hi", "material": "x " * 50})
    assert r.status_code == 422


def test_synthesize_dead_providers_is_clean_502(monkeypatch):
    from app.main import app
    from app.services.scout import router as scout_router
    from app.providers.base import ProviderError

    class DeadProvider:
        def generate(self, *a, **k):
            raise ProviderError("All waterfall providers failed")
    monkeypatch.setattr(scout_router.registry, "get_provider", lambda: DeadProvider())

    client = TestClient(app)
    r = client.post("/api/scout/synthesize", json={
        "prompt": "Editorial prompt long enough to pass validation.",
        "material": "x " * 50,
    })
    assert r.status_code == 502
    assert "unavailable" in r.json()["detail"]


def test_suggest_gather_fans_and_dedupes(monkeypatch):
    from app.services.scout import suggest

    calls = []
    def fake_fetch(client, engine, query):
        calls.append((engine, query))
        # engine-specific completions, plus one overlap to prove global dedupe
        return [f"{engine} {query} suggestion", "feeling stuck at work"]
    monkeypatch.setattr(suggest, "fetch_suggestions", fake_fetch)

    out = suggest.gather(["feeling stuck"])
    assert out["count"] > 0
    assert "SEARCH SUGGESTIONS" in out["section"]
    assert "[google autocomplete]" in out["section"]
    assert "[youtube autocomplete]" in out["section"]
    # duplicate "feeling stuck at work" collapsed to one line
    assert out["section"].count("feeling stuck at work") == 1
    # fanout hit ALL engines x prefixes
    engines = {c[0] for c in calls}
    assert engines == {"google", "youtube", "bing", "yahoo", "yandex"}


def test_harvest_with_seeds_merges_sections(monkeypatch, tmp_path):
    from app.main import app
    from app.services.scout import router as scout_router

    def fake_fetch(client_, sub, listing):
        return [reddit.strip_post(_child(
            title=f"{sub} {listing} question?",
            permalink=f"/r/{sub}/comments/{listing}/", subreddit=sub))]
    monkeypatch.setattr(reddit, "fetch_listing", fake_fetch)
    monkeypatch.setattr(reddit, "SNAPSHOT_DIR", tmp_path)
    monkeypatch.setattr(scout_router.suggest, "gather",
                        lambda seeds: {"section": "SEARCH SUGGESTIONS (what people are typing right now):\n\nwhy am i stuck", "count": 1, "errors": []})

    client = TestClient(app)
    r = client.post("/api/scout/harvest", json={
        "sources": ["selfimprovement"], "seeds": ["stuck"]})
    assert r.status_code == 200
    d = r.json()
    assert d["suggestion_count"] == 1
    assert d["material"].startswith("SEARCH SUGGESTIONS")
    assert "---" in d["material"]


def test_harvest_without_seeds_unchanged(monkeypatch, tmp_path):
    from app.main import app
    def fake_fetch(client_, sub, listing):
        return [reddit.strip_post(_child(permalink=f"/r/x/{listing}/"))]
    monkeypatch.setattr(reddit, "fetch_listing", fake_fetch)
    monkeypatch.setattr(reddit, "SNAPSHOT_DIR", tmp_path)
    client = TestClient(app)
    r = client.post("/api/scout/harvest", json={"sources": ["selfimprovement"]})
    assert r.status_code == 200
    assert r.json()["suggestion_count"] == 0


def test_fetch_listing_never_masks_identity(monkeypatch):
    """Responsible Builder Policy: no masking how we access. Every request,
    anonymous or OAuth, must carry the honest QuietShelf UA."""
    import httpx as _httpx
    reddit._cache.clear()
    reddit._token["value"] = None
    monkeypatch.delenv("REDDIT_CLIENT_ID", raising=False)
    monkeypatch.delenv("REDDIT_CLIENT_SECRET", raising=False)
    monkeypatch.setattr(reddit.time, "sleep", lambda s: None)
    seen = []

    class FakeResp:
        status_code = 403
        def raise_for_status(self):
            raise _httpx.HTTPStatusError("x", request=None, response=self)
        def json(self):
            return {}

    class FakeClient:
        def get(self, url, params=None, headers=None, timeout=None):
            seen.append(headers["User-Agent"])
            return FakeResp()

    with pytest.raises(_httpx.HTTPStatusError):
        reddit.fetch_listing(FakeClient(), "selfimprovement", "rising")
    assert seen, "no request made"
    assert all("QuietShelf" in ua for ua in seen)
    assert all("Mozilla" not in ua for ua in seen)


def test_fetch_listing_404_does_not_burn_attempts(monkeypatch):
    import httpx as _httpx
    reddit._cache.clear()
    monkeypatch.setattr(reddit.time, "sleep", lambda s: None)
    calls = []

    class FakeResp:
        status_code = 404
        def raise_for_status(self):
            raise _httpx.HTTPStatusError("x", request=None, response=self)
        def json(self):
            return {}

    class FakeClient:
        def get(self, url, **kw):
            calls.append(url)
            return FakeResp()

    with pytest.raises(_httpx.HTTPStatusError):
        reddit.fetch_listing(FakeClient(), "nonexistent_sub_xyz", "rising")
    assert len(calls) == 1  # 404 means the sub is gone; UA switching is pointless


def test_harvest_error_reports_status_code(monkeypatch, tmp_path):
    import httpx as _httpx
    from app.main import app
    reddit._cache.clear()
    monkeypatch.setattr(reddit, "SNAPSHOT_DIR", tmp_path)
    monkeypatch.setattr(reddit.time, "sleep", lambda s: None)

    class FakeResp:
        status_code = 403
        def raise_for_status(self):
            raise _httpx.HTTPStatusError("x", request=None, response=self)

    def dead_fetch(client, sub, listing):
        raise _httpx.HTTPStatusError("x", request=None, response=FakeResp())
    monkeypatch.setattr(reddit, "fetch_listing", dead_fetch)

    client = TestClient(app)
    r = client.post("/api/scout/harvest", json={"sources": ["selfimprovement"]})
    assert r.status_code == 502
    assert "HTTP 403" in r.json()["detail"]


def test_oauth_path_used_when_creds_present(monkeypatch):
    reddit._cache.clear()
    reddit._token["value"] = None
    monkeypatch.setenv("REDDIT_CLIENT_ID", "cid123")
    monkeypatch.setenv("REDDIT_CLIENT_SECRET", "sec456")
    monkeypatch.setattr(reddit.time, "sleep", lambda s: None)
    seen = {"posts": [], "token": []}

    class FakeResp:
        def __init__(self, payload):
            self.status_code = 200
            self._p = payload
        def raise_for_status(self):
            pass
        def json(self):
            return self._p

    class FakeClient:
        def post(self, url, data=None, auth=None, headers=None, timeout=None):
            seen["token"].append((url, auth, data))
            return FakeResp({"access_token": "tok789", "expires_in": 3600})
        def get(self, url, params=None, headers=None, timeout=None):
            seen["posts"].append((url, headers))
            return FakeResp({"data": {"children": [_child()]}})

    posts = reddit.fetch_listing(FakeClient(), "selfimprovement", "rising")
    assert len(posts) == 1
    assert seen["token"][0][1] == ("cid123", "sec456")
    url, headers = seen["posts"][0]
    assert url.startswith("https://oauth.reddit.com/")
    assert headers["Authorization"] == "bearer tok789"


def test_token_cached_across_listings(monkeypatch):
    reddit._cache.clear()
    reddit._token["value"] = None
    monkeypatch.setenv("REDDIT_CLIENT_ID", "cid")
    monkeypatch.setenv("REDDIT_CLIENT_SECRET", "sec")
    monkeypatch.setattr(reddit.time, "sleep", lambda s: None)
    token_calls = []

    class FakeResp:
        status_code = 200
        def __init__(self, p): self._p = p
        def raise_for_status(self): pass
        def json(self): return self._p

    class FakeClient:
        def post(self, *a, **k):
            token_calls.append(1)
            return FakeResp({"access_token": "t", "expires_in": 3600})
        def get(self, url, **k):
            return FakeResp({"data": {"children": [_child(permalink="/r/x/" + url[-6:])]}})

    reddit.fetch_listing(FakeClient(), "sub1", "rising")
    reddit.fetch_listing(FakeClient(), "sub1", "top")
    reddit.fetch_listing(FakeClient(), "sub2", "rising")
    assert len(token_calls) == 1  # one token serves the whole harvest


def test_no_creds_falls_back_to_anonymous(monkeypatch):
    reddit._cache.clear()
    reddit._token["value"] = None
    monkeypatch.delenv("REDDIT_CLIENT_ID", raising=False)
    monkeypatch.delenv("REDDIT_CLIENT_SECRET", raising=False)
    monkeypatch.setattr(reddit.time, "sleep", lambda s: None)
    seen = []

    class FakeResp:
        status_code = 200
        def raise_for_status(self): pass
        def json(self): return {"data": {"children": [_child()]}}

    class FakeClient:
        def post(self, *a, **k):
            raise AssertionError("must not request a token without creds")
        def get(self, url, params=None, headers=None, timeout=None):
            seen.append(url)
            return FakeResp()

    posts = reddit.fetch_listing(FakeClient(), "selfimprovement", "rising")
    assert len(posts) == 1
    assert seen[0].startswith("https://www.reddit.com/")


def test_engine_configs_use_right_query_params(monkeypatch):
    from app.services.scout import suggest
    suggest._cache.clear()
    seen = []

    class FakeResp:
        status_code = 200
        def raise_for_status(self): pass
        def json(self): return ["q", ["a suggestion"]]

    class FakeClient:
        def get(self, url, params=None, headers=None, timeout=None):
            seen.append((url, params))
            return FakeResp()

    for engine in suggest.ENGINES:
        suggest.fetch_suggestions(FakeClient(), engine, "feeling stuck")
    assert any("bing.com" in u and p.get("query") == "feeling stuck" for u, p in seen)
    assert any("yahoo.com" in u and p.get("command") == "feeling stuck" and p.get("output") == "fxjson" for u, p in seen)
    assert any("yandex.com" in u and p.get("part") == "feeling stuck" for u, p in seen)
    assert any("google.com" in u and p.get("ds") == "yt" for u, p in seen)
