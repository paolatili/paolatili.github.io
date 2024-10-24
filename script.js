const resultDisplay = document.querySelector('#value');
let displayedText = '0';
let addedPointToNumber = 0
let equalIsClicked = false
let displayedTextBeforeEqual = ''
let lastCharacterAdded = ''
let degreeAngle = false
let openBracket = 0

window.addEventListener("load", () => toggleDarkMode(getDarkModePreferences()));
window.addEventListener("keydown", async (event) => {
    const key = event.key;
    if (key >= '0' && key <= '9') {
        inputCharacter(key)
    } else if (key === '.' || key === ',' || key === 'Decimal') {
        inputCharacter('.')
    } else if (isOperator(key)) {
        inputCharacter(key)
    } else if (key === 'Backspace' || key === 'Delete') {
        eraseLastCharacter()
    } else if (key === 'Enter' || key === 'Return') {
        calcResult();
    } else if (key === 'Escape') {
        eraseAll()
    } else if ((event.ctrlKey || event.metaKey) && key === 'v') {
        const clipboardData = await navigator.clipboard.readText();
        console.log(await navigator.clipboard.readText())
        if (clipboardData) {
            const pastedText = clipboardData.toString();
            if (/^\d+$/.test(pastedText)) {
                displayedText += pastedText.replace(',', '.');
                updateDisplay();
            }
        }
    }
});

function inputCharacter(character, isNegative = false) {
    //check if the added character is a number
    if (isNumber(character) && isNumberAllowed(lastCharacterAdded)) {
        if (displayedText === '0' && character === '0') return;
        if (displayedText === '0') {
            displayedText = ''
        }
        if (displayedText !== '0' && equalIsClicked) {
            displayedText = ''
            resultDisplay.innerHTML = '0'
            equalIsClicked = false
        }
        if (isNegative) {
            displayedText += '(' + parseFloat(character) + ')'
            updateDisplay()
            return;
        }
        if(lastCharacterAdded === '0' && isNumber(character) && !isNumber(displayedText[displayedText.length - 2])) {
            eraseLastCharacter()
        }
        //using parseFloat as we will use this function to also add sin(x), tan(x) etc which might be floats.
        displayedText += parseFloat(character);
        lastCharacterAdded = character
        //adding the operator - checking if we already have added characters in the calculator
    } else if (isOperator(character) && isOperatorAllowed(character)) {
        if (character === '-' && displayedText === '0') displayedText = '';
        displayedText += `<span class='sign'>${character}</span>`;
        addedPointToNumber = 0
        lastCharacterAdded = character;
        //adding the operation
    } else if (isPoint(character) && isPointAllowed(character)) {
        //handle cases when multiple . are added to the floating point number - so for example 9.9.8 is not allowed
        if (addedPointToNumber === 1) return
        displayedText += '.';
        addedPointToNumber = 1
        lastCharacterAdded = character;

    } else if (character === '(' || character === ')' && displayedText !== '0') {
        if (displayedText === '0') displayedText = ''
        displayedText += `<span class='sign'>${character}</span>`;
        lastCharacterAdded = character;
    }
    updateDisplay();
}

function isOperatorAllowed(character) {
    return displayedText.length > 0 && (isNumber(lastCharacterAdded) || isClosingBracket(lastCharacterAdded)) || isOpenBracket(lastCharacterAdded) && character === '-'
        || equalIsClicked && isOperator(character)
}


function isPointAllowed() {
    return displayedText.length > 0 && isNumber(lastCharacterAdded)
}


function updateDisplay() {
    if (equalIsClicked) equalIsClicked = false
    document.querySelector('.operation').innerHTML = displayedText.length !== 0 ? displayedText : '0';
}

function calcResult() {
    if (openBracket !== 0) {
        showAlert('Please check brackets!')
        return;
    }
    let res = removeSpanTags(displayedText);
    if (res === '') res = 0 //handling the case when user didn't input anything
    //if the user entered an operator but not a number after, then don't perform calculations
    if (checkIfLastIsOperator(res)) {
        showInvalidInputAlert()
        return
    }

    res = eval(res);
    if (res === undefined) res = 'error';
    equalIsClicked = true;
    displayedTextBeforeEqual = displayedText
    displayedText = parseFloat(res.toFixed(10)).toString();
    resultDisplay.innerHTML = parseFloat(res.toFixed(10)).toString();
}

function eraseAll() {
    displayedText = '0'
    resultDisplay.innerHTML = '0';
    addedPointToNumber = 0
    openBracket = 0
    lastCharacterAdded = ''
    updateDisplay()
}

function eraseLastCharacter() {
    if (equalIsClicked) {
        resultDisplay.innerHTML = '0';
        displayedText = displayedTextBeforeEqual
        updateDisplay()
        return
    } else if (displayedText !== '') {
        if (displayedText.endsWith('</span>'))
            displayedText = removeSpanTags(displayedText, true);
        if (displayedText.endsWith('.')) addedPointToNumber = false
        if (displayedText.endsWith(')')) openBracket++
        if (displayedText.endsWith('(')) openBracket--

        displayedText = displayedText.slice(0, displayedText.length - 1);
        lastCharacterAdded = findLastCharacter(displayedText);
    } else displayedText = ''

    updateDisplay()

}

function findLastCharacter(value) {
    if (value.endsWith('</span>')) {
        //check if the last element after erasing is operator or bracket
        value = removeSpanTags(value, true);
        return value[value.length - 1];
    } else return value[value.length - 1]; //in this case it's number or '.'

}

function changeTheme() {
    switchSavedModePreference();
    toggleDarkMode(getDarkModePreferences())
}


function calculatePercentage() {
    console.log(getLastNumberAdded(displayedText))
    if (getLastNumberAdded(displayedText)) {
        console.log('here we are:', getLastNumberAdded(displayedText));
        let lastNumber = getLastNumberAdded(displayedText);
        let percentage = (lastNumber / 100).toString()
        displayedText = displayedText.replace(new RegExp(lastNumber + '$'), '')
        appendValue(percentage)
    }
}

function calculateSquarePower() {
    if (getLastNumberAdded(displayedText)) {
        let lastNumber = getLastNumberAdded(displayedText);
        let power = lastNumber * lastNumber
        displayedText = displayedText.replace(new RegExp(lastNumber + '$'), '')
        appendValue(power)
    }
}

function calculateTrigExpression(expression) {
    calcLastNo(displayedText)
    if (getLastNumberAdded(displayedText)) {
        let lastNumber = getLastNumberAdded(displayedText);
        let result = Math[expression](parseFloat(convertBetweenRadAndDeg(lastNumber, degreeAngle))).toFixed(10)
        displayedText = displayedText.replace(new RegExp(lastNumber + '$'), '')
        appendValue(result)
    }
}

function calcLastNo(displayValue) {
    let match = displayValue.match(/-?\d+(\.\d+)?$/);
    console.log(match)// Regex to match the last number, including negatives
    return match ? parseFloat(match[0]) : 0;
}

function appendValue(result) {
    if (result >= 0)
        inputCharacter(result.toString())
    else if (result < 0)
        inputCharacter(result.toString(), true)
}

function calculateInDegree() {
    degreeAngle = !degreeAngle
    // Get the spans by their IDs
    const radSpan = document.getElementById('rad');
    const degSpan = document.getElementById('deg');

    // Change opacity based on the state (fading effect)

    if (degreeAngle) {
        radSpan.style.opacity = '0.3';// Fade RAD
        degSpan.style.opacity = '1';
        degSpan.style.fontWeight = '600'
    } else {
        radSpan.style.opacity = '1';   // Fully visible RAD
        degSpan.style.opacity = '0.3'; // Fade DEG
        radSpan.style.fontWeight = '600'
    }
}

function advancedOperations(operation) {
    if (getLastNumberAdded(displayedText)) {
        let lastNumber = getLastNumberAdded(displayedText);
        let result = Math[operation](parseFloat(lastNumber)).toFixed(10)
        displayedText = displayedText.replace(new RegExp(lastNumber + '$'), '')
        appendValue(result.toString())
    }
}

function checkIfBracketAllowed(bracket) {
    if (bracket === '(')
        return operators.includes(lastCharacterAdded) || lastCharacterAdded === '(' || displayedText === '0'
    else if (bracket === ')')
        return (isNumber(lastCharacterAdded) && openBracket) || (openBracket && lastCharacterAdded !== '(' && (isNumber(lastCharacterAdded) || lastCharacterAdded === ')'))
    return false
}


function addBracket(bracket) {
    if (bracket === '(' && checkIfBracketAllowed(bracket)) {
        openBracket++
        inputCharacter('(')
    } else if (bracket === ')' && checkIfBracketAllowed(bracket)) {
        openBracket--
        inputCharacter(')')
    }
}