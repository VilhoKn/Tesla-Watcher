const teslaInventory = require('tesla-inventory')
const schedule = require('node-schedule')
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

function notify(model, country, VIN, price, year, color) {
	previousCars = JSON.parse(fs.readFileSync(path.join(__dirname, '../files/previousCars.json')).toString())
	fs.writeFileSync(path.join(__dirname, '../files/previousCars.json'), JSON.stringify([...previousCars, VIN]), (err) => {if (err) throw err;})

	const url = `https://www.tesla.com/${country}_${country.toUpperCase()}/${model}/order/${VIN}`
	model = model[1].toUpperCase()
	country = countryCodeMap[country]

	console.log(`Notified: ${model} ${country} ${price} ${year} ${color}`)
	axios.post("https://monkeman.pythonanywhere.com/api/tesla", {model, country, price, year, color, url})
}

function checkTeslas() {

	previousCars = JSON.parse(fs.readFileSync(path.join(__dirname, '../files/previousCars.json')).toString())

	for(i of models) {
		for(j of countries) {
			const promise = checkTesla(i, j)
			promise.then(results => {
				if(results.length === 0) return
				console.log(results.length, countryCodeMap[results[0].CountryCode.toLowerCase()], results[0].Model)
				for(k of results) {
					if (!previousCars.includes(k.VIN)) {
						const color = k.PAINT[0].toLowerCase().replace(/^./, k.PAINT[0][0].toUpperCase())
						notify(k.Model, k.CountryCode.toLowerCase(), k.VIN, k.Price, k.Year, color)
					}
				}
			} )
		}
	}
}

const rule = "*/15 * * * *"

const job = schedule.scheduleJob(rule, function(){
	console.log(`Ran check on ${new Date()}`)
	checkTeslas()
})

console.log(`Started check on ${new Date()}`)
checkTeslas()