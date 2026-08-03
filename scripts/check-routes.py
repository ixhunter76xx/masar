"""يتحقّق أن كل مسار ثابت في الكود يقابله صفحة موجودة.

لا يبحث عن كلمات محذوفة — يجمع كل مسار مكتوب ويسأل نظام الملفات عنه.
هكذا يلتقط ما لم يخطر ببالنا، لا ما نتذكّره.
"""
import pathlib, re, sys

base = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "src")
app = base / "app"

PATTERNS = [
    (r'href=["`](/[^"`${}\s]*)["`]', "href"),
    (r'\bredirect\(\s*["`](/[^"`${}\s]*)["`]', "redirect"),
    (r'router\.(?:push|replace)\(\s*["`](/[^"`${}\s]*)["`]', "router"),
    (r'\brevalidatePath\(\s*["`](/[^"`${}\s]*)["`]', "revalidatePath"),
    (r'redirectTo:\s*["`](/[^"`${}\s]*)["`]', "redirectTo"),
    (r'\bnew URL\(\s*["`](/[^"`${}\s]*)["`]', "newURL"),
]

def strip_comments(text: str) -> str:
    """يحذف التعليقات: مسار مذكور في شرح ليس رابطًا معلَّقًا."""
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
    return re.sub(r'^\s*//.*$', '', text, flags=re.M)

found: dict[str, list] = {}
for p in list(base.rglob("*.ts")) + list(base.rglob("*.tsx")):
    text = strip_comments(p.read_text(encoding="utf-8"))
    for rx, kind in PATTERNS:
        for m in re.finditer(rx, text):
            route = m.group(1).split("?")[0].split("#")[0]
            found.setdefault(route, []).append((str(p).split("/src/")[-1], kind))

def resolves(route: str) -> bool:
    if route == "/":
        return (app / "page.tsx").exists()
    seg = route.strip("/").split("/")
    for group in ["", "(app)", "(auth)"]:
        root = app / group if group else app
        node = root
        ok = True
        for s in seg:
            if (node / s).is_dir():
                node = node / s
            else:
                dyn = [c for c in node.iterdir() if c.is_dir() and c.name.startswith("[")] if node.is_dir() else []
                if dyn: node = dyn[0]
                else: ok = False; break
        if ok and ((node / "page.tsx").exists() or (node / "route.ts").exists()):
            return True
    return False

broken = {r: v for r, v in found.items() if not resolves(r)}
print(f"  مسارات ثابتة مفحوصة: {len(found)}")
if broken:
    for route, refs in sorted(broken.items()):
        print(f"  ✗ {route}")
        for f, kind in refs: print(f"      {kind:14s} {f}")
    sys.exit(1)
print("  كل مسار ثابت يقابله صفحة موجودة ✓")
