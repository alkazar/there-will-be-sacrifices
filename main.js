const FONT_FACE = 'PICO-8'
const FONT_SIZE = 16
const FONT      = FONT_SIZE + 'px ' + FONT_FACE


const BAR_SIZE   = 1000
const GRAPH_FREQ = 2

const BARS = {
	profits      : { value :   0, rate :  1, multipliers : [] },
	family       : { value : 800, rate : -1, multipliers : [] },
	reputation   : { value : 800, rate : -1, multipliers : [] },
	productivity : { value : 800, rate : -1, multipliers : [] },
}

const barsArray = Object.keys(BARS)

const DAYS = 5
const INFINITY = 999999

const ACTIONS = {
	'day off' : [
		{ bar : 'profits',      value : -100 },
		{ bar : 'family',       value :  10 },
		{ bar : 'reputation',   value : -10 },
		{ bar : 'productivity', value : -5 },
	],
	'leave early' : [
		{ bar : 'profits',      value : -25 },
		{ bar : 'family',       value :  5 },
		{ bar : 'reputation',   value : -15 },
		{ bar : 'productivity', value : -2 },
	],
	'family vacation' : [
		{ bar : 'profits',      multiplier : { value : -2, duration : 7 * DAYS } },
		{ bar : 'family',       value :  25 },
		{ bar : 'reputation',   value : -10 },
		{ bar : 'productivity', value : 20 },
	],
	'employee raises' : [
		{ bar : 'profits',      multiplier : { value : -1.5, duration : INFINITY * DAYS } },
		{ bar : 'family',       value : 10 },
		{ bar : 'reputation',   value : 25 },
		{ bar : 'productivity', value : 5 },
	],
	'volunteer work' : [
		{ bar : 'family',       value : 10 },
		{ bar : 'reputation',   value : 10 },
		{ bar : 'productivity', value : -5 },
	],
	'employee recognition' : [
		{ bar : 'profits',      value : -200 },
		{ bar : 'reputation',   value :  15 },
		{ bar : 'productivity', value : -5 },
	],
	'layoffs' : [
		{ bar : 'profits',      multiplier : { value : 2.5, duration : INFINITY * DAYS } },
		{ bar : 'family',       value : -10 },
		{ bar : 'reputation',   value : -25 },
		{ bar : 'productivity', value : -5 },
	],
	'price increase' : [
		{ bar : 'profits',      multiplier : { value : 1.5, duration : INFINITY * DAYS } },
		{ bar : 'family',       value : -5 },
		{ bar : 'reputation',   value : -15 },
	],
	'overtime' : [
		{ bar : 'profits',      multiplier : { value : 2, duration : 2 * DAYS } },
		{ bar : 'family',       value : -40 },
		{ bar : 'reputation',   value :  5 },
		{ bar : 'productivity', value :  5 },
	],
}

const actionsArray = Object.keys(ACTIONS)
let selectedActionIndex = 0

const graph = { values : [], accruedTime : 0, nextValue : 0 }


let cooldown = 0

let time = 0

let gameOver = null

let lastBarMult = 1


function getAndUpdateMultiplier(bar, dt) {
	let negative = -1
	let positive =  1

	if (BARS[bar].multipliers.length === 0)
		return 1

	for (const multiplier of BARS[bar].multipliers) {
		if (multiplier.value > 0)
			positive *= multiplier.value
		else
			negative *= Math.abs(multiplier.value)

		// TODO: delete expired multiplier
		if (multiplier.duration <= 0)
			multiplier.value = 1
		else
			multiplier.duration -= dt
	}

	let result = positive
	if (negative !== -1)
		result = negative + positive

	return result
}

function drawProfitGraph(x, y, w, h) {
	PG.layer.strokeStyle('#666')
	PG.layer.strokeRect(x, y, w, h)
	PG.layer.strokeRect(x, y + h / 2, w, 1)
	print('0', x - 16, y + h / 2 - 8, '#666')

	for (let i = 0; i < graph.values.length; i++) {
		const value = graph.values[i]
		const gv = value / 100 * h / 2
		if (gv > 0)
			PG.layer.fillStyle('#0f0')
		else
			PG.layer.fillStyle('#f00')
			
		PG.layer.fillRect(x + i * GRAPH_FREQ, y + h / 2 - gv, GRAPH_FREQ, gv)
	}
}

function drawProfitTotal(x, y, w, h) {
	print('0', x - 16, y + h / 2 - 8, '#666')
	print('total profits', x - 70, y + h + 10, '#666')

	const value = BARS['profits'].value
	const gv = value / 1000 * h / 2
	if (gv > 0)
		PG.layer.fillStyle('#0f0')
	else
		PG.layer.fillStyle('#f00')
		
	PG.layer.fillRect(x, y + h / 2 - gv, w, gv)

	PG.layer.strokeStyle('#666')
	PG.layer.strokeRect(x, y, w, h)
	PG.layer.strokeRect(x, y + h / 2, w, 1)
}

const PG = playground({
  width     : 1280,
  height    : 720,
  smoothing : false,

  create : function() {
	PG.loadImage('background')
    PG.loadData('cards')
    PG_FONT = PG.loadFont(FONT_FACE)
  },

  ready : function() {
  },

  step : function(dt) {

	if (gameOver)
		return

	time += dt

	if (time / DAYS >= 111)
		gameOver = 'lose'

	cooldown -= dt

	if (cooldown < 0)
		cooldown = 0

	let posBarMult =  1
	let negBarMult = -1

	for(const bar of Object.keys(BARS)) {
		let  mult = getAndUpdateMultiplier(bar, dt)

		if (bar === 'profits') {
			mult += lastBarMult
		} else {
			const barMult = ((BARS[bar].value / 1000) * 6) - 3
			if (barMult < 0)
				negBarMult *= Math.abs(barMult)
			else
				posBarMult *= barMult
		}

		let rate = BARS[bar].rate * mult * dt * (1 + Math.random()*5)

		if (rate > 50 * dt)
			rate = 50 * dt
		
		if (rate < -50 * dt)
			rate = -50 * dt

		BARS[bar].value += rate

		if (BARS[bar].value > 1000) {
			BARS[bar].value = 1000

			if (bar === 'profits')
				gameOver = 'win'
		}

		if (bar === 'profits' && BARS[bar].value < -1000) {
			BARS[bar].value = -1000
			gameOver = 'lose'
		}

		if (bar !== 'profits' && BARS[bar].value < 0) {
			BARS[bar].value = 0
		}

		if (bar === 'profits') {
			graph.accruedTime += dt
			graph.nextValue += rate
			
			if (graph.accruedTime > GRAPH_FREQ) {
				graph.values.push(graph.nextValue)
				graph.accruedTime = 0
				graph.nextValue   = 0
			}
		}
	}

	lastBarMult = posBarMult + negBarMult
  },

  render : function() {
	PG.layer.drawImage(PG.images.background, 0, 0)

	print(`day ${1 + Math.floor(time / DAYS)}`, 350, 88, '#666')

	if (gameOver) {
		print(`you ${gameOver}!`, 570, 250, '#666')
		return
	}

	for (let i = 0; i < barsArray.length; i++) {
		const bar = barsArray[i];

		if (bar === 'profits')
			continue

		let colour
		if (BARS[bar].value > 699)
			colour = '#0f0'
		else if (BARS[bar].value > 300)
			colour = '#ff0'
		else
			colour = '#f00'

		print(`${bar}`, 735, 88 + i * 35, colour)
		PG.layer.strokeStyle(colour)
		PG.layer.strokeRect(350, 95 + i * 35, 350, 10)
		PG.layer.fillStyle(colour)
		PG.layer.fillRect(350, 95 + i * 35, BARS[bar].value / BAR_SIZE * 350, 10)
	}

	drawProfitGraph(350, 230, 550, 75)
	drawProfitTotal(790, 330, 50, 150)

	if (cooldown > 0)
		return

	for (let i = 0; i < actionsArray.length; i++) {
		const action = actionsArray[i]

		let colour = '#666'
		if (selectedActionIndex === i)
			colour = '#ff0'

		print(action, 350, 320 + i * 20, colour)
	}

  },

  keyup : function(event) {

	if (cooldown > 0)
		return

	if (event.key === 'up') {
		selectedActionIndex -= 1

		if (selectedActionIndex < 0)
			selectedActionIndex = 0
	}

	if (event.key === 'down') {
		selectedActionIndex += 1

		if (selectedActionIndex > actionsArray.length - 1)
			selectedActionIndex = actionsArray.length - 1
	}

	if (event.key === 'space' || event.key === 'enter') {
		const action = ACTIONS[actionsArray[selectedActionIndex]]

		// apply action
		for (let i = 0; i < action.length; i++) {
			const effect = action[i]

			if (effect.value)
				BARS[effect.bar].value += effect.value

			if (effect.multiplier) {
				const newMult = { value : effect.multiplier.value, duration : effect.multiplier.duration}
				BARS[effect.bar].multipliers.push(newMult)
			}
		}

		cooldown = 5
	}
  }
})

function print(text, x, y, colour) {
  PG.layer.fillStyle(colour)
  PG.layer.font(FONT)
  PG.layer.fillText(text, x, y)
}
