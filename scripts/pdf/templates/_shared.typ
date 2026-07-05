// Gemeinsame Bausteine für alle Meoluna-Arbeitsblatt-PDFs.
// Wird per #import "_shared.typ": * in klassenarbeit.typ / lernzielkontrolle.typ / hausaufgabe.typ eingebunden.

#let meoluna-blue = rgb("#4b3f8f")

#let base-page(footer-url: "", body) = {
  set page(
    paper: "a4",
    margin: (top: 2.4cm, bottom: 2.2cm, left: 2.2cm, right: 2.2cm),
    footer: context [
      #set text(size: 8pt, fill: gray)
      #line(length: 100%, stroke: 0.4pt + gray)
      #v(0.15cm)
      #footer-url #h(1fr) Seite #counter(page).display() von #counter(page).final().at(0)
    ],
  )
  set text(font: ("Calibri", "Arial", "Verdana"), size: 11pt, lang: "de")
  set par(leading: 0.75em)
  body
}

#let doc-header(kind: "", topic-name: "", fach-display: "", klasse: 0, arbeitszeit: none) = {
  grid(
    columns: (1fr, auto),
    align: (left, right),
    [
      #text(size: 20pt, weight: "bold", fill: meoluna-blue)[#topic-name]
      #v(0.05cm)
      #text(size: 12pt)[#fach-display -- Klasse #klasse -- #kind]
    ],
    [
      #text(size: 10pt, fill: gray)[meoluna.com]
    ],
  )
  v(0.4cm)
  text[Name: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ #h(1.2cm) Datum: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_]
  if arbeitszeit != none {
    v(0.2cm)
    text(size: 10pt, weight: "bold")[Arbeitszeit: #arbeitszeit Minuten]
  }
  v(0.5cm)
  line(length: 100%, stroke: 0.6pt + meoluna-blue)
  v(0.4cm)
}

#let write-lines-for(schwierigkeit) = {
  if schwierigkeit == 1 { 1 } else if schwierigkeit == 2 { 2 } else { 3 }
}

#let task(nr: 0, frage: "", punkte: none, lines: 2) = {
  block(above: 0.5cm, below: 0.15cm, breakable: false)[
    #grid(
      columns: (1fr, 2.2cm),
      gutter: 0.3cm,
      [#text(weight: "bold")[#nr.] #frage],
      align(right)[
        #if punkte != none [
          #box(stroke: 0.5pt + gray, inset: 4pt, radius: 2pt)[#punkte P.]
        ]
      ],
    )
    #for _ in range(lines) {
      v(0.55cm)
      line(length: 100%, stroke: 0.4pt + gray)
    }
  ]
}

#let checkliste-item(text-content: "") = {
  block(above: 0.35cm, below: 0.35cm, breakable: false)[
    #grid(
      columns: (1fr, auto),
      gutter: 0.4cm,
      [#text-content],
      [☐ sicher #h(0.35cm) ☐ fast #h(0.35cm) ☐ übe noch],
    )
    #v(0.15cm)
    #line(length: 100%, stroke: 0.3pt + gray)
  ]
}

#let notenschluessel-table(gesamtpunkte: 0, schluessel: ()) = {
  v(0.5cm)
  text(weight: "bold", size: 12pt)[Notenschlüssel]
  v(0.1cm)
  text(size: 9pt, fill: gray)[bei #gesamtpunkte Punkten gesamt, gerundet auf halbe Punkte]
  v(0.2cm)
  table(
    columns: 6,
    stroke: 0.5pt + gray,
    align: center + horizon,
    inset: 6pt,
    ..schluessel.map(s => text(weight: "bold")[Note #s.note]),
    ..schluessel.map(s => [ab #s.minPunkte P.]),
  )
}

#let solutions-page(title: "Lösungen — für Lehrkräfte/Eltern", aufgaben: ()) = {
  pagebreak()
  text(size: 16pt, weight: "bold", fill: meoluna-blue)[#title]
  v(0.5cm)
  for (i, a) in aufgaben.enumerate() {
    block(above: 0.3cm, below: 0.3cm, breakable: false)[
      #text(fill: gray)[#(i + 1).] #text(style: "italic")[#a.frage]
      #v(0.1cm)
      #text(weight: "bold")[→ #a.loesung]
    ]
  }
}
