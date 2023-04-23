import './style.css'
import { validate_country, gen_empty_object, getCapitalByCountryName } from './filter'
import { NewsElement } from './types';


let app: HTMLDivElement
let start: HTMLInputElement
let end: HTMLInputElement
let load: HTMLButtonElement
let download: HTMLButtonElement

function init() {
    app = document.querySelector('#app')!
    start = document.querySelector('#start')!
    end = document.querySelector('#end')!
    load = document.querySelector('#load')!
    download = document.querySelector('#download')!

    let dates: HTMLInputElement[] = [start, end]

    dates!.forEach(element => {
        element!.addEventListener('change', event => {
            event.preventDefault()
            event.stopPropagation()

            update()
        })
    })

    load.addEventListener('click', () => {
        update()
    })
    download.addEventListener('click', async () => {
        
        let text = await genText(JSON.parse(localStorage.news))
        const encoder = new TextEncoder();
        const utf8Bytes = encoder.encode(text);

        // Create a Blob object from the Uint8Array
        const blob = new Blob([utf8Bytes], { type: 'text/plain; charset=utf-8' });
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, '_blank')!.focus();
    })

    try {
        loadNews(JSON.parse(localStorage.news))
        start.value = localStorage.start
        end.value = localStorage.end
    } catch {
        update()
    }

}

async function update() {


    let startdate = new Date(start.value)
    let enddate = new Date(end.value)

    if ((enddate.getTime() - startdate.getTime()) <= 0) {
        let temp = startdate
        startdate = enddate
        enddate = temp
    }

    start.value = formatDate2(startdate)
    end.value = formatDate2(enddate)

    localStorage.start = start.value
    localStorage.end = end.value

    let dates: Date[] = getDates(startdate, enddate)

    let processedDates: string[] = []

    dates.forEach(date => {
        processedDates.push(formatDate(date))
    })

    console.log(processedDates)
    let news = await fetchNews(processedDates)
    localStorage.news = JSON.stringify(news)
    loadNews(news)
}

async function loadNews(foreign_countries: Record <string, string[][]> ) {

    app.innerHTML = ''
    for (const [key, value] of Object.entries(foreign_countries)) {
        if (value.length > 0) {
            let country_wrapper: HTMLDivElement = document.createElement('div')
            country_wrapper.classList.add('country_wrapper')

            let country: HTMLDivElement = document.createElement('div')
            country.classList.add('country')
            let capital_city: string = await getCapitalByCountryName(key)

            let text: Text = document.createTextNode(key + ' (' + capital_city + ')' + ': ');

            country.appendChild(text);

            country_wrapper.appendChild(country)

            for (let i = 0; i < value.length; i++) {
                const headline: string[] = value[i];

                let headline_element: HTMLDivElement = document.createElement('div')
                headline_element.classList.add('headline')

                let marker: Text = document.createTextNode('- ')
                let _headline = document.createElement('a')
                _headline.href = headline[0]
                _headline.appendChild(document.createTextNode(headline[1]))
                // let _headline: Text = document.createTextNode(headline)
                headline_element.appendChild(marker)
                headline_element.appendChild(_headline)
                country_wrapper.appendChild(headline_element)
            }


            app.appendChild(country_wrapper)
        }
    }
}

async function genText(foreign_countries: Record <string, string[][]> ) {
    let text = ''
    for (const [key, value] of Object.entries(foreign_countries)) {
        if (value.length > 0) {
            let capital_city: string = await getCapitalByCountryName(key)

            let country: string = key + ' (' + capital_city + ')' + ': ';
            text = text + country + '\n'

            for (let i = 0; i < value.length; i++) {
                const headline: string[] = value[i];

                let _headline: string = headline[1]
                text = text + ' - ' +_headline + '\n'
            }
        }
    }
    return text
}

async function fetchNews(dates: String[]) {
    let foreign_countries: Record < string, string[][] > = gen_empty_object()

    for (let i = 0; i < dates.length; i++) {
        const datestring = dates[i];

        let url = `https://www.tagesschau.de/api2/newsfeed-101~_date-${datestring}.json`;

        let news: NewsElement[] = await fetch(url)
            .then(response => response.json())
            .then(data => {
                return data.news
            })
            .catch(error => console.error(error));

        for (let i = 0; i < news.length; i++) {
            const element: NewsElement = news[i];
            if (element.ressort == 'ausland') {
                for (let j = 0; j < element.tags.length; j++) {
                    const tag: string = element.tags[j].tag;
                    let result: string | false = validate_country(tag)
                    if (result != false) {
                        foreign_countries[result].push([element.shareURL!, element.title])
                        // <a href=''></a>
                    }
                }
            }
        }
    }
    return foreign_countries
}

function getDates(startDate: Date, stopDate: Date): Date[] {
    var dateArray: Date[] = [];
    var currentDate = startDate;
    while (currentDate <= stopDate) {
        dateArray.push(currentDate)
        currentDate = addDays(currentDate, 1);
    }
    return dateArray;
}


function addDays(date: Date, days: number): Date {
    var dat = new Date(date.valueOf())
    dat.setDate(dat.getDate() + days);
    return dat;
}

function formatDate(date: Date): string {
    var d = new Date(date)
    let month = '' + (d.getMonth() + 1)
    let day = '' + d.getDate()
    let year = d.getFullYear().toString().slice(2)

    if (month.length < 2)
        month = '0' + month
    if (day.length < 2)
        day = '0' + day

    return [year, month, day].join('')
}

function formatDate2(date: Date): string {
    var d = new Date(date)
    let month = '' + (d.getMonth() + 1)
    let day = '' + d.getDate()
    let year = d.getFullYear().toString()

    if (month.length < 2)
        month = '0' + month
    if (day.length < 2)
        day = '0' + day

    return [year, month, day].join('-')
}


document.addEventListener('DOMContentLoaded', () => {
    init()
});