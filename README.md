# Test colloquio tecnico Senior Full-Stack development

Questa è la demo per il test per il ruolo di Senior Full-Stack.

L'obiettivo dell'esercizio è quello di risolvere il bug segnalato.
Non è importante che il codice sia "production-ready", l'obiettivo è quello di risolvere questo specifico caso e riflettere su
eventuali limiti o alternative alla soluzione scelta.

In fase di colloquio verrà chiesto di illustrare la soluzione applicata e di discutere i limiti e le alternative.

## Overview demo

In questo test è fornita una piccola riproduzione di una webmail.
Una volta avviato il progetto noterete che si tratta di una webmail poco utile: mostra una lista di messaggi e consente di leggerli.

Questa piccola webmail demo, si collega a una reale casella email nei nostri sistemi e le email che troverai nella lista sono due messaggi che sono stati inviati a questa casella.

## Info sull'architettura e le tecnologie usate

L'architettura dell'app è altrettanto minimale, ma si basa sulla struttura della nostra webmail di produzione, quindi troverete qualche funzione e codice che ha un reale utilizzo nella demo.
Questo è un aspetto voluto in quanto è importante per noi che la figura che cerchiamo non sia troppo intimorita nel sporcarsi le mani in un codice che non comprende all 100%.

Nel progetto trovate due cartelle

```
be/
fe/
```

L'applicativo backend è un'app express, e comunica con il frontend, una Single Page Application scritta in React, tramite websocket.
La libreria usata per la gestione dei websocket è socket.io.

Essenzialmente tramite websocket avvengono due operazioni: la richiesta della lista messaggi, e l'apertura del singolo messaggio.
I messaggi email appartengono a una reale casella email e vengono recuperati e mostrati all'utente usando il protocollo IMAP, lo standard per quanto riguarda la consultazione di caselle email.

Il frontend è un'app React, gestita e servita tramite Webpack.
L'applicativo demo non utilizza i functional components di React, in quanto la nostra webmail è uscita quando ancora non esistevano.

Per lo stile usiamo Sass, e nei componenti usiamo la funzionalità di CSS modules offerta da Webpack (https://webpack.js.org/loaders/css-loader/) per isolare il css scritto al singolo componente senza preoccuparsi di avere nomenclature uniche per evitare conflitti.

## Bug da risolvere

Una volta avviato l'ambiente troverai nella lista di messaggi due email, una di test per essere sicuri che l'ambiente funzioni e una dall'oggetto abbastanza esplicativo "Io rompo la UI".

Aprendo questo messaggio noterai che tutta la UI viene corrotta in modo molto evidente.
Il tuo compito è capire perchè succede e implementare una soluzione per arginare il problema.

La soluzione può essere frontend, backend o una combinazione di entrambe.
L'importante è risolvere il bug in questione ed evitare che succeda di nuovo in futuro.

Non riesci a trovare una soluzione al problema? Preparati appunti sul perchè e su cosa ti ha impedito di completare il problema e ci confronteremo durante il colloquio tecnico.

## Avvio ambiente di test

### Requisiti

Docker e node(possibilmente >=18) devono essere disponibili sulla macchina che usi per i test.

1 - Avvia il backend:

```
cd be
docker-compose -f docker-compose-development.yml up
```

2 - In un altro terminale, avvia il frontend:

```
cd fe
# installa le dipendenze
npm install
# questo avvia il server webpack che serve il frontend
NODE_ENV=development TARGET_ENV=development npx webpack-dev-server --progress --colors --watch --config ./config/webpack.config.dev.js
```

visita http://localhost:3000/ per accedere alla demo.

## Troubleshooting

Hai qualche problema nell'avvio dell'ambiente? Scrivi a nicolo.benigni@qboxmail.it per ricevere supporto.
