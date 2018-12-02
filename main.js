const FONT_FACE = 'PICO-8'
const FONT_SIZE = 16
const FONT      = FONT_SIZE + 'px ' + FONT_FACE


const STATS = {
	health      : 50,
	family      : 50,
	mistress    : 50,
	dog         : 50,
	finances    : 50,
	employees   : 50,
	customers   : 50,
	investors   : 50,
	creditors   : 50,
	regulators  : 50,
	journalists : 50,
	roberto     : 50,
};


let currentCard = null
let selection   = 'yes'
let gameOver    = null


const PG = playground({
  width     : 1280,
  height    : 720,
  smoothing : false,

  create : function() {
    PG.loadData('cards')
    PG_FONT = PG.loadFont(FONT_FACE)
  },

  ready : function() {
  },

  step : function(dt) {
	if (!currentCard && !gameOver) {
		currentCard = getRandomCard()
	}
  },

  render : function() {
	PG.layer.clear('#000')

	const statsArray = Object.keys(STATS)
	for (let i = 0; i < statsArray.length; i++) {
		const stat = statsArray[i];
		let colour
		if (STATS[stat] > 69)
			colour = '#0f0'
		else if (STATS[stat] > 30)
			colour = '#ff0'
		else
			colour = '#f00'

		print(`${stat}`, 30, 30 + i * 35, colour)
		PG.layer.strokeStyle(colour)
		PG.layer.strokeRect(230, 35 + i * 35, 100 * 10, 10)
		PG.layer.fillStyle(colour)
		PG.layer.fillRect(230, 35 + i * 35, STATS[stat] * 10, 10)

		if (currentCard) {
			print(`${currentCard.description}`, 30, 500, '#999')

			print('yes', 500, 650, selection === 'yes' ? '#ff0' : '#666')
			print('no',  600, 650, selection === 'no'  ? '#ff0' : '#666')

			PG.layer.fillStyle('#ff0')
			if (selection === 'yes')
				PG.layer.fillRect(500, 676, 45, 5)
			else
				PG.layer.fillRect(600, 676, 32, 5)
		}
		else if (gameOver === 'win') {
			print('you win!', 600, 500, '#0f0')
		}
		else if (gameOver === 'lose') {
			print('you lose!', 600, 500, '#f00')
		}

		if (gameOver) {
			print('press space/enter to play again', 420, 560, '#666')
		}
	}
  },

  keyup : function(event) {
    if (event.key === 'left') selection = 'yes'
    if (event.key === 'right') selection = 'no'
	if (event.key === 'space' || event.key === 'enter') {

		if (gameOver) {
			initGame();
		}

		// apply card
		for (const stat in currentCard[selection]) {
			STATS[stat] += currentCard[selection][stat];

			// check win/lose condition
			if (STATS[stat] <= 0) {
				STATS[stat] = 0
				gameOver = 'lose'
			}

			if (STATS[stat] >= 100) {
				STATS[stat] = 100

				if (gameOver != 'lose')
					gameOver = 'win'
			}
		}

		currentCard = null;
	}
  }
})

function initGame() {
	for (const stat in STATS) {
		STATS[stat] = 50;
	}

	currentCard = null
	gameOver    = null
}

function getRandomCard() {
	if (!PG.data.cards) {
		return;
	}

	const index = Math.floor(Math.random() * Math.floor(PG.data.cards.length));
	return PG.data.cards[index];
}

function print(text, x, y, colour) {
  PG.layer.fillStyle(colour)
  PG.layer.font(FONT)
  PG.layer.fillText(text, x, y)
}
