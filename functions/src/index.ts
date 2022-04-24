import * as functions from "firebase-functions";
import axios from "axios";

interface LatLng {
    lat: string;
    lng: string;
}

function errorLink(e: Error) {
    functions.logger.error(e, { structuredData: true });
    return undefined;
}
async function icm(prefix: '' | '/um', { lat, lng }: LatLng) {
    try {
        const url = `http://new.meteo.pl${prefix}/php/mgram_search.php?NALL=${lat}&EALL=${lng}`;
        console.log(url);
        const resp = await axios.get(url, { maxRedirects: 0, validateStatus: null });
        const [row, col] = resp.headers.location.match(/(row|col)=([0-9]+)/g)?.map(match => match.split(/=/)[1]) ?? []
        if (row === undefined || col == undefined) {
            throw new Error(`pattern not found in location header: ${resp.headers.location}`);
        }
        return `http://new.meteo.pl${prefix}/metco/mgram_pict.php?ntype=0u&row=${row}&col=${col}&lang=pl`
    } catch (e: any) {
        return errorLink(e);
    }
}

async function blueMeteo(type: 'tydzie%C5%84' | '14-dniowa', c: LatLng) {
    try {
        const url = `https://www.meteoblue.com/pl/pogoda/${type}/${c.lat}N${c.lng}E`
        console.log(url);
        const resp = await axios.get(url);
        const [link] = resp.data?.match('//my.meteoblue.com/visimage/meteogram_[^"\']*');
        console.log(link);
        return `https://${link}`;
    } catch (e: any) {
        return errorLink(e);
    }
}

async function run(coord: LatLng, response: functions.Response<any>) {
    const config = {
        icm48: icm('/um', coord),
        icm84: icm('', coord),
        blue7: blueMeteo('tydzie%C5%84', coord),
        blue14: blueMeteo('14-dniowa', coord),
    };
    const results = Object.fromEntries(
        (await Promise.all(
            Object.entries(config)
                .map(([name, promise]) => promise.then(result => ([name, result])))
        )).filter(([, result]) => result)
    );
    response.send(JSON.stringify(results));
}

export const links = functions.region('europe-west3').https.onRequest((request, response) => {
    const { lat, lng } = request.query;

    run({ lat: lat as string, lng: lng as string }, response);
});
