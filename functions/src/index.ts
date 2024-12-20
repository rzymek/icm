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

async function icmBeta({lat,lng}:LatLng) {
    return `https://beta.meteo.pl/meteogramy?lat=${lat}&lng=${lng}`
}
async function yr({lat,lng}:LatLng) {
    return `https://www.yr.no/en/content/${lat}, ${lng}/meteogram.svg`
}
async function icmDlugoterminowa({lat,lng}:LatLng) {
    return `https://beta.meteo.pl/prognoza-dlugoterminowa?lat=${lat}&lng=${lng}`
}
async function icm(prefix: '' | '/um', { lat, lng }: LatLng) {
    try {
        const url = `https://old.meteo.pl${prefix}/php/mgram_search.php?NALL=${lat}&EALL=${lng}`;
        console.log(url);
        const resp = await axios.get(url, { maxRedirects: 0, validateStatus: null });
        const [row, col] = resp.headers.location.match(/(row|col)=([0-9]+)/g)?.map(match => match.split(/=/)[1]) ?? []
        if (row === undefined || col == undefined) {
            throw new Error(`pattern not found in location header: ${resp.headers.location}`);
        }
        return `https://old.meteo.pl${prefix}/metco/mgram_pict.php?ntype=0u&row=${row}&col=${col}&lang=pl`
    } catch (e: any) {
        return errorLink(e);
    }
}

async function blueMeteo(type: 'tydzie%C5%84' | '14-dniowa', c: LatLng) {
    try {
        return `https://www.meteoblue.com/pl/pogoda/${type}/${c.lat}N${c.lng}E`
    } catch (e: any) {
        return errorLink(e);
    }
}

async function run(coord: LatLng, response: functions.Response<any>) {
    const config = {
        icm48: icm('/um', coord),
        yr: yr(coord),
        icmBeta: icmBeta(coord),
        icm10d: icmDlugoterminowa(coord),
        blue7: Promise.resolve(`/blue?type=7&lat=${coord.lat}&lng=${coord.lng}`),
        blue14: Promise.resolve(`/blue?type=14&lat=${coord.lat}&lng=${coord.lng}`),
    };
    const results = Object.fromEntries(
        (await Promise.all(
            Object.entries(config)
                .map(([name, promise]) => promise.then(result => ([name, result])))
        )).filter(([, result]) => result)
    );
    response.send(JSON.stringify(results));
}

export const blue = functions.https.onRequest((request, response) => {
    const { lat, lng, type = '7' } = request.query;
    blueMeteo(type === '7' ? 'tydzie%C5%84' : '14-dniowa', { lat: lat as string, lng: lng as string })
        .then(link => link
            ? response.redirect(link)
            : response.sendStatus(500)
        );
});

export const links = functions.https.onRequest((request, response) => {
    const { lat, lng } = request.query;
    run({ lat: lat as string, lng: lng as string }, response);
});
