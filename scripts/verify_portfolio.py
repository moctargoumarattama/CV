import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
STYLE = ROOT / "style.css"
SCRIPT = ROOT / "script.js"
VOID_TAGS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
}


class PortfolioParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.errors = []
        self.project_cards = 0
        self.refs = []
        self.sections = set()
        self.project_images = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag not in VOID_TAGS:
            self.stack.append((tag, self.getpos()[0]))
        if tag == "section" and attrs.get("id"):
            self.sections.add(attrs["id"])
        if "project-card" in attrs.get("class", ""):
            self.project_cards += 1
        if tag == "img" and "projet-" in attrs.get("src", ""):
            self.project_images.append((self.getpos()[0], attrs))
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
                    unclosed = ", ".join(
                        f"{name}@{start}" for name, start in self.stack[index + 1:]
                    )
                    self.errors.append(f"line {line}: closed </{tag}> before {unclosed}")
                    self.stack = self.stack[:index]
                else:
                    self.stack.pop()
                return
        self.errors.append(f"line {line}: closed unopened </{tag}>")


def is_external(ref):
    parsed = urlparse(ref)
    return bool(parsed.scheme) or ref.startswith(("#", "mailto:", "tel:", "data:"))


def clamp_max_rem(css, selector):
    pattern = rf"{re.escape(selector)}\s*\{{[^}}]*font-size:\s*clamp\([^,]+,[^,]+,\s*([0-9.]+)rem\)"
    match = re.search(pattern, css, flags=re.MULTILINE)
    if not match:
        return None
    return float(match.group(1))


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

    for line, _tag, _attr, ref in parser.refs:
        if ref == "#" or "tonusername" in ref or "tonprofil" in ref:
            failures.append(f"Placeholder link at line {line}: {ref}")
        if not is_external(ref):
            path = ROOT / ref.split("#", 1)[0].split("?", 1)[0]
            if not path.exists():
                failures.append(f"Missing local asset at line {line}: {ref}")

    required_copy = ["Portfolio professionnel", "Industrie 4.0", "10 projets"]
    for phrase in required_copy:
        if phrase not in html:
            failures.append(f"Missing positioning phrase: {phrase}")

    required_cycle_copy = [
        "Formation en cours depuis 2022",
        "4e annee terminee",
        "diplome prevu en 2027",
    ]
    for phrase in required_cycle_copy:
        if phrase not in html:
            failures.append(f"Missing engineering cycle detail: {phrase}")

    sogea_index = html.find("Stage Sogea-Satom")
    if sogea_index == -1:
        failures.append("Missing timeline entry: Stage Sogea-Satom")

    timeline_date_labels = re.findall(r'<span class="timeline-date">([^<]+)</span>', html)
    timeline_dates = [int(re.search(r"\d{4}", label).group(0)) for label in timeline_date_labels]
    if timeline_dates != sorted(timeline_dates):
        failures.append(f"Timeline must be ordered from oldest to newest: {timeline_dates}")
    long_date_labels = [label for label in timeline_date_labels if len(label.strip()) > 12]
    if long_date_labels:
        failures.append(f"Timeline date labels must stay compact: {long_date_labels}")

    forbidden_copy = [
        "Afrique" + " Tech",
        "personnel",
        "industrie africaine",
        "ta progression",
        "ton prochain",
        "Mon prochain prototype documente",
        "Je garde cet espace",
        "boite a outils",
        "Parlons-en",
        "Une vitrine orientee preuves",
        "carte volontairement reservee",
        "La grille est prete",
        "emplacements pour montrer",
    ]
    for phrase in forbidden_copy:
        if phrase in html:
            failures.append(f"Copy sounds impersonal or AI-generated: {phrase}")

    required_css = ["--ink", "--energy", "--copper", "project-card"]
    for token in required_css:
        if token not in css:
            failures.append(f"Missing CSS token/style: {token}")

    h1_max = clamp_max_rem(css, "h1")
    if h1_max is None or h1_max > 4.8:
        failures.append(f"Hero h1 max font size is too large: {h1_max}rem")

    h2_max = clamp_max_rem(css, "h2")
    if h2_max is None or h2_max > 3.4:
        failures.append(f"Section h2 max font size is too large: {h2_max}rem")

    if css.count("backdrop-filter") > 1:
        failures.append("Too many backdrop-filter effects for smooth scrolling")

    for selector in ("body::before", "body::after"):
        pattern = rf"{re.escape(selector)}\s*\{{[^}}]*position:\s*fixed"
        if re.search(pattern, css, flags=re.MULTILINE):
            failures.append(f"{selector} uses position fixed, which is expensive while scrolling")

    if "animation: spin" in css:
        failures.append("Continuous orbit animation should not run during normal scrolling")

    for line, attrs in parser.project_images:
        if attrs.get("loading") != "lazy" or attrs.get("decoding") != "async":
            failures.append(f"Project image at line {line} needs loading=\"lazy\" and decoding=\"async\"")

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
