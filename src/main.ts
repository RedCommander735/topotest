import './style.css'
import { validate_country, gen_empty_object, getCapitalByCountryName, getCodeByCountryName, getCountryNameByCode } from './filter'
import { NewsElement } from './types';
import { makeElementDraggable, makeElementZoomable } from './utils';


let app: HTMLDivElement
let start: HTMLInputElement
let end: HTMLInputElement
let load: HTMLButtonElement
let download: HTMLButtonElement
let infotext: HTMLParagraphElement
let last_refresh: HTMLParagraphElement
let map: HTMLDivElement
let toggle_map: HTMLButtonElement
let paths: NodeListOf<HTMLElement>
let country_name_tooltip: HTMLDivElement
let country_name: HTMLParagraphElement

let map_elements: NodeListOf<HTMLElement>
let list_elements: NodeListOf<HTMLElement>

async function init() {
    let toggle = true;
    app = document.querySelector('#app')!
    start = document.querySelector('#start')!
    end = document.querySelector('#end')!
    load = document.querySelector('#load')!
    download = document.querySelector('#download')!
    infotext = document.querySelector('#infotext')!
    last_refresh = document.querySelector('#last_refresh')!
    map = document.querySelector('#world_map')!
    toggle_map = document.querySelector('#map')!
    country_name_tooltip = document.querySelector('#country_name_tooltip')!
    country_name = document.querySelector('#country_name')!

    map_elements = document.querySelectorAll('.map')!
    list_elements = document.querySelectorAll('.list')!

    document.addEventListener("mousemove", (event) => {
        if (!toggle) {
            let x = event.clientX
            let y = event.clientY
            country_name_tooltip.style.setProperty('--mouse-x', `${x + window.scrollX}px`)
            country_name_tooltip.style.setProperty('--mouse-y', `${y + window.scrollY}px`)
        }
    });

    document.addEventListener('mouseover', (event) => {
        if (!toggle) {
            if (event.target instanceof Element) {
                if (!(event.target.classList.contains('path'))) {
                    country_name_tooltip.style.setProperty('display', 'none')
                }
            }
        }
    })

    if (location.hostname == 'localhost') {
        map.innerHTML = await fetch('/src/g747.svg')
            .then((response) => response.text());
    } else {
        map.innerHTML = await fetch('https://raw.githubusercontent.com/RedCommander735/topotest/main/src/g747.svg')
            .then((response) => response.text());
    }   

    paths = document.querySelectorAll('.path')!

    

    for (let i = 0; i < paths.length; i++) {
        let path = paths[i]

        path.addEventListener("mouseover", (event) => {
            if (!toggle) {
                let target = event.target

                if (target instanceof Element) {
                    if (target.classList.contains('marker')) {
                        country_name.innerHTML = path.innerHTML
                        country_name_tooltip.style.setProperty('display', 'block')
                    } else {
                        country_name_tooltip.style.setProperty('display', 'none')
                    }
                }
            }
        })
        let name = getCountryNameByCode(path.id)!
        path.innerHTML = `${name} (${await getCapitalByCountryName(name)})`
    }



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
        await genText(JSON.parse(localStorage.news), new Date(JSON.parse(localStorage.last_refresh)))
    })
    toggle_map.addEventListener('click', () => {
        if (toggle) {
            list_elements.forEach((element) => {
                element.style.display = 'none'
            })
            map_elements.forEach((element) => {
                element.style.display = 'block'
            })
            toggle = false
        } else {
            list_elements.forEach((element) => {
                element.style.display = 'block'
            })
            map_elements.forEach((element) => {
                element.style.display = 'none'
            })
            toggle = true
        }
        
    })

    let draggableElement = makeElementDraggable({element: map, isOverflowHiddenDesired: true})!;
      
    // now you can zoom element inside it's parent
    let zoomableElement = makeElementZoomable({element: map, steps: 5, MAX: 10})!;

    document.onwheel = (event) => {
        event.preventDefault();
        if (zoomableElement.currentZoom() == 1) {
            draggableElement.stopDraggableBehavior()
        } else {
            draggableElement = makeElementDraggable({element: map, isOverflowHiddenDesired: true})!;
        }
    }


    try {
        loadNews(JSON.parse(localStorage.news), new Date(JSON.parse(localStorage.last_refresh)))
        start.value = localStorage.start
        end.value = localStorage.end
    } catch {
        update()
    }

}

async function update() {
    let refresh = new Date()
    localStorage.last_refresh = JSON.stringify(refresh)


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

    // console.log(processedDates)
    const start_time = performance.now();
    let news = await fetchNews(processedDates);
    localStorage.news = JSON.stringify(news);
    const end_time = performance.now();
 
    loadNews(news, refresh, end_time - start_time)
}

async function loadNews(foreign_countries: Record <string, string[][]>, refresh: Date, time?: number) {

    last_refresh.innerHTML = `Zuletzt aktualisiert: ${refresh.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' })}, ${refresh.toLocaleTimeString()}`

    let counter = 0;
    let ccounter = 0;
    
    Object.keys(foreign_countries).forEach((key) => {
        if (foreign_countries[key].length > 0) {
            ccounter++;
        }
        counter += foreign_countries[key].length
    })
    if (time == undefined) {
        infotext.innerHTML = `Es wurden ${counter} Nachrichten aus ${ccounter} Ländern geladen. <br> Alle Einträge sind clickbar und führen zur Originalseite`
    } else { 
        infotext.innerHTML = `Es wurden ${counter} Nachrichten aus ${ccounter} Ländern in ${time} ms geladen. <br> Alle Einträge sind clickbar und führen zur Originalseite` 
    }

    let data = false
    for (const [, value] of Object.entries(foreign_countries)) {
        if (value.length > 0) {
            data = true
        }
    }
        
    if (data) {

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

                let country_code: string = await getCodeByCountryName(key)!
                let cc: HTMLElement = document.querySelector(`#${country_code.toUpperCase()}`)!
                cc.classList.add('marker');


                for (let i = 0; i < value.length; i++) {
                    const headline: string[] = value[i];

                    let headline_element: HTMLDivElement = document.createElement('div')
                    headline_element.classList.add('headline')

                    let marker: Text = document.createTextNode('- ')
                    let _headline = document.createElement('a')
                    _headline.href = headline[0]
                    let topline = document.createElement('span')
                    topline.appendChild(document.createTextNode(`${headline[2]}: `))
                    topline.classList.add('topline')
                    _headline.appendChild(topline)
                    _headline.appendChild(document.createTextNode(headline[1]))
                    // let _headline: Text = document.createTextNode(headline)
                    headline_element.appendChild(marker)
                    headline_element.appendChild(_headline)
                    country_wrapper.appendChild(headline_element)
                }


                app.appendChild(country_wrapper)
            }
        }
    } else {
        app.innerHTML = 'Den Datumszeitraum oben in die zwei Datenfelder eingeben, "Load" clicken und eine Liste von allen Nachrichten aus dem Ausland von der Tagesschau sortiert nach Land erhalten'
    }
}

async function genText(foreign_countries: Record <string, string[][]>, refresh: Date ) {
    
    let data = false
    for (const [, value] of Object.entries(foreign_countries)) {
        if (value.length > 0) {
            data = true
        }
    }
        
    if (data) {

        let text = `Zuletzt aktualisiert: ${refresh.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' })}, ${refresh.toLocaleTimeString()}` + '\n\n'
        for (const [key, value] of Object.entries(foreign_countries)) {
            if (value.length > 0) {
                let capital_city: string = await getCapitalByCountryName(key)

                let country: string = key + ' (' + capital_city + ')' + ': ';
                text = text + country + '\n'

                for (let i = 0; i < value.length; i++) {
                    const headline: string[] = value[i];

                    let _headline: string = headline[1]
                    text = text + ' - ' + headline[2] + ': ' +_headline + '\n'
                }
                text = text + '\n\n'
            }
        }
        const encoder = new TextEncoder();
        const utf8Bytes = encoder.encode(text);

        // Create a Blob object from the Uint8Array
        const blob = new Blob([utf8Bytes], { type: 'text/plain; charset=utf-8' });
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, '_blank')!.focus();
    }
}

async function fetchNews(dates: string[]) {
    let foreign_countries: Record < string, string[][] > = gen_empty_object()
    let country_code: string | undefined

    for (let i = 0; i < dates.length; i++) {
        const datestring = dates[i];

        // let url = `https://www.tagesschau.de/api2/newsfeed-101~_date-${datestring}.json`;
        let url = `https://www.tagesschau.de/api2u/news?date=${datestring}&ressort=ausland`;
        
        

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
                        country_code = getCodeByCountryName(result)!
                        foreign_countries[result].push([element.shareURL!, element.title, element.topline!, country_code])
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