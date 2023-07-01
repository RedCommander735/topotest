import countries from './world.json'
import data from './capital_cities.json';

const cities: Record <string, string> = data as Record <string, string> ;

export function validate_country(name: string) {
    for (let i = 0; i < countries.length; i++) {
        const country = countries[i];
        if (country.name == capitalize(name)) {
            return country.name;
        }
    }
    return false;
}

export function gen_empty_object(): Record <string, string[][]> {
    let _countries: Record <string, string[][]> = {}
    countries.forEach((_country: { id: number, alpha2: string, alpha3: string, name: string }) => { 
        _countries[_country.name] = [] 
    })
    return _countries
}

export async function getCapitalByCountryName(countryName: string): Promise <string> {
    return cities[countryName]
}

export function getCodeByCountryName(name: string) {
    for (let i = 0; i < countries.length; i++) {
        const country = countries[i];
        if (country.name == capitalize(name)) {
            return country.alpha2;
        }
    }
}

export function getCountryNameByCode(code: string) {
    for (let i = 0; i < countries.length; i++) {
        const country = countries[i];
        if (country.alpha2 == code.toLowerCase()) {
            return country.name;
        }
    }
}

function capitalize(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
}