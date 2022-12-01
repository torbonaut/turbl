/**
 * Sounds Class - static methods to play sounds
 */
class GameSounds {
    // define audio sources with volume parameter
    static #sounds = {
        'keystroke': 'https://cdn.freesound.org/previews/352/352501_269279-lq.mp3|1',
        'error': 'https://cdn.freesound.org/previews/44/44395_485825-lq.mp3|1',
        'delete': 'https://cdn.freesound.org/previews/366/366105_6687700-lq.mp3|0.1',
        'won': 'https://cdn.freesound.org/previews/270/270333_5123851-lq.mp3|1',
        'lost': 'https://cdn.freesound.org/previews/652/652328_13478074-lq.mp3|1',
    }
    // play method for the sounds
    static play = (soundType) => {
        // get the url and volume from the sounds object
        const soundData = GameSounds.#sounds[soundType].split('|');
        // create new audio element
        let sound = new Audio(soundData[0]);
        // set the corresponding volume
        sound.volume = soundData[1];
        // and play the sound
        sound.play();
    }
}

/**
 * Messages Class - static methods to display messages
 */
class GameMessages {
    // define all game messages
    static #messages = {
        'start': 'Enter a 5 letter word for a first guess.',
        'confirm': 'Confirm word by pressing Enter or correct word with backspace.',
        'enterword': 'Enter a 5 letter word.',
        'noexist': 'Word does not exist.',
        'lost': 'You lost.  <a>Play again?</a> The word was: ',
        'won': 'You won. You THE hero! <a>Play again?</a>'
    }
    // method to display messages
    static showMessage = (message, extra = '') => document.getElementById('message').innerHTML = this.#messages[message] + extra;
}

/**
 * Keyboard Handler Class - enables keyboard and screen keyboard inputs, plays keypress sounds
 */
class KeyboardHandler {
    // keyboard layout
    static #keyboard = [
        'q w e r t z u i o p',
        'a s d f g h j k l',
        'y x c v b n m backspace enter',
    ];

    // key buttons
    static #keyButtonElements = [];
    // key press call back
    static keyPressCallback = (key) => {};

    // initialize the keyboard handler
    static init = (callbackFn) => {
        // create the screen keyboard
        this.createScreenKeyboard();
        // get all key buttons
        this.#keyButtonElements = Array.from(
            document.querySelectorAll('.keyboard > .row > button')
        );
        // screen keyboard listener
        this.#addScreenKeyboardListener();
        // keyboard listener
        this.#addKeyboardListener();
        // attach the callback function, called on valid keypresses
        this.keyPressCallback = callbackFn;
    };

    static clearKeyboard() {
        this.#keyButtonElements.forEach((keyButton) => {
            if (keyButton.dataset.key.length === 1) {
                keyButton.className = '';
            }
        });
    }

    // trigger callback and add sounds to screen keyboard
    static #addScreenKeyboardListener = () => {
        this.#keyButtonElements.forEach((key) => {
            // get key from elements data attribute
            let pressedKey = key.dataset.key;
            // add click listener to element
            key.addEventListener('click', () => {
                // trigger keypress callback
                this.keyPressCallback(pressedKey);
            });
        });
    };

    // add key up eventlistener to enable keyboard entry next to screen keyboard
    // and to simulate click key button with sound
    static #addKeyboardListener = () =>
        document.addEventListener('keyup', (keyup) => {
            const key = keyup.key.toLowerCase();

            // check if key is in keyboard layout
            if (this.#keyboard.join(' ').includes(key)) {
                const element = document.querySelector(
                    'button[data-key="' + key + '"]'
                );
                if (element) {
                    element.click();
                    element.classList.add('pressed');
                    setTimeout(() => element.classList.remove('pressed'), 400);
                }
            } else {
                GameSounds.play('error');
            }
        });
    
    // generate screen keyboard HTML
    static createScreenKeyboard() {
        // get the element to append the keyboard to
        const keyboardEl = document.querySelector('.keyboard');
        // loop through keyboard layout rows
        this.#keyboard.forEach(row => {
            // create a row
            const rowEl = document.createElement('div');
            // and add the row class to it
            rowEl.classList.add('row');
            // loop through the keys of a keyboard row
            row.split(' ').forEach(key => {
                // create a button
                const keyEl = document.createElement('button');
                // and set the data attribute to the key
                keyEl.setAttribute('data-key', key);
                // set the key as button text
                switch (key) {
                    // print special character / html entity and css class for backspace
                    case 'backspace':
                        keyEl.innerHTML = '&#9003;';
                        keyEl.classList.add('delete');
                        break;
                    // print special character / html entity and css class for enter
                    case 'enter':
                        keyEl.innerHTML = '&#9166;';
                        keyEl.classList.add('enter');
                        break;
                    // print key, no special css class needed
                    default:
                        keyEl.innerHTML = key;
                }
                // append button to row
                rowEl.appendChild(keyEl);
            });
            // add row of buttons to keyboard
            keyboardEl.appendChild(rowEl);
        });
    }    
}

/**
 * Game class - holds game logic
 */
class Turbl {
    // indicator if game is running
    #gameStarted = false;
    // indicator if game has ended
    #gameEnded = false;
    // stores the current row of characters
    #row = 1;
    // stores the word of the current row entered by the user
    #currentWord = '';
    // stores the word to guess
    #turbl = '';
    // prevent keyboard input
    #canUseKeyboard = true;

    // initialize the game: create game board, initialize keyboard handler and reset game
    constructor() {         
        // initialize game
        this.reset();
        // initialize keyboard handler, create screen keyboard HTML and set callback
        KeyboardHandler.init((key) => this.gameKeyHandler(key));          
    }

    // reset the game to initial state
    reset() {
        // create new keyboard
        KeyboardHandler.clearKeyboard();
        // we start the game
        this.#gameStarted = true;
        // and it is not ended of course
        this.#gameEnded = false;
        // we can use the keyboard
        this.#canUseKeyboard = true;
        // reset the row to row 1
        this.#row = 1;
        // clear the current word, initially empty
        this.#currentWord = '';
        // we choose a random word from the word list
        this.#turbl = words[Math.floor(Math.random() * words.length)];
        // clear the game board
        document.getElementById('game_board').innerHTML = '';
        // generate game board HTML
        this.generateGameBoard();        
        // we show the cursor
        this.showCursor();
        // and show a game start message
        GameMessages.showMessage('start');        
    }

    gameKeyHandler(key) {
        // dont check keys if game is not started or ended or pressed key is enter with word length < 5
        if (!this.#canUseKeyboard || !this.#gameStarted || this.#gameEnded || (this.#currentWord.length < 5 && key === 'enter')) {
            GameSounds.play('error');
            return;
        }

        // remove character if backspace is pressed
        if (key === 'backspace') {
            if (this.#currentWord.length > 0 && this.#currentWord.length <= 5) {
                if (this.#currentWord.length === 5) {
                    document.querySelector(`#game_board > div:nth-child(${this.#row})`).classList.remove('full');                    
                    // update game message
                    GameMessages.showMessage('enterword');
                } else {
                    this.hideCursor();
                }
                GameSounds.play('delete');
                document.querySelector(`#game_board > div:nth-child(${this.#row}) > div:nth-child(${this.#currentWord.length}) > span`).innerHTML = '';
                this.#currentWord = this.#currentWord.slice(0, -1);
                this.showCursor();
            } else {
                GameSounds.play('error');
            }
            return;
        }

        // enter is only allowed if word length is 5
        if (this.#currentWord.length === 5 && key === 'enter') {
            // check if word exists
            if (this.checkIfWordExists(this.#currentWord)) {
                // check if we have a winner or show the user which characters are present and if position is correct also
                if (this.processCurrentWord()) {
                    // we have a winner
                    this.#gameEnded = true;
                    // add the winner class to the game board to show some fancy winner animation
                    document.querySelector(`#game_board > div:nth-child(${this.#row})`).classList.add('winner');
                    // show the winner message
                    GameMessages.showMessage('won');
                    // play the winner sound
                    GameSounds.play('won');
                    // and link the included link to reset the game
                    document.querySelector('#message a').addEventListener('click', () => this.reset());
                } else {
                    // remove full class from current row
                    document.querySelector(`#game_board > div:nth-child(${this.#row})`).classList.remove('full');
                    if (this.#row === 5) { 
                        // game is over
                        this.#gameEnded = true;
                        // show game lost message
                        GameMessages.showMessage('lost', this.#turbl);
                        // and link the included link to reset the game
                        document.querySelector('#message a').addEventListener('click', () => this.reset());
                        // play the lost sound
                        GameSounds.play('lost');
                    } else {
                        // we start the next row
                        this.#row++;
                        // with an empty word - try again
                        this.#currentWord = '';
                        // show cursor again
                        this.showCursor();
                    }
                }

            } else {
                // word doesnt exist in our list
                // disable keyboard entry
                this.#canUseKeyboard = false;
                // add css class to trigger css error animation
                document.querySelector(`#game_board > div:nth-child(${this.#row})`).classList.add('error');
                // play error sound
                GameSounds.play('error');
                // show message that the word does not exist
                GameMessages.showMessage('noexist');
                // remove error class after 3 seconds and restore message
                setTimeout(() => {
                    document.querySelector(`#game_board > div:nth-child(${this.#row})`).classList.remove('error');
                    GameMessages.showMessage('confirm');
                    // enable keyboard again
                    this.#canUseKeyboard = true;
                }, 3000);
            }
            return;
        }         

        // we can only expect letters now. add letter to current word until length is 5
        if (this.#currentWord.length < 5) {
            // play keystroke sound
            GameSounds.play('keystroke');
            // hide cursor
            this.hideCursor();
            // add char to current word
            this.#currentWord += key;
            // add charactor to game board
            document.querySelector(`#game_board > div:nth-child(${this.#row}) > div:nth-child(${this.#currentWord.length}) > span`).innerHTML = key;


            if (this.#currentWord.length === 5) {
                // show full row
                document.querySelector(`#game_board > div:nth-child(${this.#row})`).classList.add('full');
                // update game message
                GameMessages.showMessage('confirm');
            } else {
                // show the cursor again until row is filled
                this.showCursor();
            }

            return;
        } else {
            // play error sound
            GameSounds.play('error');
        }
    }
    
    // show the cursor at the current position
    showCursor() {
        document.querySelector(`#game_board > div:nth-child(${this.#row}) > div:nth-child(${this.#currentWord.length+1})`).classList.add('cursor');
    }

    // hide the cursor at the current position
    hideCursor() {
        document.querySelector(`#game_board > div:nth-child(${this.#row}) > div:nth-child(${this.#currentWord.length+1})`).classList.remove('cursor');
    }    

    // check if word exists in our list
    checkIfWordExists(word) {
        return words.indexOf(word) > -1;
    }

    // process current word and show if character is present and if position is correct
    processCurrentWord() {        
        // loop through all characters of the current word
        for (let i = 0; i < this.#currentWord.length; i++) {
            // if character on position i in current word is present in the word we are looking for
            if (this.#turbl.includes(this.#currentWord[i])) {
                // we know character is in the word we are looking for, but is it also on the correct position?
                if (this.#turbl[i] === this.#currentWord[i]) {
                    // we have a perfect match!
                    // add class matched to the character in the game board
                    document.querySelector(`#game_board > div:nth-child(${this.#row}) > div:nth-child(${i + 1})`).classList.add('matched');
                    // add class matched to the character in the keyboard
                    document.querySelector('.keyboard > div.row > button[data-key="' + this.#currentWord[i] + '"]').classList.add('matched');
                // no, not on the correct position, mark as found
                } else {
                    // add class found to the character in the game board
                    document.querySelector(`#game_board > div:nth-child(${this.#row}) > div:nth-child(${i + 1})`).classList.add('found');
                    // add class found to the keyboard key
                    document.querySelector('.keyboard > div.row > button[data-key="' + this.#currentWord[i] + '"]').classList.add('found');
                }
            // character is not present in the word we are looking for
            } else {
                // add class missing to the character in the game board
                document.querySelector(`#game_board > div:nth-child(${this.#row}) > div:nth-child(${i + 1})`).classList.add('missing');
                // add class missing to the keyboard key
                document.querySelector('.keyboard > div.row > button[data-key="' + this.#currentWord[i] + '"]').classList.add('missing');
            }
        }

        // do we have a winner?
        if (this.#currentWord === this.#turbl) { 
            return true;
        }        

        // we did the processing, but we dont have a winner
        return false;
    }

    // generate the game HTML (5 rows with 5 characters each)
    generateGameBoard() {
        // generate game board
        for (let i = 0; i < 5; i++) {
            let row = document.createElement('div');
            row.classList.add('row');
            for (let j = 0; j < 5; j++) {
                let col = document.createElement('div');
                let span = document.createElement('span');
                col.appendChild(span);
                row.appendChild(col);
            }
            document.querySelector('#game_board').appendChild(row);
        }
    }
}

// start the game
const game = new Turbl();
