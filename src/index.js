import p5 from 'p5'
import Chart from 'chart.js'

const width = window.innerWidth/2
const height = window.innerHeight

let radius = 400
let angleToMove = 0 //randomAngle()
let cities = []
let cityCount = 10
let m = 50
let T = 1/cityCount
let frames = 60
const alpha = 0.3

let cityQueues = []
let chart
let chartData = []

function setup() {
	let myCanvas = createCanvas(width, height)
	myCanvas.parent('p5')
	let circleCenterX = width/2
	let circleCenterY = height/2
	

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

		angleToMove++

		cityQueues[i] = []
	}

	for(let i=0;i<cities.length;i++) {
		const city1 = cities[i];
		for(let j=0;j<cities.length;j++) {
			if(i == j) {
				city1.distances.push({
					with: -1,
					strength: 0,
					distance: 0
				})
				continue
			}
			const city2 = cities[j];
			const distance = dist(city1.x, city1.y, city2.x, city2.y) / 1000 // * normalizing distance for suitable exponent values
			// TODO: Make sure to keep city distances in sync
			city1.distances.push({
				with: j,
				strength: Math.exp(-distance/T),
				distance
			})
		}
	}


	for(let cIndex=0;cIndex<cities.length;cIndex++) {
		
		const currentCity = cities[cIndex]

		const priorityList = createPriorityList(currentCity)
		cityQueues[cIndex] = priorityList

	}

	console.log(cityQueues)
	console.log(cities[0])

	frameRate(frames)
	
	
	// chart

	const ctx = document.getElementById('chart').getContext('2d')

	chart = new Chart(ctx, {
		type: 'line',
		data: {
			//labels: [0,1,2,3],
			datasets: [{
				fill: false,
				label: "data",
				backgroundColor: 'black',
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
					ticks: {
						beginAtZero: true
					}
				}],
				xAxes: [{
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

function stopThis() {
	console.log(cities)
	noLoop()
}

const tours = []

let globalTrialCounter = 0

function draw() {
	clear()
	strokeWeight(2)
	stroke(0,0,0)
	let circleCenterX = width/2
	let circleCenterY = height/2

	//ellipse(circleCenterX, circleCenterY, 2*radius)

	
	const cityIndex = Math.floor(Math.random() * cities.length)
	const tour = getTour(cityIndex)
	tours.push(tour)
	if(tours.length > m) {
		tours.shift()
	}
	
	
	const activeTourLength = getTourLength(tour)
	//console.log(activeTourLength)
	++globalTrialCounter
	chartData.push({
		x: globalTrialCounter,
		y: activeTourLength
	})

	chart.update()

	tours.forEach(t => {
		//console.log(t)
		const len = getTourLength(t)
		//console.log(`Tour length = ${len}`)
		for(let i=1;i<=t.length;i++) {
			const currentCity = cities[t[i%t.length]]
			const prevCity = cities[t[(i-1)%t.length]]

			// TODO: Remove this redundancy
			const elem1 = currentCity.distances.find(elem => elem.with === prevCity.id)
			elem1.strength = elem1.strength * Math.exp(-alpha*(len - activeTourLength)/m)
			
			// TODO: ??????????????!!
			const elem2 = prevCity.distances.find(elem => elem.with === currentCity.id)
			elem2.strength = elem2.strength * Math.exp(-alpha*(len - activeTourLength)/m) 

			
			//	console.log(`Strength between ${currentCity.id} and ${prevCity.id} = ${elem1.strength}`)
		}
		if(activeTourLength - len < 0) {
			console.log(`Negatively rewarded tour => ${t} in favor of ${tour}`)
		}
	})

	cities.forEach((city, i) => {
		//console.log(x, y)
		
		ellipse(city.x, city.y, 10)
		textSize(20)
		text(i, city.x + 10, city.y + 10)

		cityQueues[i] = createPriorityList(city)
	})

//	console.log(tours)
//	console.log(tour1)
	drawTour(tour)
}

function getTourLength(tour) {
	let distance = 0
	for(let i=1;i<=tour.length;i++) {
		const nextCity = cities[tour[i%tour.length]]
		const prevCity = cities[tour[(i-1)%tour.length]]
		const d = getCityDistance(prevCity, nextCity)
		distance += d
	}
	return distance
}

function getCityDistance(c1, c2) {
	return c1.distances.find(elem => elem.with == c2.id).distance
}

function drawTour(tour) {
	let prevCoordinates = [cities[tour[0]].x, cities[tour[0]].y]
	strokeWeight(4)
	stroke(53,53,53)
	ellipse(...prevCoordinates, 10)
	
	for(let i=1;i<=tour.length;i++) {
		let currentCoordinates = [cities[tour[i%tour.length]].x, cities[tour[i%tour.length]].y]
		line(...prevCoordinates, ...currentCoordinates)
		prevCoordinates = currentCoordinates
	}
}

// TODO: Optimize it by using previously available prioritylist 
function createPriorityList(currentCity) {
	const queue = []
	const cityDistSums = [currentCity.distances[0].strength]

	for(let i=1;i<currentCity.distances.length;i++) {
		cityDistSums[i] = cityDistSums[i-1] + currentCity.distances[i].strength
	}

	const nextIndex1 = getProbablisticIndex(cityDistSums)
	const nextIndex2 = getProbablisticIndex(cityDistSums, nextIndex1)

	const nextCity1 = currentCity.distances[nextIndex1].with
	const nextCity2 = currentCity.distances[nextIndex2].with

	//debugger
	const remainingCities = currentCity.distances.filter(city => !(city.with  == nextCity1 || city.with == nextCity2 || city.with == -1)).map(city => city.with)
	//debugger
	const finalCities = remainingCities.map(t => currentCity.distances[t]).sort((a, b) => {
	//	debugger
		if(a.strength > b.strength) return -1
		return 1
	})
	queue.push(nextCity1, nextCity2)

	//console.table(finalCities)

	finalCities.forEach(city => {
		queue.push(city.with)
	})

	return queue
}

function getProbablisticIndex(distances, except) {
	const randomNumber = Math.random() * distances[distances.length - 1]	
	let index = find(distances, randomNumber)
	if(index == except) index = getProbablisticIndex(distances, except)
	return index
}

function extractNeighbourCities(city) {
	return city.distances.map(c => c.with).filter(c => c !== -1)
}

function getTour(cityIndex) {
	let route = []
	let travelled = []
	//travelled[cityIndex] = true

	function computeTour(subcityIndex) {
		
		if(travelled[subcityIndex] === true) return false

		travelled[subcityIndex] = true
		const priorityQueue = cityQueues[subcityIndex]

		let index = 0
		while(index < priorityQueue.length) {
			const c = priorityQueue[index++]
			const res = computeTour(cities[c].id)
			if(res === true) {
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

// TODO: Make it binary search
function find(array, num) {
	for(var i=0;i<array.length;i++) {
		if(array[i] < num) continue
		break
	}
	return i
}


window.setup = setup
window.draw = draw
window.stopThis = stopThis