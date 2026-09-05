#!/usr/bin/env python3
"""Erzeugt die Markdown-Referenz unter epilot/api-referenz/ aus den OpenAPI-Specs des epilot SDK.

Quelle: https://github.com/epilot-dev/sdk-js  (clients/*/src/openapi.json)

    git clone --depth 1 https://github.com/epilot-dev/sdk-js /tmp/sdk-js
    python3 epilot/api-referenz/tools/generate_docs.py /tmp/sdk-js
"""

import json
import os
import re
import sys
from datetime import date

METHODS = ("get", "post", "put", "patch", "delete", "head", "options")

# Fachliche Gruppierung der APIs. Schluessel = Slug (Client-Ordner ohne "-client").
GROUPS = [
    (
        "Daten & Modell",
        "Das Fundament: Entities sind das flexible Datenmodell von epilot. Alles andere haengt daran.",
        ["entity", "query", "entity-mapping", "deduplication", "data-governance",
         "validation-rules", "snapshot", "blueprint-manifest", "environments",
         "sandbox", "configuration-hub"],
    ),
    (
        "Vertrieb & Kundenschnittstelle",
        "Journeys (Online-Strecken), Preise, Angebote und das Kundenportal.",
        ["journey", "submission", "pricing", "pricing-tier", "targeting",
         "customer-portal", "design", "sharing", "partner-directory"],
    ),
    (
        "Prozesse & Automatisierung",
        "Workflows, Automationen und die Arbeitsoberflaeche der Sachbearbeitung.",
        ["workflow-definition", "workflow", "automation", "kanban", "calendar",
         "notes", "dashboard", "ai-agents"],
    ),
    (
        "Kommunikation & Dokumente",
        "E-Mail, Nachrichten, Vorlagen und Dateiablage.",
        ["message", "email-settings", "email-template", "template-variables",
         "notification", "document", "file"],
    ),
    (
        "Abrechnung & Messwesen",
        "Billing und Zaehlerdaten.",
        ["billing", "metering"],
    ),
    (
        "Plattform, Integration & Zugriff",
        "Apps, Webhooks, Events, Tokens, Nutzer und Rechte.",
        ["app", "integration-toolkit", "webhooks", "event-catalog", "access-token",
         "user", "organization", "permissions", "audit-logs", "consent", "purpose"],
    ),
    (
        "Hilfsdienste",
        "Kleine Nachschlage-APIs.",
        ["address", "address-suggestions", "iban"],
    ),
]

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")


def camel(slug):
    head, *rest = slug.split("-")
    return head + "".join(w.capitalize() for w in rest)


def spec_url(pkg):
    """Spec-URL aus dem npm-Script "openapi" des Clients lesen."""
    script = pkg.get("scripts", {}).get("openapi", "")
    m = re.search(r"(https://\S+\.yaml)", script)
    return m.group(1) if m else None


def op_summary(op):
    """Kurzbeschreibung einer Operation.

    Viele epilot-Specs setzen summary == operationId; in dem Fall ist der erste
    Satz der description die einzige echte Information.
    """
    oid = op.get("operationId", "")
    summary = (op.get("summary") or "").strip()
    if summary and summary != oid:
        return " ".join(summary.split())
    text = op.get("description") or ""
    for line in text.strip().splitlines():
        line = line.strip().lstrip("#").strip()
        if not line or line.startswith(("<!--", "|", "```", ":::")):
            continue
        line = re.sub(r"\s+", " ", line)
        sentence = re.split(r"(?<=[.!?])\s", line)[0].strip()
        if len(sentence) > 160:
            sentence = sentence[:157].rstrip() + "…"
        return sentence
    return ""


def load(sdk_root):
    clients_dir = os.path.join(sdk_root, "clients")
    apis = {}
    for name in sorted(os.listdir(clients_dir)):
        spec_path = os.path.join(clients_dir, name, "src", "openapi.json")
        pkg_path = os.path.join(clients_dir, name, "package.json")
        if not os.path.isfile(spec_path):
            continue
        slug = name[: -len("-client")] if name.endswith("-client") else name
        with open(spec_path) as f:
            spec = json.load(f)
        pkg = json.load(open(pkg_path)) if os.path.isfile(pkg_path) else {}
        ops = []
        for path, item in spec.get("paths", {}).items():
            shared = item.get("parameters", [])
            for method, op in item.items():
                if method.lower() not in METHODS or not isinstance(op, dict):
                    continue
                ops.append({
                    "method": method.upper(),
                    "path": path,
                    "id": op.get("operationId", ""),
                    "summary": op_summary(op),
                    "tags": op.get("tags") or ["Allgemein"],
                    "deprecated": bool(op.get("deprecated")),
                    "params": len(shared) + len(op.get("parameters", [])),
                })
        apis[slug] = {
            "slug": slug,
            "client": name,
            "spec": spec,
            "pkg_name": pkg.get("name", ""),
            "pkg_version": pkg.get("version", ""),
            "spec_url": spec_url(pkg),
            "ops": ops,
        }
    return apis


def md_escape(text):
    return (text or "").replace("|", "\\|").replace("\n", " ").strip()


def first_paragraph(text):
    if not text:
        return ""
    for para in text.strip().split("\n\n"):
        para = para.strip()
        if para:
            return " ".join(para.split())
    return ""


def render_api(api):
    spec = api["spec"]
    info = spec.get("info", {})
    title = info.get("title", api["slug"])
    servers = [s.get("url", "") for s in spec.get("servers", []) if s.get("url")]
    servers = list(dict.fromkeys(servers))
    schemes = spec.get("components", {}).get("securitySchemes", {})
    tag_desc = {t.get("name"): t.get("description", "") for t in spec.get("tags", [])}

    L = [f"# {title}", ""]
    L.append(f"> Slug `{api['slug']}` · OpenAPI-Version `{info.get('version', '?')}` · "
             f"{len(api['ops'])} Operationen")
    L.append("")
    if info.get("description"):
        L.append(info["description"].strip())
        L.append("")

    L.append("## Zugriff")
    L.append("")
    L.append("| | |")
    L.append("| --- | --- |")
    L.append(f"| Base URL | {' <br> '.join('`%s`' % s for s in servers) if servers else '– (nicht in der Spec hinterlegt)'} |")
    if api["spec_url"]:
        L.append(f"| OpenAPI-Spec | {api['spec_url']} |")
    L.append(f"| Docs | https://docs.epilot.io/api/{api['slug']} |")
    if api["pkg_name"]:
        L.append(f"| SDK | `epilot.{camel(api['slug'])}` aus `@epilot/sdk/{api['slug']}` (Einzelpaket: `{api['pkg_name']}`) |")
    L.append("")

    if schemes:
        L.append("**Security Schemes:** " + ", ".join(
            f"`{name}` ({s.get('type')}"
            + (f"/{s.get('scheme')}" if s.get("scheme") else "")
            + (f", Header `{s.get('name')}`" if s.get("in") == "header" else "")
            + ")"
            for name, s in schemes.items()
        ))
        L.append("")

    by_tag = {}
    for op in api["ops"]:
        by_tag.setdefault(op["tags"][0], []).append(op)

    order = [t.get("name") for t in spec.get("tags", []) if t.get("name") in by_tag]
    order += [t for t in sorted(by_tag) if t not in order]

    L.append("## Endpunkte")
    L.append("")
    for tag in order:
        L.append(f"### {tag}")
        if tag_desc.get(tag):
            L.append("")
            L.append(f"_{first_paragraph(tag_desc[tag])}_")
        L.append("")
        L.append("| Methode | Pfad | Operation | Beschreibung |")
        L.append("| --- | --- | --- | --- |")
        for op in sorted(by_tag[tag], key=lambda o: (o["path"], o["method"])):
            summary = md_escape(op["summary"]) or "–"
            if op["deprecated"]:
                summary = "**deprecated** · " + summary
            L.append(f"| `{op['method']}` | `{md_escape(op['path'])}` | `{op['id']}` | {summary} |")
        L.append("")

    L.append("---")
    L.append("")
    L.append(f"_Generiert aus der OpenAPI-Spec von `{api['client']}` "
             f"(@epilot Client {api['pkg_version']}). Nicht von Hand bearbeiten._")
    return "\n".join(L) + "\n"


def render_index(apis):
    total_ops = sum(len(a["ops"]) for a in apis.values())
    L = [
        "# epilot API – Überblick",
        "",
        f"Referenz zu **{len(apis)} epilot-APIs** mit zusammen **{total_ops} Operationen**, "
        "erzeugt aus den offiziellen OpenAPI-Specs.",
        "",
        "Offizielle Doku: https://docs.epilot.io/api · Specs: https://docs.api.epilot.io/ · "
        "SDK: https://github.com/epilot-dev/sdk-js",
        "",
        "## Wie epilot aufgebaut ist",
        "",
        "epilot ist kein Monolith mit einer API, sondern eine Sammlung eigenständiger Services. "
        "Jeder hat eine eigene Base URL nach dem Muster `https://<service>.sls.epilot.io` und eine "
        "eigene OpenAPI-Spec. Authentifizierung, Fehlerformat und Org-Kontext sind über alle Services "
        "hinweg identisch – siehe [Authentifizierung](./authentifizierung.md).",
        "",
        "Der Einstieg ist fast immer die **Entity API**: Kontakte, Aufträge, Produkte, Verträge – alles "
        "ist eine Entity mit einem konfigurierbaren Schema. Die anderen Services referenzieren Entities "
        "über `entity_id` und `slug`.",
        "",
        "## APIs nach Domäne",
        "",
    ]
    for group, note, slugs in GROUPS:
        L.append(f"### {group}")
        L.append("")
        L.append(note)
        L.append("")
        L.append("| API | Ops | Base URL | Zweck |")
        L.append("| --- | --- | --- | --- |")
        for slug in slugs:
            api = apis[slug]
            info = api["spec"].get("info", {})
            servers = [s.get("url", "") for s in api["spec"].get("servers", []) if s.get("url")]
            base = f"`{servers[0]}`" if servers else "–"
            purpose = md_escape(first_paragraph(info.get("description", "")))
            if len(purpose) > 130:
                purpose = purpose[:127].rstrip() + "…"
            L.append(f"| [{info.get('title', slug)}](./apis/{slug}.md) | {len(api['ops'])} | "
                     f"{base} | {purpose or '–'} |")
        L.append("")

    L.append("## Diese Referenz aktualisieren")
    L.append("")
    L.append("```bash")
    L.append("git clone --depth 1 https://github.com/epilot-dev/sdk-js /tmp/sdk-js")
    L.append("python3 epilot/api-referenz/tools/generate_docs.py /tmp/sdk-js")
    L.append("```")
    L.append("")
    L.append(f"_Stand: {date.today().isoformat()} · generiert, nicht von Hand gepflegt._")
    return "\n".join(L) + "\n"


def main():
    if len(sys.argv) != 2:
        sys.exit("usage: generate_docs.py <pfad-zum-sdk-js-clone>")
    apis = load(sys.argv[1])

    grouped = {s for _, _, slugs in GROUPS for s in slugs}
    missing = grouped - set(apis)
    ungrouped = set(apis) - grouped
    if missing:
        sys.exit(f"Slugs in GROUPS ohne Spec: {sorted(missing)}")
    if ungrouped:
        sys.exit(f"Neue APIs ohne Gruppe – GROUPS ergaenzen: {sorted(ungrouped)}")

    os.makedirs(os.path.join(OUT_DIR, "apis"), exist_ok=True)
    for slug, api in apis.items():
        with open(os.path.join(OUT_DIR, "apis", f"{slug}.md"), "w") as f:
            f.write(render_api(api))
    with open(os.path.join(OUT_DIR, "README.md"), "w") as f:
        f.write(render_index(apis))
    print(f"{len(apis)} API-Seiten + Index geschrieben nach {os.path.realpath(OUT_DIR)}")


if __name__ == "__main__":
    main()
