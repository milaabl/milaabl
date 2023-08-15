const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const UNSPLASH_API_KEY = process.env.UNSPLASH_API_KEY;

let fs = require('fs')
let got = require('got')
let qty = require('js-quantities')
let formatDistance = require('date-fns/formatDistance')

let WEATHER_DOMAIN = 'http://dataservice.accuweather.com'

const emojis = {
  1: '☀️',
  2: '☀️',
  3: '🌤',
  4: '🌤',
  5: '🌤',
  6: '🌥',
  7: '☁️',
  8: '☁️',
  11: '🌫',
  12: '🌧',
  13: '🌦',
  14: '🌦',
  15: '⛈',
  16: '⛈',
  17: '🌦',
  18: '🌧',
  19: '🌨',
  20: '🌨',
  21: '🌨',
  22: '❄️',
  23: '❄️',
  24: '🌧',
  25: '🌧',
  26: '🌧',
  29: '🌧',
  30: '🥵',
  31: '🥶',
  32: '💨',
}

// Cheap, janky way to have variable bubble width
dayBubbleWidths = {
  Monday: 235,
  Tuesday: 235,
  Wednesday: 260,
  Thursday: 245,
  Friday: 220,
  Saturday: 245,
  Sunday: 230,
}

// Time working at PlanetScale
const today = new Date()
const todayDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(
  today
)

const psTime = formatDistance(new Date(2020, 12, 14), today, {
  addSuffix: false,
})

// Today's weather
const locationKey = '255'
let url = `forecasts/v1/daily/1day/${locationKey}?apikey=${WEATHER_API_KEY}`
console.log(url)

async function getPoem() {
  const data = await fetch('https://poetrydb.org/random').then((res) => res.json()).then(poems => poems[0]);

  const currentReadmeContents = fs.readFileSync("./README.md").toString();

fs.writeFileSync("./README.md", currentReadmeContents.replace(currentReadmeContents.split('<!-- Start poem -->')[1].split('<!-- End poem -->')[0], `
# 💮 ${data.title} by *${data.author}*

<p>
    ${data.lines.join('<br/>')}
</p>

***
`));
};

async function get20LatestStarredRepos() {
    const starredRepos = await fetch('https://api.github.com/users/milaabl/starred').then(res => res.json());

    return starredRepos.slice(0, 30).map((starredRepo) => ({
        name: starredRepo.full_name,
        url: starredRepo.html_url,
        stargazers: starredRepo.stargazers_count,
        description: starredRepo.description || "",
    }));
}

async function displayLatestStarredRepos() {
    const currentReadme = fs.readFileSync("./README.md").toString();

    const toReplace = currentReadme.split("<!-- Starred repos start -->")[1].split("<!-- Starred repos end -->")[0];

    console.log(toReplace)

    const latest20StarredRepos = await get20LatestStarredRepos();

    const starredReposTable = `
| Name | Url | Stars | Description |
| --- | --- |  --- |  --- |
${latest20StarredRepos.map(
(starredRepo) => `| ${Object.values(starredRepo).map((field) => field + "|").join("")}
`
).join("")}
`;

    fs.writeFileSync("./README.md", currentReadme.replace(toReplace, starredReposTable));
}

got(url, { prefixUrl: WEATHER_DOMAIN })
  .then((response) => {
    console.log(response.body)
    let json = JSON.parse(response.body)

    const degF = Math.round(json.DailyForecasts[0].Temperature.Maximum.Value)
    const degC = Math.round(qty(`${degF} tempF`).to('tempC').scalar)
    const icon = json.DailyForecasts[0].Day.Icon

    fs.readFile('template.svg', 'utf-8', (error, data) => {
      if (error) {
        return
      }

      data = data.replace('{degC}', degC)
      data = data.replace('{weatherEmoji}', emojis[icon])
      data = data.replace('{psTime}', psTime)
      data = data.replace('{todayDay}', todayDay)
      data = data.replace('{dayBubbleWidth}', dayBubbleWidths[todayDay])

      data = fs.writeFile('chat.svg', data, (err) => {
        if (err) {
          console.error(err)
          return
        }
      })

      getPoem().then(() => displayLatestStarredRepos());
    })
  })
  .catch((err) => {
    // TODO: something better
    console.log(err)
  })
