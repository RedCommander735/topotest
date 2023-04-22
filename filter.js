import countries from './world.json'
import cities from './capital_cities.json'
export function search_country(query) {

    // if argument is not valid return false
    if (undefined === query.id && undefined === query.alpha2 && undefined === query.alpha3 && undefined === query.name) return undefined;

      // iterate over the array of countries
    return countries.filter(function(country) {

        // return country's data if
        return (
            // we are searching by ID and we have a match
            (undefined !== query.id && parseInt(country.id, 10) === parseInt(query.id, 10))
            // or we are searching by alpha2 and we have a match
            || (undefined !== query.alpha2 && country.alpha2 === query.alpha2.toLowerCase())
            // or we are searching by alpha3 and we have a match
            || (undefined !== query.alpha3 && country.alpha3 === query.alpha3.toLowerCase())
            // or we are searching by name and we have a match
            || (undefined !== query.name && country.name == capitalize(query.name))
        )

    // since "filter" returns an array we use pop to get just the data object
    }).pop()

}

export function validate_country(name) {
    for (let i = 0; i < countries.length; i++) {
        const country = countries[i];
        if (country.name == capitalize(name)) {
            return country.name;
        }
    }
    return false;
}

export function gen_empty_object() {
    let _countries = {}
    countries.forEach(_country => {
        _countries[_country.name] = []
    })
    return _countries
}

export async function getCapitalByCountryName(countryName) {
    return cities[countryName]
}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}