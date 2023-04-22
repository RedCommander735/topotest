import './style.css'
import { validate_country, gen_empty_object, getCapitalByCountryName } from './filter'

async function init() {
    const datumsangabe = "230421"; // replace with the desired date in the format yyyy-mm-dd
    const url = `https://www.tagesschau.de/api2/newsfeed-101~_date-${datumsangabe}.json`;

    const app = document.querySelector("#app")

    let foreign_countries = gen_empty_object()

    let news = await fetch(url)
        .then(response => response.json())
        .then(data => {
            return data.news // replace with desired handling of the retrieved data
        })
        .catch(error => console.error(error));

    console.log(news.length)

    for (let i = 0; i < news.length; i++) {
        const element = news[i];
        if (element.ressort == "ausland") {
            for (let j = 0; j < element.tags.length; j++) {
                const tag = element.tags[j].tag;
                let result = validate_country(tag)
                if (result != false){
                    foreign_countries[result].push(element.title)
                    console.log(tag)
                }
            }
        }
    }

    for (const [key, value] of Object.entries(foreign_countries)) {
        if (value.length > 0) {
            let country_wrapper = document.createElement('div')
            country_wrapper.classList.add('country_wrapper')

            let country = document.createElement('div')
            country.classList.add('country')

            let capital_city = await getCapitalByCountryName(key)

                let text = document.createTextNode(key + " (" + capital_city + ")" + ": "); 

                country.appendChild(text);

                country_wrapper.appendChild(country)

                for (let i = 0; i < value.length; i++) {
                    const headline = value[i];

                    let headline_element = document.createElement('div')
                    headline_element.classList.add('headline')

                    let _headline = document.createTextNode("- " + headline)
                    headline_element.appendChild(_headline)
                    country_wrapper.appendChild(headline_element)
                }
                

                app.appendChild(country_wrapper)
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    init()
});