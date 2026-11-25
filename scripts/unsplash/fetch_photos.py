#!/usr/bin/env python3
"""Build the Unsplash photo library (photos/ + catalog/photos.json + CREDITS).

Uses the official Unsplash API (https://unsplash.com/documentation) and follows
its guidelines: images are fetched from the returned urls (imgix), every photo
we keep triggers its download_location endpoint once, and every item carries a
photographer + Unsplash credit with utm referral links.

Resumable: progress lives in scripts/unsplash/state.json, so a run stops when its
request budget is spent (demo apps get 50 requests/hour) and the next run picks up.

Env:
  UNSPLASH_ACCESS_KEY  required
  UNSPLASH_APP_NAME    utm_source value, default "lab_asset_library"
  MAX_REQUESTS         API calls this run, default 45
Exit code 0 always on budget stop; prints COMPLETE when the library is finished.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HERE = os.path.join(ROOT, "scripts", "unsplash")
STATE = os.path.join(HERE, "state.json")
CATS = os.path.join(HERE, "categories.json")
CATALOG = os.path.join(ROOT, "catalog", "photos.json")
CREDITS = os.path.join(ROOT, "CREDITS.md")
API = os.environ.get("UNSPLASH_API", "https://api.unsplash.com")

KEY = os.environ.get("UNSPLASH_ACCESS_KEY", "").strip()
APP = os.environ.get("UNSPLASH_APP_NAME", "lab_asset_library").strip()
BUDGET = int(os.environ.get("MAX_REQUESTS", "45"))
UTM = "utm_source=%s&utm_medium=referral" % urllib.parse.quote(APP)
UA = "lab-asset-library/1.0"

used = 0
remaining = None


def load(path, default):
    try:
        with open(path) as f:
            return json.load(f)
    except FileNotFoundError:
        return default


def save(path, data):
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        json.dump(data, f, indent=1, ensure_ascii=False)
        f.write("\n")
    os.replace(tmp, path)


class OutOfBudget(Exception):
    pass


def api(path, params=None):
    global used, remaining
    if used >= BUDGET or (remaining is not None and remaining <= 1):
        raise OutOfBudget()
    url = path if path.startswith("http") else API + path
    if params:
        url += ("&" if "?" in url else "?") + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={
        "Authorization": "Client-ID " + KEY, "Accept-Version": "v1", "User-Agent": UA})
    used += 1
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            rem = r.headers.get("X-Ratelimit-Remaining")
            if rem is not None:
                remaining = int(rem)
            return json.load(r)
    except urllib.error.HTTPError as e:
        if e.code in (403, 429):
            print("rate limited (%s)" % e.code)
            raise OutOfBudget()
        raise


def fetch_file(url, dest):
    """Image CDN fetch: does not count toward the API rate limit."""
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=120) as r:
                data = r.read()
            with open(dest, "wb") as f:
                f.write(data)
            return len(data)
        except Exception as e:  # noqa: BLE001
            if attempt == 3:
                raise
            print("retry", url, e)
            time.sleep(3 * (attempt + 1))


def img(raw, **params):
    return raw + ("&" if "?" in raw else "?") + urllib.parse.urlencode(params)


def slim(p):
    u = p["user"]
    return {
        "id": p["id"], "width": p["width"], "height": p["height"], "color": p.get("color"),
        "blur_hash": p.get("blur_hash"), "likes": p.get("likes", 0),
        "alt": p.get("alt_description") or p.get("description") or "",
        "desc": p.get("description") or "",
        "raw": p["urls"]["raw"], "html": p["links"]["html"],
        "download_location": p["links"]["download_location"],
        "user": {"name": u.get("name") or u.get("username"), "username": u["username"],
                 "html": u["links"]["html"]},
        "tags": [t.get("title") for t in p.get("tags", []) if t.get("title")],
    }


def title(alt, cat_name):
    s = (alt or "").strip().rstrip(".")
    if not s:
        return cat_name
    s = s[0].upper() + s[1:]
    return s if len(s) <= 80 else s[:77].rsplit(" ", 1)[0] + "..."


def item_for(p, cat, web_bytes):
    w, h = p["width"], p["height"]
    orient = "landscape" if w > h * 1.05 else "portrait" if h > w * 1.05 else "square"
    words = set()
    for t in p["tags"] + cat["id"].split("-"):
        words.update(x for x in t.lower().replace(",", " ").split() if len(x) > 2)
    cid = "unsplash-" + p["id"]
    return {
        "id": cid, "kind": "photos", "type": "photos",
        "name": title(p["alt"], cat["name"]),
        "category": cat["id"], "categoryName": cat["name"],
        "tags": sorted(words | {"unsplash", "photo"}),
        "vibes": cat["vibes"], "style": "photographic", "pack": "Unsplash",
        "author": p["user"]["name"],
        "authorUrl": "%s?%s" % (p["user"]["html"], UTM),
        "license": "Unsplash License", "licenseUrl": "https://unsplash.com/license",
        "attribution": True,
        "credit": "Photo by %s on Unsplash" % p["user"]["name"],
        "origin": "%s?%s" % (p["html"], UTM),
        "sourceUrl": p["raw"],
        "originalUrl": img(p["raw"], fm="jpg", q=92),
        "file": "photos/%s/%s.webp" % (cat["id"], cid),
        "thumb": "photos/%s/thumbs/%s.webp" % (cat["id"], cid),
        "bytes": web_bytes, "resolution": 2048,
        "width": w, "height": h, "orientation": orient,
        "color": p["color"], "blurHash": p["blur_hash"],
        "unsplashId": p["id"],
    }


def write_outputs(state, cats):
    items = []
    for cat in cats["categories"]:
        for pid in state["selected"].get(cat["id"], []):
            it = state["items"].get(pid)
            if it:
                items.append(it)
    save(CATALOG, {"kind": "photos", "count": len(items), "items": items})
    # Plain list for the USB mirror script (curl only, no JSON parser needed).
    os.makedirs(os.path.join(ROOT, "photos"), exist_ok=True)
    with open(os.path.join(ROOT, "photos", "originals.tsv"), "w") as f:
        for it in items:
            f.write("%s\t%s\t%s\n" % (it["category"], it["id"], it["originalUrl"]))

    # catalog/index.json is left alone on purpose: the kit lists every kind there,
    # so Photos joins it when the kit has a /models/photos page.

    start, end = "<!-- unsplash-photos:start -->", "<!-- unsplash-photos:end -->"
    lines = [start, "## Unsplash photos (Unsplash License)", "",
             "%d photos from [Unsplash](https://unsplash.com/?%s), free to use under the "
             "[Unsplash License](https://unsplash.com/license) (commercial use allowed, no "
             "credit legally required; do not sell them unaltered or rebuild a competing "
             "photo service). Unsplash API guidelines ask us to credit the photographer and "
             "Unsplash wherever a photo is shown. People in photos have no model releases: "
             "fine for previews and creative work, check before using a recognisable face in "
             "an ad or endorsement." % (len(items), UTM), ""]
    for cat in cats["categories"]:
        sel = [state["items"][i] for i in state["selected"].get(cat["id"], []) if i in state["items"]]
        if not sel:
            continue
        lines += ["### %s" % cat["name"], ""]
        lines += ['- photos: "%s" by [%s](%s) on [Unsplash](%s), Unsplash License' %
                  (it["name"].replace('"', "'"), it["author"], it["authorUrl"], it["origin"])
                  for it in sel]
        lines.append("")
    lines.append(end)
    block = "\n".join(lines)
    text = open(CREDITS).read()
    if start in text:
        a = text.index(start)
        b = text.index(end) + len(end)
        text = text[:a] + block + text[b:]
    else:
        text = text.rstrip("\n") + "\n\n" + block + "\n"
    with open(CREDITS, "w") as f:
        f.write(text)
    return len(items)


def main():
    if not KEY:
        sys.exit("UNSPLASH_ACCESS_KEY is not set")
    cats = load(CATS, None)
    state = load(STATE, {"searched": {}, "candidates": {}, "selected": {}, "items": {}})
    per, minw = cats["perCategory"], cats["minWidth"]
    taken = {i for ids in state["selected"].values() for i in ids}
    try:
        # Phase 1: search each category, then pick the best photos.
        for cat in cats["categories"]:
            if cat["id"] in state["selected"]:
                continue
            done = state["searched"].setdefault(cat["id"], [])
            pool = state["candidates"].setdefault(cat["id"], {})
            for q in cat["queries"]:
                if q in done:
                    continue
                res = api("/search/photos", {"query": q, "per_page": 30,
                                             "content_filter": "high", "order_by": "relevant"})
                for p in res.get("results", []):
                    if p.get("premium") or p.get("plus"):
                        continue
                    pool.setdefault(p["id"], slim(p))
                done.append(q)
                save(STATE, state)
            good = [p for p in pool.values()
                    if max(p["width"], p["height"]) >= minw and p["id"] not in taken]
            good.sort(key=lambda p: p["likes"], reverse=True)
            pick = [p["id"] for p in good[:per]]
            taken.update(pick)
            state["selected"][cat["id"]] = pick
            save(STATE, state)
        # Phase 2: track the download (API rule) and fetch web + thumb copies.
        for cat in cats["categories"]:
            pool = state["candidates"][cat["id"]]
            for pid in state["selected"][cat["id"]]:
                if pid in state["items"]:
                    continue
                p = pool[pid]
                api(p["download_location"])
                cid = "unsplash-" + pid
                web = os.path.join(ROOT, "photos", cat["id"], cid + ".webp")
                thumb = os.path.join(ROOT, "photos", cat["id"], "thumbs", cid + ".webp")
                n = fetch_file(img(p["raw"], w=2048, fit="max", fm="webp", q=80), web)
                fetch_file(img(p["raw"], w=480, fit="max", fm="webp", q=70), thumb)
                state["items"][pid] = item_for(p, cat, n)
                save(STATE, state)
    except OutOfBudget:
        pass
    n = write_outputs(state, cats)
    save(STATE, state)
    want = sum(len(v) for v in state["selected"].values())
    allsel = len(state["selected"]) == len(cats["categories"])
    print("requests used %d, items %d of %d selected" % (used, n, want))
    if allsel and n == want:
        print("COMPLETE")


if __name__ == "__main__":
    main()
