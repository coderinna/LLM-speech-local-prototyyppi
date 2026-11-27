# LLM-speech-local-prototyyppi

Offline-toimiva keskustelukumppanidemo, jossa käyttäjän puhe tunnistetaan paikallisesti suomenkielisellä puheentunnistusmallilla. Tunnistettu teksti välitetään paikalliselle kielimallille (LLM), joka muodostaa vastauksen. Vastaus muunnetaan puheeksi paikallisella puhesynteesillä.

## Nykyinen kehitysvaihe

LLM-speech-local-DEMOn ensimmäinen paikallisesti toimiva puheesta puheeksi -prototyyppi on toteutettu Linux-kehitysympäristössä.

Sovellus pystyy:
- tallentamaan puhetta mikrofonista push-to-talk-painikkeen avulla (caps-lock nyt simuloi fyysistä laitteistoa)
- tunnistamaan suomenkielistä puhetta paikallisella Whisper.cpp-mallilla
- välittämään tunnistetun tekstin paikalliselle Gemma 3 4B -kielimallille
- muodostamaan suomenkielisen vastauksen
- puhumaan vastauksen paikallisella Piper TTS -järjestelmällä.
- erillinen puheentunnistuksen luotettavuuden tarkistuskerros

## Toteutettu

- [x] Projektin perusrakenne
- [x] Push-to-talk-painikkeen käsittely
- [x] Mikrofonin tallennus WAV-muotoon
- [x] Äänitallentimen automaattiset testit
- [x] Whisper.cpp käännetty paikallisesti
- [x] Whisper-mallin lataus
- [x] Mikrofonin ja Whisper.cpp:n välinen integraatio
- [x] Puheentunnistuksen tuloksen välittäminen keskustelumoduulille
- [x] Whisperin JSON-palautemuodon käyttöönotto
- [x] Puheentunnistuksen token-kohtaisten arvojen lukeminen
- [x] Ollama asennettu kehitysympäristöön
- [x] Gemma 3 4B ladattu ja testattu
- [x] Paikallisen kielimallin integrointi Node.js-sovellukseen
- [x] Mikrofonista tunnistetun puheen välittäminen kielimallille
- [x] Kielimallin vastauksen palauttaminen sovellukselle
- [x] Sovelluksen puheesta puheeksi -perustoimintaketju testattu
- [x] Kaiuttimen integrointi
- [x] Piper TTS:n integrointi Node.js-sovellukseen
- [x] Suomenkielisen Harri-puheäänen testaus
- [x] Harri- ja Asmo-äänien valintatoiminnon alustava toteutus
- [x] Suomenkielisen puheentunnistuksen Base- ja Small-mallien vertailu
- [x] Whisper Small -mallin valinta jatkotestaukseen
- [x] Ensimmäinen turvallisuuden sisältösuodatin
- [x] Erillinen RecognitionSafetyGate-puheentunnistuksen tarkistuskerros
- [x] RecognitionSafetyGaten integrointi ConversationEngineen
- [x] Epävarman tai puutteellisen tunnistustiedon käsittely estävällä oletuksella
- [x] Onnistuneen normaalin puheentunnistuksen ja Gemma-vastauksen testaus integroidussa sovelluksessa

## Kesken

- [ ] RecognitionSafetyGaten ja ConversationEnginen yhdistetyt automaattiset integraatiotestit
- [ ] Turvallisuuden sisältösuodattimen kattava testaus
- [ ] Puheentunnistuksen virheiden ja väärin tunnistettujen vaarallisten sanojen käsittely


Viimeisimmässä raportoidussa `npm test` -ajossa:
- 14 testiä läpäisi.
- 0 testiä epäonnistui.

Testit kattoivat muun muassa mikrofonitallennuksen, puheentunnistuksen rajapinnan, Gemma-vastauksen, painikkeen, Piperin sekä RecognitionSafetyGaten perustapaukset.

Tämän jälkeen RecognitionSafetyGate kytkettiin ConversationEngineen. Integroitu sovellus käynnistettiin onnistuneesti, ja normaalista puheesta muodostui Gemman vastaus, jonka Piper puhui.


## Fyysinen laitetesti halutessaan

- [ ] Raspberry Pi -prototyyppi
- [ ] Offline-toiminnan testaaminen lopullisella laitteistolla

## Puheentunnistus

LLM-speech-local-DEMO käyttää paikallista Whisper.cpp-puheentunnistusta. Puhe käsitellään kehitysympäristön omalla prosessorilla ilman puheentunnistuksen pilvipalvelua.

Käytössä on Whisper Small -malli (`ggml-small.bin`), joka valittiin Base- ja Small-mallien vertailutestin perusteella.

Vertailutesti samalla 8 sekunnin suomenkielisellä äänitteellä:

| Malli | Käsittelyaika |
|---|---:|
| Whisper Base | 2,09 s |
| Whisper Small | 5,96 s |

Small tunnisti testissä suomenkielisen puheen Base-mallia paremmin, vaikka tunnistuksessa esiintyi edelleen virheitä. Parempi tunnistustarkkuus valittiin nopeamman käsittelyn sijaan.

**Mallin asetukset:**
- Kieli: suomi (`fi`)
- Ääniformaatti: 16 kHz, mono, 16-bit PCM
- Malli: Whisper Small
- Suoritustapa: paikallinen CPU-käsittely
- Palautemuoto: JSON, sisältäen tunnistetut segmentit ja token-arvot.

Puheentunnistus toimii paikallisesti. Äänitallenteiden pysyvää tallennusta ei tavoitella.


Small on tällä hetkellä valittu, koska tunnistuksen laatu oli selvästi parempi.
Mitä järempi malli voidaan ottaa käyttöön, sen tottakai paremmaksi tunnistus paranee.
Tämä oli pikainen demo perus mallilla, kokemusta saatu huonosta ja vähän paremmasta.
Seuraavaksi kokeilla oikein järeää.

Tavoitteena on löytää **Smallia parempi puheentunnistusmalli**, joka tarjoaa:

- tunnistaa suomen tarkemmin
- käsittelee puheen tarpeeksi nopeasti
- on mahdollisemman tehokas suhteessa rautaan
- toimii myös Raspberry Pi -laitteessa

Mallia ei valita pelkän koon perusteella.

**Laatu + nopeus + laitevaatimus** ratkaisevat.

## Puheentunnistuksen luotettavuuden tarkistus

Whisperin JSON-palautetta hyödynnetään erillisessä `RecognitionSafetyGate`-komponentissa.

Tarkistuskerros arvioi tunnistuksen token-kohtaisia `p`-arvoja ja laskee niiden perusteella alustavat tunnistuksen hyväksymiskriteerit.

Nykyiset oletusrajat:
- Yksittäisen puhetokenin vähimmäisarvo: `0.20`
- Puhetokenien keskiarvon vähimmäisarvo: `0.50`

Jos tunnistuksen tiedot puuttuvat tai tunnistus ei täytä asetettuja ehtoja, kysymystä ei välitetä kielimallille. Lapselta pyydetään tällöin puheen toistamista.

**Tärkeä rajoitus:** Whisperin token-arvot eivät ole kalibroituja todennäköisyyksiä lauseen oikeellisuudesta. Korkeat arvot eivät takaa, että sana on tunnistettu oikein. Esimerkiksi väärin tunnistettu sana voi saada korkean arvon. Nykyiset rajat ovat alustavia heuristiikkoja, eivät todistettu turvallisuusmittari.

# LLM Kielimalli

Kehityksen aikana testattiin kahta paikallisesti suoritettavaa kielimallia:

| Malli | Testitulos | Valinta |
|---|---|---|
| Qwen3 0.6B | Keskustelun laatu ei ollut riittävä | Ei valittu |
| Gemma 3 4B | Keskustelu toimi paremmin, mutta laatu on edelleen välttävä. Hourailua oli paljon. | Nykyinen testimalli |

Gemma 3 4B valittiin jatkokehitykseen paremman keskustelulaadun perusteella.

Projekti on kuitenkin edelleen tekninen demo, eikä Gemma 3 4B ole lopullinen pakollinen mallivalinta. Testien aikana on saatu käytännön kokemusta sekä heikomman että paremman keskustelulaadun tarjoavista malleista.

Kielimalli voidaan vaihtaa myöhemmin huomattavasti suurempaan ja suorituskykyisempään malliin käytettävissä olevan laitteiston resurssien mukaan.

Nykyinen testattava kielimalli on Gemma 3 4B.

- Paikallinen suoritus Ollaman kautta.
- Ollama-mallitunniste: `gemma3:4b`.
- Latauskoko noin 3,4 GB.
- Integroitu Node.js-sovellukseen.
- Suomenkielistä keskustelua on testattu käytännössä


## Suomenkielinen puhesynteesi

LLM-speech-local-DEMO käyttää paikallista Piper-puhesynteesiä.

Käytettävissä oleviksi äänivaihtoehdoiksi on määritelty:
- **Harri** – oletusääni.
- **Asmo** – vaihtoehtoinen ääni.

Ääni valitaan käynnistettäessä:

```bash
LLM-speech-local-DEMO_VOICE=harri npm start
LLM-speech-local-DEMO_VOICE=asmo npm start
```

Harrin suomenkielinen puheääni on testattu käytännössä. Asmon mallin saatavuus ja toiminta pitää vielä varmistaa lopullisessa käyttöympäristössä.

**Huomio:** Asmon mallin lisenssi on CC BY-NC 4.0, joka rajoittaa käyttöä.

Itse en tykännyt kummankaan äänen sävystä tarpeeksi, pitää etsiä parempi, mutta tuottaa ymmärettävää suomenkielen puhetta.

## Turvallisuus-kerros

Turvallisuutta toteutetaan erillisinä tarkistuskerroksina. Tavoitteena on, ettei turvallisuus perustu pelkästään kielimallille annettuun järjestelmäkehotteeseen.

### Toteutettu ensimmäinen versio

**RecognitionSafetyGate**

Tarkistaa Whisperin palauttaman tunnistustiedon ennen sisällön käsittelyä. Epävarma tai puutteellinen tunnistus estetään ennen kielimallille lähettämistä.

**SafetyGuard**

Tarkistaa tunnistetun tekstin sisältöä ennen kielimallille lähettämistä. Projektissa on alustavat sääntökokonaisuudet seuraaville aihealueille:

- huumeet
- aseet ja räjähteet
- itsensä vahingoittaminen
- seksuaalinen sisältö
- väkivalta
- päihteet
- vihapuhe
- kiusaaminen.

Sääntöpohjainen tunnistus on ensimmäinen toteutusvaihe. Se ei vielä tunnista kaikkia ilmaisuja, asiayhteyksiä tai puheentunnistuksen virheitä. Myös kielimalleilla itsellään on turvallisuus ratkaisuja sisäisiä.

## Localhost only

Sovellus voi toimia paikallisesta ilman ytheyttä internettiin oli tavoite

- Ei pilvipalveluita keskustelun käsittelyyn
- Äänitallenteita ei tallenneta pysyvästi
- Keskusteluja ei tallenneta pysyvästi
- Väliaikaiset äänitiedostot poistetaan käsittelyn jälkeen
- Kielimalli toimii paikallisesti Ollaman kautta
- Ladatut mallit ja paikalliset riippuvuudet säilytetään kehitysympäristössä
