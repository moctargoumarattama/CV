# Portfolio Premium Industrie 4.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the static portfolio into a premium Industrie 4.0, energy, and Africa tech presentation with at least 10 project slots.

**Architecture:** Keep the site as a simple static portfolio: `index.html` owns content and semantic structure, `style.css` owns the full visual system, and `script.js` owns small interactions. Add one local verification script to catch broken assets, malformed HTML, placeholder links, and missing project slots.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, Python 3.11 standard library for verification.

---

## File Structure

- Modify: `index.html` - rebuild sections, content, 10 project cards, corrected links and assets.
- Modify: `style.css` - replace template-like visual language with premium Africa Tech / Industrie 4.0 styling.
- Modify: `script.js` - keep robust vanilla interactions without missing external dependencies.
- Create: `scripts/verify_portfolio.py` - static verification for structure, links, project count, and fragile JS references.

### Task 1: Verification Harness

**Files:**
- Create: `scripts/verify_portfolio.py`

- [ ] **Step 1: Write the failing verification script**

```python
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
STYLE = ROOT / "style.css"
SCRIPT = ROOT / "script.js"
VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}

class PortfolioParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.errors = []
        self.project_cards = 0
        self.refs = []
        self.sections = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag not in VOID_TAGS:
            self.stack.append((tag, self.getpos()[0]))
        if tag == "section" and attrs.get("id"):
            self.sections.add(attrs["id"])
        if "project-card" in attrs.get("class", ""):
            self.project_cards += 1
        for attr in ("href", "src"):
            if attrs.get(attr):
                self.refs.append((self.getpos()[0], tag, attr, attrs[attr]))

    def handle_endtag(self, tag):
        if tag in VOID_TAGS:
            return
        line = self.getpos()[0]
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index][0] == tag:
                if index != len(self.stack) - 1:
                    unclosed = ", ".join(f"{name}@{start}" for name, start in self.stack[index + 1:])
                    self.errors.append(f"line {line}: closed </{tag}> before {unclosed}")
                    self.stack = self.stack[:index]
                else:
                    self.stack.pop()
                return
        self.errors.append(f"line {line}: closed unopened </{tag}>")


def is_external(ref):
    parsed = urlparse(ref)
    return bool(parsed.scheme) or ref.startswith(("#", "mailto:", "tel:", "data:"))


def main():
    html = INDEX.read_text(encoding="utf-8")
    css = STYLE.read_text(encoding="utf-8")
    js = SCRIPT.read_text(encoding="utf-8")

    parser = PortfolioParser()
    parser.feed(html)

    failures = []
    expected_sections = {"home", "about", "projects", "skills", "contact"}
    missing_sections = expected_sections - parser.sections
    if missing_sections:
        failures.append(f"Missing sections: {sorted(missing_sections)}")
    if parser.errors:
        failures.extend(parser.errors)
    if parser.stack:
        failures.append(f"Unclosed tags: {parser.stack[-5:]}")
    if parser.project_cards < 10:
        failures.append(f"Expected at least 10 project cards, found {parser.project_cards}")

    for line, tag, attr, ref in parser.refs:
        if ref == "#" or "tonusername" in ref or "tonprofil" in ref:
            failures.append(f"Placeholder link at line {line}: {ref}")
        if not is_external(ref):
            path = ROOT / ref.split("#", 1)[0].split("?", 1)[0]
            if not path.exists():
                failures.append(f"Missing local asset at line {line}: {ref}")

    required_copy = ["portfolio professionnel", "Industrie 4.0", "10 projets"]
    for phrase in required_copy:
        if phrase not in html:
            failures.append(f"Missing positioning phrase: {phrase}")

    required_css = ["--ink", "--energy", "--copper", "project-card"]
    for token in required_css:
        if token not in css:
            failures.append(f"Missing CSS token/style: {token}")

    forbidden_js = ["ScrollReveal(", "import ", "export default"]
    for token in forbidden_js:
        if token in js:
            failures.append(f"Fragile JS dependency still present: {token}")

    if failures:
        print("Portfolio verification failed:")
        for failure in failures:
            print(f"- {failure}")
        raise SystemExit(1)

    print("Portfolio verification passed")

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run verification to confirm it fails**

Run: `python scripts\verify_portfolio.py`
Expected: FAIL because the current site has 3 project cards, malformed HTML, placeholder links, and missing local assets.

### Task 2: Rebuild Portfolio Content

**Files:**
- Modify: `index.html`

- [ ] Replace the existing body with semantic sections: nav, hero, about, timeline, 10-card projects, skills, contact, footer.
- [ ] Use existing local images only: `assets/images/photo.jpg`, `assets/images/projet-arduino.jpg`, `assets/images/projet-mcb.jpg`, `assets/images/projet-energy.jpg`.
- [ ] Link CV download to `cv_moctar_goumar_attama_v2.pdf`.
- [ ] Avoid temporary external profile links that are not known.

### Task 3: Rebuild Premium Styling

**Files:**
- Modify: `style.css`

- [ ] Replace the old template CSS with a premium visual system using `--ink`, `--energy`, `--copper`, `--sand`, and `--paper`.
- [ ] Add responsive layouts for hero, cards, project grid, timeline, skills, and contact.
- [ ] Keep motion subtle and meaningful with CSS-only reveal transitions.

### Task 4: Simplify Interactions

**Files:**
- Modify: `script.js`

- [ ] Remove dependency on absent `ScrollReveal` and module-based blog/i18n behavior.
- [ ] Keep hamburger navigation, theme toggle, project filters, smooth scrolling, form feedback, current year, and reveal-on-scroll.
- [ ] Guard DOM lookups so missing elements do not crash the page.

### Task 5: Verify

**Files:**
- Test: `scripts/verify_portfolio.py`

- [ ] Run `python scripts\verify_portfolio.py`.
- [ ] Confirm output is `Portfolio verification passed`.
- [ ] Manually inspect changed files for content consistency and accidental mojibake.


