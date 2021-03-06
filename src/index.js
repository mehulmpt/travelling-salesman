import p5 from 'p5'
import Chart from 'chart.js'

const width = window.innerWidth / 2
const height = window.innerHeight

let radius = Math.min(width / 2, height / 2) - 50
let angleToMove = randomAngle()
let cities = []
let cityCount = 70
let m = 50
let T = 1 / cityCount
let frames = 20
let alphaVal = 0.3

let modVal = 100

let circularPoints = false
let tours = []
let globalTrialCounter = 0

let cityQueues = []
let chart
let chartData = []
let h1 = document.getElementById('optimum-dist')
let minTourText = document.getElementById('mintourtext')

function randomAngle() {
	return Math.random() * 2 * Math.PI
}

function getRandomPoint(minX, maxX, minY, maxY) {
	const x = Math.floor(Math.random() * (maxX - minX + 1)) + minX
	const y = Math.floor(Math.random() * (maxY - minY + 1)) + minY
	return [x, y]
}

function setup() {
	let myCanvas = createCanvas(width, height)
	myCanvas.parent('p5')
	//	boot()
	const ctx = document.getElementById('chart').getContext('2d')

	chart = new Chart(ctx, {
		type: 'line',
		data: {
			//labels: [0,1,2,3],
			datasets: [{
				fill: false,
				label: "data",
				backgroundColor: 'red',
				borderColor: 'rgb(53,53,53)',
				data: chartData
			}]
		},
		options: {
			legend: {
				display: false
			},
			tooltips: {
				enabled: false
			},
			scales: {
				yAxes: [{
					scaleLabel: {
						display: true,
						labelString: 'Tour length'
					},
					type: 'linear',
					ticks: {
						beginAtZero: false,
						//		stepSize: .1,
						//		maxTicksLimit: 5
						//autoSkip: true,
						//suggestedMin: 3
					},
				}],
				xAxes: [{
					scaleLabel: {
						display: true,
						labelString: 'Iterations'
					},
					type: 'linear',
					position: 'bottom',
					ticks: {
						beginAtZero: true
					}
				}]
			},
			responsive: true,
			elements: {
				line: {
					tension: 0 // disables bezier curves
				}
			},
			animation: {
				duration: 0 // general animation time
			},
			hover: {
				animationDuration: 0 // duration of animations when hovering an item
			},
			responsiveAnimationDuration: 0 // animation duration after a resize
		}
	})
}

function boot() {
	let circleCenterX = width / 2
	let circleCenterY = height / 2

	strokeWeight(4)
	stroke(53, 53, 53)

	cities = []
	cityQueues = []

	while (chartData.length > 0) chartData.pop()
	if (chart) chart.update()

	for (let i = 0; i < cityCount; i++) {

		let cityX, cityY

		// Calculate random position for city points
		if (circularPoints) {
			cityX = circleCenterX + radius * Math.cos(angleToMove)
			cityY = circleCenterY + radius * Math.sin(angleToMove)
		} else {
			[cityX, cityY] = getRandomPoint(50, width - 50, 50, height - 50)
		}



		const city = {
			id: i,
			x: cityX,
			y: cityY,
			distances: []
		}

		cities.push(city)

		angleToMove = randomAngle()

		cityQueues[i] = []
	}

	for (let i = 0; i < cities.length; i++) {

		const city1 = cities[i]

		for (let j = 0; j < cities.length; j++) {

			if (i == j) { // if same city, do not add it

				city1.distances.push({
					with: -1,
					strength: 0,
					distance: 0
				})

				continue

			}

			// TODO: Optimize using hashmap
			// get next city
			const city2 = cities[j]

			// calculate distance of city with the next city

			const width = document.getElementById('p5').offsetWidth
			const height = document.getElementById('p5').offsetHeight

			//debugger
			const deltaX = (city1.x - city2.x) / width
			const deltaY = (city1.y - city2.y) / height

			const distance = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2))

			console.log(`Distance between City ${i + 1} and ${j + 1} is ${distance}`)

			city1.distances.push({
				with: j,
				strength: Math.exp(-distance / T),
				distance
			})
		}
	}


	for (let cIndex = 0; cIndex < cities.length; cIndex++) {

		const currentCity = cities[cIndex]

		// Creating prioritylist for currentCity
		const priorityList = createPriorityList(currentCity)
		cityQueues[cIndex] = priorityList

	}

	//console.log(cityQueues)
	//console.log(cities[0])

	frameRate(frames)
}

let count = 0
let minTourLength = Infinity
let minTour

function draw() {

	clear()
	strokeWeight(1)
	stroke(0, 0, 0)

	const cityIndex = Math.floor(Math.random() * cities.length)
	const tour = getTour(cityIndex)

	tours.push(tour)

	if (tours.length > m) {
		tours.shift()
	}


	const activeTourLength = getTourLength(tour)

	if (activeTourLength < minTourLength) {
		minTourLength = activeTourLength
		minTour = tour
		minTourText.innerText = tour.join('->')
	}

	//console.log(activeTourLength)
	h1.innerText = `Current Distance: ${activeTourLength}`

	if (globalTrialCounter % modVal == 0) {
		chartData.push({
			x: globalTrialCounter,
			y: activeTourLength
		})
	}

	++globalTrialCounter

	chart.update()

	tours.forEach(t => {
		//console.log(t)
		const len = getTourLength(t)
		//console.log(`Tour length = ${len}`)
		for (let i = 1; i <= t.length; i++) {
			const currentCity = cities[t[i % t.length]]
			const prevCity = cities[t[(i - 1) % t.length]]

			const elem1 = currentCity.distances.find(elem => elem.with === prevCity.id)
			elem1.strength = elem1.strength * Math.exp(-alphaVal * (len - activeTourLength) / m)

			const elem2 = prevCity.distances.find(elem => elem.with === currentCity.id)
			elem2.strength = elem2.strength * Math.exp(-alphaVal * (len - activeTourLength) / m)

		}
	})

	drawTour(tour)
	drawTour(minTour, 'min')

	cities.forEach((city, i) => {
		//console.log(x, y)

		ellipse(city.x, city.y, 10)
		textSize(20)
		strokeWeight(1)
		stroke(0, 0, 0)
		text(i, city.x + 10, city.y + 10)

		cityQueues[i] = createPriorityList(city)
	})

	//	console.log(tours)
	//	console.log(tour1)
}

function getTourLength(tour) {
	let distance = 0
	for (let i = 1; i <= tour.length; i++) {
		const nextCity = cities[tour[i % tour.length]]
		const prevCity = cities[tour[(i - 1) % tour.length]]
		const d = getCityDistance(prevCity, nextCity)
		distance += d
	}
	return distance
}

function getCityDistance(c1, c2) {
	return c1.distances.find(elem => elem.with == c2.id).distance
}

function drawTour(tour, type) {
	let prevCoordinates = [cities[tour[0]].x, cities[tour[0]].y]


	strokeWeight(4)
	stroke(53, 53, 53)
	//ellipse(...prevCoordinates, 10)

	if (type === 'min') {
		stroke(255, 122, 122)
	}

	for (let i = 1; i <= tour.length; i++) {
		let currentCoordinates = [cities[tour[i % tour.length]].x, cities[tour[i % tour.length]].y]
		line(...prevCoordinates, ...currentCoordinates)
		prevCoordinates = currentCoordinates
	}
}

// TODO: Optimize it by using previously available PL 
function createPriorityList(currentCity) {
	const queue = []
	const cityDistSums = [currentCity.distances[0].strength]

	const selfIndex = currentCity.distances.findIndex(elem => elem.with === -1)

	for (let i = 1; i < currentCity.distances.length; i++) {
		cityDistSums[i] = cityDistSums[i - 1] + currentCity.distances[i].strength
	}

	const nextIndex1 = getProbablisticIndex(cityDistSums, selfIndex)
	const nextIndex2 = getProbablisticIndex(cityDistSums, selfIndex, nextIndex1)

	const nextCity1 = nextIndex1 === -1 ? -1 : currentCity.distances[nextIndex1].with
	const nextCity2 = nextIndex2 === -1 ? -1 : currentCity.distances[nextIndex2].with


	//	console.log(`Placing ${nextIndex1} and ${nextIndex2} on top. Current index: ${selfIndex}`)

	/*
	// ! Don't want -1 (that is the node itself -> would blow up)
	if(nextCity2 == -1) {
		console.log(`Hit current city. Mitigating it`)
		nextCity2 = currentCity.distances[nextIndex2 - 1 > 0 ? nextIndex2 - 1 : nextIndex2 + 1].with 
	}
*/

	//debugger
	const remainingCities = currentCity.distances.filter(city => !(city.with == nextCity1 || city.with == nextCity2 || city.with == -1)).map(city => city.with)
	//debugger
	const finalCities = remainingCities.map(t => currentCity.distances[t]).sort((a, b) => {
		//	debugger
		if (a.strength > b.strength) return -1
		return 1
	})

	if (nextCity1 !== -1) {
		queue.push(nextCity1)
	}
	if (nextCity2 !== -1 && nextIndex1 !== nextIndex2) {
		queue.push(nextCity2)
	}



	// queue.push(nextCity1, nextCity2)

	//console.table(finalCities)

	finalCities.forEach(city => {
		queue.push(city.with)
	})


	if (nextIndex2 === -1) {
		// the stack would've blown up probably
		const one = queue[0]
		const two = queue[1]
		if (Math.random() > 0.5) {
			queue[1] = one
			queue[0] = two
		}
	}

	return queue
}

let stackblowerIndex = 0

function getProbablisticIndex(distances, ...except) {
	const randomNumber = Math.random() * distances[distances.length - 1]
	let index = find(distances, randomNumber)

	//debugger

	//	console.warn(except, index)

	if (!except.includes(index)) {
		stackblowerIndex = 0
		return index
	}

	if (index === except[0]) {
		stackblowerIndex = 0
		return index - 1 > 0 ? index - 1 : index + 1
	}

	/*if (index === except[0]) { // selfIndex
		stackblowerIndex = 0
		return index - 1 >= 0 ? index - 1 : index + 1
	}*/

	if (stackblowerIndex === 500) {
		stackblowerIndex = 0
		console.error(`Stack will blow up recursively`)
		return -1
	}

	//console.log(`Incrementing stackblower`)
	stackblowerIndex++

	return getProbablisticIndex(distances, ...except)
	/*{
		// TODO: Statistically better alternative? (blows up on max call stack on big ns)
		index = except - 1 >= 0 ? except - 1 : except + 1
	}*/

}

function getTour(cityIndex) {
	let route = []
	let travelled = []
	//travelled[cityIndex] = true

	function computeTour(subcityIndex) {

		if (travelled[subcityIndex] === true) return false

		travelled[subcityIndex] = true
		const priorityQueue = cityQueues[subcityIndex]

		let index = 0
		while (index < priorityQueue.length) {
			let c = priorityQueue[index++]

			const res = computeTour(cities[c].id)
			if (res === true) {
				// this city was found
				route.push(c)
				computeTour(cities[c].id)
				break
			}
		}
		return true
	}

	computeTour(cityIndex)
	route.push(cityIndex)
	return route.reverse()//.join('->')
}

function find(array, num) {
	for (var i = 0; i < array.length; i++) {
		if (array[i] < num) continue
		break
	}
	return i
}

/*
function find(array, x) {
	let start = 0
	let end = array.length - 1
	let mid
	while (start <= end) {
		mid = Math.floor((start + end) / 2);
		if (array[mid] < x)
			start = mid + 1
		else
			end = mid - 1
	}
	return mid
}*/

function freezeControls() {
	console.log('Controls freezed')
	document.getElementById('startbtn').disabled = true
	document.getElementById('stopbtn').disabled = false
}

function unfreezeControls() {
	console.log('Controls unfreezed')
	document.getElementById('startbtn').disabled = false
	document.getElementById('stopbtn').disabled = true
}

function start() {
	window.draw = draw
	minTourText.innerText = ''
	minTourLength = Infinity
	minTour = null
	cityCount = parseInt(document.getElementById('citycount').value, 10)
	T = 1 / cityCount
	frames = parseFloat(document.getElementById('frames').value, 10)
	alphaVal = parseFloat(document.getElementById('alphaVal').value, 10)
	modVal = parseFloat(document.getElementById('readingx').value, 10)
	m = parseFloat(document.getElementById('mVal').value, 10)
	tours = []
	freezeControls()
	globalTrialCounter = 0
	clear()
	boot()
	loop()
}

function setCheck() {
	circularPoints = this.checked
}

function stop() {
	window.draw = function () { }
	noLoop()
	//clear()
	unfreezeControls()
}

document.getElementById('startbtn').addEventListener('click', start, false)
document.getElementById('stopbtn').addEventListener('click', stop, false)
document.getElementById('iscircle').addEventListener('change', setCheck, false)

window.setup = setup

if (module && module.hot) module.hot.accept()