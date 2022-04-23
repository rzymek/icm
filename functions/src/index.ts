import * as functions from "firebase-functions";

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
export const links = functions.https.onRequest((request, response) => {
    functions.logger.info("Hello logs!", { structuredData: true });
    response.send(JSON.stringify({
        icm48: "http://new.meteo.pl/um/metco/mgram_pict.php?ntype=0u&row=409&col=248&lang=pl",
        icm84: "https://www.meteo.pl/um/metco/mgram_pict.php?ntype=0u&row=395&col=262&lang=pl",
    }));
});
