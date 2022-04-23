import * as functions from "firebase-functions";
import axios from "axios";

interface LatLng {
    lat: string;
    lng: string;
}

async function icm(prefix: '' | '/um', { lat, lng }: LatLng) {
    const url = `http://new.meteo.pl${prefix}/php/mgram_search.php?NALL=${lat}&EALL=${lng}`;
    console.log(url);
    const resp = await axios.get(url, { maxRedirects: 0, validateStatus: null });
    const [row, col] = resp.headers.location.match(/(row|col)=([0-9]+)/g)?.map(match => match.split(/=/)[1]) ?? [0, 0]
    return `http://new.meteo.pl${prefix}/metco/mgram_pict.php?ntype=0u&row=${row}&col=${col}&lang=pl`
}

async function run(coord: LatLng, response: functions.Response<any>) {
    response.send(JSON.stringify({
        icm48: await icm('/um', coord),
        icm84: await icm('', coord),
    }));
}

export const links = functions.https.onRequest((request, response) => {
    const { lat, lng } = request.query;
    functions.logger.info("Hello logs!", { structuredData: true });
    run({ lat: lat as string, lng: lng as string }, response);
});
