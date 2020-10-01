const VALUES = "23456789TJQKA"

function PreFlopRange(rangeString) {
    this.rangeList = rangeString.split(", ");
    this.expandedRangeList = [];

    this.rangeList.forEach(rangeStr => {
        if(rangeStr[0] === rangeStr[1]){ //pair
            if(rangeStr.length == 2) { //single combo
                this.expandedRangeList.push(rangeStr);
            } else { // 
                var startIndex = VALUES.indexOf(rangeStr[0])
                var endIndex = 12;
                if (rangeStr.length === 5) {
                    endIndex = VALUES.indexOf(rangeStr[3])
                }
                for (let i = startIndex; i <= endIndex; i++) {
                    this.expandedRangeList.push(VALUES[i] + VALUES[i])
                }
            } 
        } else if (rangeStr.length === 3) { //single combo
            this.expandedRangeList.push(rangeStr);
        } else {
            var highCardIndex = VALUES.indexOf(rangeStr[0]);
            var startIndex = VALUES.indexOf(rangeStr[1]);
            var endIndex = highCardIndex - 1;
            if (rangeStr.length === 7) {
                endIndex = VALUES.indexOf(rangeStr[5])
            }
            for (let i = startIndex; i <= endIndex; i++) {
                this.expandedRangeList.push(VALUES[highCardIndex] + VALUES[i] + rangeStr[2])
            }
        }
    });
}

PreFlopRange.prototype.isHandInRange = function(cards) {
    cards.sort((x, y) => VALUES.indexOf(y[0]) - VALUES.indexOf(x[0]));

    var cardsStr = cards[0][0] + cards[1][0];

    if (cards[0][0] !== cards[1][0]){ // not pair
        if (cards[0][1] === cards[1][1]) { // same suit
            cardsStr = cardsStr + "s";
        } else {                            //off suit
            cardsStr = cardsStr + "o";
        }
    }

    return this.expandedRangeList.includes(cardsStr);
}

module.exports = {
    PreFlopRange
};