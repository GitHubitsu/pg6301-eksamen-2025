# Eksamen i webutvikling og API-design

Kandidatnummer: 12

Flowkode:1615 PG6301 1 KONT1 2025 08

GitHub repo: https://github.com/GitHubitsu/pg6301-eksamen-2025

Heroku: [https://git.heroku.com/eksamen2025.git](https://dashboard.heroku.com/apps/eksamen2025/)

## Gjøremål

* [x] Grunnleggende oppsett
  * [x] Git
  * [x] gitignore
  * [x] client
    * [x] Vite
    * [x] npm
    * [x] prettier
* [x] bygge client-side
  * Sider
    * [x] forside med liste av innlegg
    * [x] visning av individuelt innlegg
      * [x] innlogget: opprette innlegg (verifisert bruker)
      * [x] innlogget: redigere eget innlegg (verifisert bruker)
    * [x] innloggingsside
    * [x] profilside
    * [x] 404 ikke funnet-side
  * [x] Routes
  * [x] CSS Grid
* [x] server
  * [x] npm
  * [x] express
  * [x] nodemon
  * [x] concurrently
  * [x] websockets
* [x] mongodb
  * [x] mongodb lokalt (dev) (db-navn "eksamen-react")
  * [x] koble express <-> mongodb
  * [ ] mongodb eksternt (deploy)
* [x] testing

## Beskrivelse av løsning

Planen min var at nye brukere forblir uverifiserte inntil de har lagt igjen en 
emoji-reaksjon på tre forskjellige innlegg. Når den tredje emoji-reaksjonen er
registrert skulle brukeren automatisk få status som verifisert. Til tross for
iherdige forsøk fikk jeg ikke det til og måtte legge det fra meg.I stedet valgte
jeg å legge inn en knapp som skal være synlig i venstre sidekolonne. Trykker man
denne knappen skal man bli verifisert, og dermed få tilgang til å legge inn
nye innlegg. Det er et problem med innlogging/utloggings-mekanismen. Når en cookie
er satt forblir den der selv hvis man manuelt forsøker å fjerne den. Det gjør at
man kan ende opp i en tilstand hvor man tilsynelatende verken er innlogget eller
utlogget. Jeg fikk også problemer med å kjøre tester med Vitest uten at jeg kom
til bunns i hva problemet består i.

Løsningen gjør det mulig å logge inn med OpenID Connect via Google, legge til
innlegg, emojis og kommentarer til MongoDB databasen.
Det er tre tilgangsnivåer. Kun verifiserte brukere kan skrive innlegg. Man må
være logget inn for å kunne reagere med emoji eller kommentarer på et innlegg, men
man må ikke være verifisert. Innlegg må være mellom 10 ord og tusen tegn for å 
kunne bli lagret. Man blir dermed forhindret fra å kunne sende inn et innlegg som
mangler tekst.

CSS Grid er benyttet for stilsetting sammen med Flexbox. Prettier formatterer koden, og
Concurrently benyttes sammen med Nodemon for å starte server og klient samtidig med
kommandoen npm start. Vitest starter testing med kommandoen npm test.

Appen har fungert ganske fint lokalt på egen maskin, men ville ikke bygge på Heroku.
Dermed feiler deployering til Heroku, med en uforståelig feilmelding om at den ikke
kan finne @vitejs/plugin-react.