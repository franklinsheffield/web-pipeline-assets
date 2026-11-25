# web-pipeline-assets

Optimised, free-licence 3D assets served to the web-pipeline-kit asset library (the /models pages).

- models/<group>/<id>.glb: 6471 glTF models (meshopt + WebP textures). Groups: things, places, characters.
- textures/<id>/<map>.webp: 520 PBR texture sets and planet maps (color, normal, roughness, ao, displacement, metalness).
- hdris/<id>/<id>_1k.hdr + <id>.jpg: 179 HDRIs (1K) with a tone-mapped JPG backdrop; star maps as WebP.
- effects/<id>.png: 448 particle sprites and horizontal sprite sheets (225 kit-made, CC0).
- catalog/: the same JSON catalogues the site uses (index.json, models.json, textures.json, hdris.json, effects.json).

The kit reads these through NEXT_PUBLIC_ASSETS_BASE=https://raw.githubusercontent.com/franklinsheffield/web-pipeline-assets/main
(raw.githubusercontent.com sends CORS headers, so the browser can load the files directly).

Full-resolution originals and sources live on the USB library (2027/Web Build Assets/3d-library/). Licences and required credits: CREDITS.md.

## Photos (Unsplash)

- photos/<category>/<id>.webp: high-res Unsplash photos, 2048 px long edge (WebP), with 480 px thumbs in photos/<category>/thumbs/. 12 categories x 20: neon portraits, black and white portraits, fashion, city at night, architecture, abstract colour, textures, landscapes, skies, water, retro tech, mockup scenes (scripts/unsplash/categories.json).
- catalog/photos.json: same item shape as the other catalogues, plus width, height, orientation, color, blurHash, credit and originalUrl.
- Built by .github/workflows/unsplash-photos.yml with the official Unsplash API (repo secret UNSPLASH_ACCESS_KEY). Demo keys allow 50 requests an hour, so it runs hourly in batches and turns its schedule off when done.
- Full-resolution originals: scripts/unsplash/mirror_originals.sh on the Mac copies them to the USB library (2027/Web Build Assets/photo-library/).
- Licence: Unsplash License. Credit "Photo by <name> on Unsplash" wherever a photo is shown (CREDITS.md lists every photo).
