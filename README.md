# vandenakker.tech

Static website of Ramon van den Akker (RvdA AI & Data Science Consultancy), served with GitHub Pages
on the custom domain `vandenakker.tech` (see `CNAME`). No build step, except regenerating the Dutch page: edit `index.html`, run
`python3 tools/build_nl.py`, push to `main`.

```
index.html            English homepage (source of truth)
nl/index.html         Dutch homepage, GENERATED: run `python3 tools/build_nl.py` after editing index.html
research/index.html   Research page (papers)
tools/build_nl.py     English to Dutch string table; stops if an English string has no translation
assets/style.css      layout and colours (light and dark)
assets/bandit.js      hero animation: policy map of contextual Thompson sampling (2-D context, quadratic features) + cumulative regret (no libraries)
assets/services.js    animated Services visuals (forecast fan + plan, causal graph, causal ML); assets/services.css
assets/fonts/         Inter, subset to Latin, woff2 (SIL Open Font License, see OFL.txt)
assets/photo.jpg, assets/og-image.png (1200x630 share image), assets/apple-touch-icon.png
favicon.svg, robots.txt, sitemap.xml, CNAME
```

Preview locally: `python3 -m http.server` and open http://localhost:8000.

## Going live (once)

1. Settings → Pages: deploy from branch `main`, folder `/`; custom domain `vandenakker.tech`; enforce HTTPS.
2. At Hostnet DNS for `vandenakker.tech`: point the apex `A` records to GitHub Pages
   (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153) and `www` as `CNAME` to
   `ramonvdakker.github.io`. Leave the `MX` and other mail records untouched, so e-mail keeps working.
