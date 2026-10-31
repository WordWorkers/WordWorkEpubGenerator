# Word Work EPUB

Gör en e-bok (EPUB 3) av texter skrivna i [Word Work](https://github.com/mikkeschiren/word-work-rust).
Du väljer vilka Markdown-filer som ska vara kapitel, i vilken ordning, fyller i
titel, författare och omslag, och sparar boken som en `.epub` som fungerar i
läsplattor och bokhandlar.

## Så fungerar det

- **Typ.** *Roman eller bok med kapitel*: varje fil blir ett kapitel med
  rubrik och boken får en innehållsförteckning. *Novell eller enskild text*:
  texten återges som den är, utan tillagda rubriker eller
  innehållsförteckning. *Novellsamling eller antologi*: varje fil blir en
  novell med rubrik och författarnamn (från textens *Byline*) och boken får en
  innehållsförteckning.
- **Om boken.** Titel, författare, språk, utgivningsdatum, förlag,
  identifierare (ISBN eller URN), rättigheter, beskrivning och omslag.
- **Omslag.** Välj en egen bild eller låt programmet rita ett omslag av titel
  och författare i någon av 21 stilar, från *Pocketklassiker* och
  *Bauhaus* till *Art déco*. Omslaget går också att spara som bild.
- **Kapitel.** *Lägg till kapitel …* öppnar din Word Work-mapp. Varje fil blir
  ett kapitel med sin rubrik från textens metadata (*Rubrik* i Word Work) eller
  filnamnet. Flytta med pilarna, ta bort med ✕.
- **Spara bok.** Boken sparas som en liten `.yaml`-fil som pekar på kapitlen,
  så du kan öppna den igen och bygga om när texterna ändrats.
- **Skapa EPUB …** bygger boken. Egna anteckningar och kommentarer i texterna
  följer aldrig med; fotnoter gör det.

Formatet på texterna beskrivs i [word-work-markdown](https://github.com/WordWorkers/WordWorkMarkdown).

## Utveckling

Se [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).
