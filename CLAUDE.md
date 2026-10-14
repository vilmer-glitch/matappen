# Matappen

En webbapp som håller koll på matvarorna hemma, visar vad jag kan laga och skriver inköpslistan åt mig.

## Så vill jag att du jobbar
- Svara på svenska, kort och utan jargong. Jag lär mig programmering under tiden.
- Efter varje steg: berätta kort vad du har gjort och vad jag ska testa i förhandsvisningen.
- När jag måste göra något själv (skapa ett konto, kopiera en nyckel, installera ett program): ge numrerade steg-för-steg-instruktioner.
- Fråga hellre än att gissa när något är oklart.
- Bygg i små steg som går att se och testa i förhandsvisningen.
- Gör en git-commit efter varje fungerande steg, med ett tydligt meddelande på engelska.
- Lägg inte till betaltjänster, betal-API:er eller AI-anrop utan att fråga mig.
- Håll `README.md` uppdaterad på engelska: vad appen gör, skärmdumpar och hur man kör den.
- När ett steg i byggordningen är klart: bocka av det här i filen.

## Mål
- Version 1 är bara för mig, på min dator. Den ska gå snabbt att använda, och allt ska sparas.
- Senare: använda den i mobilen, kanske dela den med andra och visa projektet på GitHub och i mitt CV.

## Teknik
- React, Vite och TypeScript. Tailwind CSS för utseendet.
- Supabase (gratisplanen) som databas, med inloggning via e-post och lösenord. Inloggningen sparas så att jag inte behöver logga in varje gång.
- Varje tabell har `user_id` och Row Level Security, så att bara den inloggade användaren ser sina data.
- Nycklar och lösenord ligger i `.env.local`, som aldrig checkas in i git.
- Vercel (gratisplanen Hobby) för publicering när version 1 fungerar lokalt.
- Kod, tabeller och variabelnamn på engelska. Allt i gränssnittet på svenska.

## Användarupplevelse
- Allt vanligt ska gå med ett klick: välja en rätt, markera en vara som slut, bocka av på listan, "Jag lagade den här".
- Inga "Är du säker?"-rutor. Visa i stället en Ångra-knapp i några sekunder efter en ändring.
- Lägga till varor: ett sökfält som föreslår varor medan jag skriver.
- Startvyn är en översikt i tre kolumner: Lager, Veckans rätter och Inköpslista.
- Byggd för datorskärm först, men så att den kan anpassas till mobil senare.

## Funktioner i version 1
- **Lager:** alla varor hemma i tre grupper: Kyl (kyl och frys), Skafferi (torra varor, t.ex. pasta) och Basvaror.
  - Varor i Kyl och Skafferi har bara mängd, inga statusknappar. Mängd 0 = slut.
  - Varje vara har en låst enhet som väljs när den läggs till: g, ml, dl, l eller st (kyckling i g, grädde i dl, mjölk i l, rödlök i st).
  - Basvaror har ingen mängd.
  - Från början finns bara basvarorna i lagret.
- **Basvaror:** varor som alltid antas finnas, till exempel salt, olja och kryddor. Markeras med en bock och dras aldrig av.
- **Rätter:** namn och ingredienser, plus valfri länk och anteckning.
  - Egen flik "Recept": lista till vänster, vald rätt till höger. − / + vid portionerna skalar mängderna på skärmen.
  - Ingredienser kopplas till varor i lagret. Ny ingrediens skapas i lagret med mängd 0.
  - Recept kan använda närliggande enheter (g/kg, ml/dl/l/msk/tsk/krm, st). Appen räknar om till lagrets enhet.
  - En vara som används i ett recept kan inte tas bort från lagret (sätt mängden till 0 i stället).
- **Vad kan jag laga?:** visar rätter jag kan laga nu och rätter där bara 1–2 varor saknas.
  - "Kan lagas" betyder minst 1 portion. Appen visar hur många portioner det jag har hemma räcker till.
- **Veckans rätter:** jag väljer rätter med ett klick. Allt som saknas för dem hamnar automatiskt på inköpslistan, en gång per vara även om flera rätter behöver den.
  - Lagade rätter blir grå och överstrukna längst ner. "Rensa lagade" tar bort dem.
- **Inköpslista:** automatiska och egna varor. Varor som är slut (mängd 0) visas som förslag. Knappen "Klar med handlingen" lägger avbockade varor i lagret.
  - Listan föreslår mängden som fattas (t.ex. 300 g). Jag kan ändra den till det jag faktiskt köpte (t.ex. 500 g) innan jag bockar av.
- **Jag lagade den här:** jag väljer hur många portioner jag lagade, och appen drar av ingredienserna för just så många portioner från lagret (4 portioner köttfärssås = hela receptet, 2 portioner = halva). Basvaror dras aldrig av. Räcker inte lagret blir mängden 0. Ångra-knappen återställer allt. Rätten markeras som lagad om den var planerad.

## Datamodell (förslag)
- `items`: varor med kategori, enhet, `is_staple` (basvara), status och mängd hemma (`quantity`)
- `recipes`: rätter med namn, standardportioner (`servings`), instruktioner, länk och anteckning
- `recipe_ingredients`: vilka varor en rätt behöver, med mängd och enhet för receptets portioner
- `planned_meals`: rätter valda för kommande period, antal portioner och om de är lagade (inget datum)
- `shopping_list_items`: inköpslistan med vara, mängd, avbockad och källa (rätt eller manuell)

## Byggordning
- [x] 1. Projektgrund, Supabase-koppling och inloggning
- [x] 2. Lager med status och basvaror
- [x] 3. Rätter med ingredienser
- [x] 4. Vad kan jag laga?
- [ ] 5. Veckans rätter, automatisk inköpslista och "Klar med handlingen"
- [ ] 6. Jag lagade den här
- [ ] 7. Gör appen installerbar (manifest och ikon), lägg upp den på GitHub och publicera på Vercel

## Senare, inte i version 1
- AI-förslag på rätter. Först bara en knapp som kopierar lagret, så att jag kan fråga Claude i chatten.
- Mobilanpassning
- Kvittoskanning
- En agent som hämtar veckans erbjudanden från min butik och planerar maten efter dem
- Flera användare och delning

## Öppna frågor
Om de inte är besvarade: ställ dem till mig innan du börjar bygga, och skriv in svaren här.
1. Räcker status (finns / lite kvar / slut), eller vill jag ange exakta mängder? Förslag: status, med mängd som tillval.
   **Svar:** Nästan exakta mängder. Recepten har mängd per ingrediens för ett visst antal portioner och skalas (4 portioner = ca 1 kg köttfärs → 5 portioner = ca 1,25 kg). Lagret har mängd per vara; appen drar av och lägger bara det som fattas på inköpslistan. Status finns kvar för snabba klick.
2. Vilka varor ska vara basvaror från början?
   **Svar:** Salt, peppar, olja, smör, socker, vetemjöl, vinäger, buljong och vanliga kryddor.
3. Ska rätterna ha tillagningsinstruktioner, eller räcker ingredienser plus länk?
   **Svar:** Ja. En receptvy där jag kan bläddra bland alla rätter och se information om varje, bland annat instruktioner för hur den lagas.
4. Väljer jag veckans rätter utan datum, eller vill jag lägga dem på specifika dagar? Förslag: utan datum.
   **Svar:** Utan datum. En planeringsvy för kommande inköp som föreslår rätter bland mina recept. Jag väljer smidigt, och inköpslistan skapas automatiskt. Rätterna är flexibla: antal portioner är receptets standard men går att ändra.
