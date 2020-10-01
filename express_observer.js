exports.ws = null;
var pokerOddsCalculator = require('poker-odds-calculator');
const e = require('express');

exports.setWs = (function (ws) {
    //console.log("Got WS!");
    exports.ws = ws;
});

exports.roundStart = (function (status) {
    //console.log("roundStart");
    var obj = new Object();
    obj.roundStart = status
    exports.ws.send(JSON.stringify(obj));
});

exports.betAction = (function (player, action, bet, err) {
    //console.log("betAction");
    var obj = new Object();
    obj.player = player;
    obj.action = action;
    obj.bet = bet;
    obj.err = err;
    var toSend = new Object();
    toSend.betAction = obj;
    if(obj.action !== "fold" || Object.keys(obj.player._actions).length > 1){
        sleep(3000);
    }else{
        sleep(2000);
    }
    exports.ws.send(JSON.stringify(toSend));
});

exports.stateChange = (function (status) {
    //console.log("stateChange");
    //console.log(JSON.stringify(status));

    if(status.state !== 'pre-flop'){
        var activePlayerCards = {};
        status.players.forEach((element, index) => {
            if(element.state === 'active' || element.state === 'allIn'){
                activePlayerCards[index] = (pokerOddsCalculator.CardGroup.fromString(element.cards[0] + element.cards[1]));
            }
        });

        var OddsResult;

        if(status.community.length > 0){
            var boardCardString = "";
            status.community.forEach(card => {
                boardCardString += card;
            });
            OddsResult = pokerOddsCalculator.OddsCalculator.calculate(Object.values(activePlayerCards), pokerOddsCalculator.CardGroup.fromString(boardCardString));
        }else{
            OddsResult = pokerOddsCalculator.OddsCalculator.calculate(Object.values(activePlayerCards));
        }

        var index = 0;
        Object.keys(activePlayerCards).forEach(key => {
            status.players[key]["winchance"] = OddsResult.equities[index++].getEquity();
        });
    }

    var obj = new Object();
    obj.stateChange = status;
    if(status.state !== 'pre-flop'){
        sleep(2000);
    }
    exports.ws.send(JSON.stringify(obj));
});

exports.complete = (function (status) {
    //console.log("complete");
    var obj = new Object();
    obj.complete = status;
    exports.ws.send(JSON.stringify(obj));
    sleep(5000);
});

function sleep(ms) {
    var start = new Date().getTime(), expire = start + ms;
    while (new Date().getTime() < expire) { }
    return;
}