#import "_shared.typ": *

#let data = json(sys.inputs.data)

#show: base-page.with(footer-url: data.footerUrl)

#doc-header(
  kind: "Lernzielkontrolle",
  topic-name: data.topicName,
  fach-display: data.fachDisplay,
  klasse: data.klasse,
)

#text(size: 14pt, weight: "bold", fill: meoluna-blue)[Kann ich das?]
#v(0.3cm)
#for ziel in data.lernziele {
  checkliste-item(text-content: ziel)
}

#v(0.6cm)
#text(size: 14pt, weight: "bold", fill: meoluna-blue)[Aufgaben]
#v(0.3cm)
#for (i, a) in data.aufgaben.enumerate() {
  task(nr: i + 1, frage: a.frage, punkte: none, lines: write-lines-for(a.schwierigkeit))
}

#solutions-page(aufgaben: data.aufgaben)
