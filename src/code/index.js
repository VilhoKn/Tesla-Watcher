const teslaInventory = require('tesla-inventory')
const path = require('path')
const axios = require('axios')
const fs = require("fs")

const models = ["s", "3"]
const countries = ["de", "fi"]

const countryCodeMap = {
	"de": "Saksassa",
	"fi": "Suomessa"
}

function checkTesla(model, country) {
	const promise = teslaInventory(country, {
		model: model,
		condition: 'used'
	})

	return promise
}

function notify(model, country, VIN) {
	previousCars = JSON.parse(fs.readFileSync(path.join(__dirname, '../files/previousCars.json')).toString())
	fs.writeFileSync(path.join(__dirname, '../files/previousCars.json'), JSON.stringify([...previousCars, VIN]), (err) => {if (err) throw err;})

	axios.post("https://monkeman.pythonanywhere.com/api/tesla", {model, country})
}

function checkTeslas() {

	previousCars = JSON.parse(fs.readFileSync(path.join(__dirname, '../files/previousCars.json')).toString())

	for(i of models) {
		for(j of countries) {
			const promise = checkTesla(i, j)
			promise.then(results => {
				if(results.length === 0) return
				for(k of results) {
					if (!previousCars.includes(k.VIN)) {
						notify(i.toUpperCase(), countryCodeMap[k.CountryCode.toLowerCase()], k.VIN)
					}
				}
			} )
		}
	}
}

checkTeslas()





