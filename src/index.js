import p5 from 'p5'

const { innerWidth: width, innerHeight: height } = window

let radius = 200
let angleToMove = randomAngle()
let cities = []
let cityCount = 5
let T = 1/cityCount

let cityQueues = []

function setup() {
	let myCanvas = createCanvas(width, height)
	myCanvas.parent('p5')
	let circleCenterX = width/2
	let circleCenterY = height/2

	ellipse(circleCenterX, circleCenterY, 2*radius)

	for(let i=0;i<cityCount;i++) {

		const cityX = circleCenterX + radius*Math.cos(angleToMove)
		const cityY = circleCenterY + radius*Math.sin(angleToMove)

		const city = {
			id: i,
			x: cityX,
			y: cityY,
			distances: []
		}

		cities.push(city)

		ellipse(cityX, cityY, 10)
		angleToMove += 1
		cityQueues[i] = []
	}

	for(let i=0;i<cities.length;i++) {
		const city1 = cities[i];
		for(let j=0;j<cities.length;j++) {
			if(i == j) continue
			const city2 = cities[j];
			const distance = dist(city1.x, city1.y, city2.x, city2.y) / 1000 // * normalizing distance for suitable exponent values
			// TODO: Make sure to keep city distances in sync
			city1.distances.push({
				with: j,
				strength: Math.exp(-distance/T)
			})
		}
	}


	const firstCity = cities[0]

	const cityDistSums = [firstCity.distances[0].strength]

	for(let i=1;i<firstCity.distances.length;i++) {
		cityDistSums[i] = cityDistSums[i-1] + firstCity.distances[i].strength
	}

	const nextIndex1 = getProbablisticIndex(cityDistSums)
	const nextIndex2 = getProbablisticIndex(cityDistSums, nextIndex1)

	const nextCity1 = firstCity.distances[nextIndex1].with
	const nextCity2 = firstCity.distances[nextIndex2].with

	//debugger
	const remainingCities = firstCity.distances.filter(city => !(city.with == nextCity1 || city.with == nextCity2)).map(city => city.with)

	cityQueues[0].push(nextCity1, nextCity2)
	console.log(remainingCities)
	console.log(cityQueues)
	console.log(cities)
}

function getProbablisticIndex(distances, except) {
	const randomNumber = Math.random() * distances[distances.length - 1]	
	const index = find(distances, randomNumber)
	if(index == except) index = getProbablisticIndex(distances, except)
	return index
}

// TODO: Make it binary search
function find(array, num) {
	for(var i=0;i<array.length;i++) {
		if(array[i] < num) continue
		break
	}
	return i
}

function randomAngle() {
	return Math.floor(Math.random() * 10) + 1
}


window.setup = setup