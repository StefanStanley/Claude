"""Versand des Massnahmenberichts per Microsoft Graph oder SMTP.

Standard ist `versandart="aus"`: der Bericht wird nur im Notebook angezeigt.
Erst wenn der Lauf bewusst mit dry_run=False und einer Versandart konfiguriert
wird, verlaesst eine Mail das System.
"""

from __future__ import annotations

import base64
import logging
import smtplib
from email.message import EmailMessage

import requests

from .konfiguration import MailKonfig, SharePointKonfig
from .sharepoint import GRAPH, ZEITLIMIT, hole_token

LOG = logging.getLogger(__name__)


class MailFehler(RuntimeError):
    pass


def _anhang_bytes(csv_text: str) -> bytes:
    # BOM, damit Excel die Umlaute korrekt anzeigt.
    return ("﻿" + csv_text).encode("utf-8")


def sende_via_smtp(konfig: MailKonfig, betreff: str, html: str, csv_text: str = "") -> None:
    nachricht = EmailMessage()
    nachricht["Subject"] = betreff
    nachricht["From"] = konfig.absender or konfig.smtp_benutzer
    nachricht["To"] = ", ".join(konfig.empfaenger)
    nachricht.set_content(
        "Dieser Bericht benoetigt einen HTML-faehigen Mailclient. "
        "Die Aufgabenliste liegt zusaetzlich als CSV-Anhang bei."
    )
    nachricht.add_alternative(html, subtype="html")
    if csv_text:
        nachricht.add_attachment(
            _anhang_bytes(csv_text),
            maintype="text",
            subtype="csv",
            filename="vde_massnahmen.csv",
        )

    with smtplib.SMTP(konfig.smtp_host, konfig.smtp_port, timeout=ZEITLIMIT) as server:
        server.ehlo()
        if konfig.smtp_port != 25:
            server.starttls()
            server.ehlo()
        if konfig.smtp_benutzer:
            server.login(konfig.smtp_benutzer, konfig.smtp_passwort)
        server.send_message(nachricht)
    LOG.info("Mail per SMTP an %s versendet", konfig.empfaenger)


def sende_via_graph(
    mail_konfig: MailKonfig,
    sp_konfig: SharePointKonfig,
    betreff: str,
    html: str,
    csv_text: str = "",
) -> None:
    """Versand ueber die bereits vorhandene App-Registrierung (Berechtigung Mail.Send)."""
    if not mail_konfig.absender:
        raise MailFehler("Fuer den Graph-Versand muss ein Absender-Postfach gesetzt sein.")

    token = hole_token(sp_konfig)
    nachricht: dict = {
        "message": {
            "subject": betreff,
            "body": {"contentType": "HTML", "content": html},
            "toRecipients": [{"emailAddress": {"address": e}} for e in mail_konfig.empfaenger],
        },
        "saveToSentItems": True,
    }
    if csv_text:
        nachricht["message"]["attachments"] = [
            {
                "@odata.type": "#microsoft.graph.fileAttachment",
                "name": "vde_massnahmen.csv",
                "contentType": "text/csv",
                "contentBytes": base64.b64encode(_anhang_bytes(csv_text)).decode("ascii"),
            }
        ]

    antwort = requests.post(
        f"{GRAPH}/users/{mail_konfig.absender}/sendMail",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json=nachricht,
        timeout=ZEITLIMIT,
    )
    if antwort.status_code not in (202, 200):
        raise MailFehler(
            f"Mailversand fehlgeschlagen (HTTP {antwort.status_code}): {antwort.text[:400]}"
        )
    LOG.info("Mail per Graph an %s versendet", mail_konfig.empfaenger)


def versende(
    mail_konfig: MailKonfig,
    sp_konfig: SharePointKonfig | None,
    betreff: str,
    html: str,
    csv_text: str = "",
    dry_run: bool = True,
    hat_aufgaben: bool = True,
) -> str:
    """Zentrale Versandentscheidung. Gibt zurueck, was tatsaechlich passiert ist."""
    if not mail_konfig.aktiv:
        return "Kein Versand konfiguriert (versandart='aus' oder keine Empfaenger)."
    if mail_konfig.nur_bei_aufgaben and not hat_aufgaben:
        return "Keine offenen Aufgaben - Mail bewusst nicht versendet."
    if dry_run:
        return f"TESTLAUF: Mail waere an {', '.join(mail_konfig.empfaenger)} gegangen."

    if mail_konfig.versandart == "graph":
        if sp_konfig is None:
            raise MailFehler("Graph-Versand benoetigt die SharePoint-App-Registrierung.")
        sende_via_graph(mail_konfig, sp_konfig, betreff, html, csv_text)
    else:
        sende_via_smtp(mail_konfig, betreff, html, csv_text)
    return f"Mail versendet an {', '.join(mail_konfig.empfaenger)}."
