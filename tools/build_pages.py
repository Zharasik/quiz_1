"""Practice pages generator: python3 tools/build_pages.py
Each page = shared engine (engine/practice.css + engine/practice.js) + its own COURSE data (tools/courses/*.json)."""
import json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = "3"
TPL = """<!DOCTYPE html>
<html lang="kk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0F1115">
<title>{title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@600;800&family=Inter:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="../engine/practice.css?v={v}">
</head>
<body>
<div id="net" class="net"><i></i><span>Қосылуда…</span></div>
<div id="app"></div>
<canvas id="cf" class="hidden"></canvas>
<script src="../mqtt.min.js"></script>
<script src="../jszip.min.js"></script>
<script src="../qrcode.min.js?v={v}"></script>
<script>
const COURSE = {course};
</script>
<script src="../engine/practice.js?v={v}"></script>
</body>
</html>
"""
def build(name):
    src = os.path.join(ROOT, "tools", "courses", name + ".json")
    c = json.load(open(src, encoding="utf-8"))
    title = c.pop("_pageTitle", c.get("title", name))
    html = TPL.format(title=title, v=V, course=json.dumps(c, ensure_ascii=False))
    os.makedirs(os.path.join(ROOT, name), exist_ok=True)
    open(os.path.join(ROOT, name, "index.html"), "w", encoding="utf-8").write(html)
    # check that every example image exists
    miss = [b["ex"] for b in c.get("bank", []) if b.get("ex") and not b["ex"].startswith("http") and not os.path.exists(os.path.join(ROOT, name, "ex", b["ex"] + ".jpg"))]
    print(name, "ok", "missing ex: " + ", ".join(miss) if miss else "")
if __name__ == "__main__":
    names = sys.argv[1:] or [f[:-5] for f in sorted(os.listdir(os.path.join(ROOT, "tools", "courses"))) if f.endswith(".json")]
    for n in names: build(n)
