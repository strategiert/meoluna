#import "_shared.typ": *

#let data = json(sys.inputs.data)

#show: base-page.with(footer-url: data.footerUrl)

#doc-header(
  kind: "Klassenarbeit",
  topic-name: data.topicName,
  fach-display: data.fachDisplay,
  klasse: data.klasse,
  arbeitszeit: data.arbeitszeitMinuten,
)

#for (i, a) in data.aufgaben.enumerate() {
  task(nr: i + 1, frage: a.frage, punkte: a.punkte, lines: write-lines-for(a.schwierigkeit))
}

#v(0.6cm)
#text(weight: "bold")[Gesamtpunkte: #data.gesamtpunkte]
#v(0.2cm)
#text[Erreichte Punkte: \_\_\_\_\_\_\_\_ / #data.gesamtpunkte]

#notenschluessel-table(gesamtpunkte: data.gesamtpunkte, schluessel: data.notenschluessel)

#solutions-page(aufgaben: data.aufgaben)
