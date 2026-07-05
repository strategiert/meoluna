#import "_shared.typ": *

#let data = json(sys.inputs.data)

#show: base-page.with(footer-url: data.footerUrl)

#doc-header(
  kind: "Hausaufgabe",
  topic-name: data.topicName,
  fach-display: data.fachDisplay,
  klasse: data.klasse,
)

#for (i, a) in data.aufgaben.enumerate() {
  task(nr: i + 1, frage: a.frage, punkte: none, lines: write-lines-for(a.schwierigkeit))
}

#v(0.6cm)
#align(center)[
  #text(style: "italic", fill: meoluna-blue)[Super gemacht! Weiter so -- du schaffst das! 🌙]
]

#solutions-page(aufgaben: data.aufgaben)
