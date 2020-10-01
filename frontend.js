//import {CardGroup, OddsCalculator} from 'poker-odds-calculator';
//let pokerOddsCalculator = 
let socket = new WebSocket("ws://127.0.0.1:3000");
let activePlayers = [];
let handNumber = 0;
let playerCount = 0;
let seats = {};
let displayConsole =  [];
let rounds = 0;


socket.onmessage = function(event) {
    ////console.log("got message")
    let message = event.data;

    const obj = JSON.parse(event.data);
    if (obj.roundStart !== undefined) {
        handleRoundstart(obj)
    } else if (obj.betAction !== undefined) {
        handleBetAction(obj)
    } else if (obj.stateChange !== undefined) {
        handleStateChange(obj)
    } else if (obj.complete !== undefined) {
        handleComplete(obj)
    }
}

socket.onopen = function(event) {
    let outgoingMessage = "hi!"
    socket.send(outgoingMessage);
}

function appendText(message) {
    return;
}

function limitLengthOfChildren() {
    let actionList = document.getElementById("action-list");
    let ul = actionList.children[0];

    const maxHistoryCount = 100;
    while (ul.children.length > maxHistoryCount) {
        ul.removeChild(ul.childNodes[maxHistoryCount - 1]);
    }
}

function handleRoundstart(data) {
    // roundStart
    resetRound();
    rounds++;
    //console.log("The round starts now! Let's get ready to rumble!" + JSON.stringify(data));
    const maxHistoryCount = 100;
    if (displayConsole.length > maxHistoryCount) {
        displayConsole = displayConsole.slice(displayConsole.length - maxHistoryCount, displayConsole.length - 1)
    }
    limitLengthOfChildren();
    displayConsole.push("Round " + rounds + " starts now! Let's get ready to rumble!");
    var actionList = document.getElementById("action-list");
    actionList.children[0].innerHTML = "<li>"+displayConsole[displayConsole.length-1]+"</li>" + actionList.children[0].innerHTML;
    var names = [];
    activePlayers = [];
    var firstRound = false;
    if(Object.keys(seats).length === 0){
        firstRound = true;
    }
    data.roundStart.players.forEach(function(element, index) {
        names.push(element.name);
        if(firstRound){
            seats[element.name] = index;
        }
        makePlayer(element, seats[element.name]);
        activePlayers.push(element.name);
    });

    var dealer = activePlayers[activePlayers.length-1];

    if(activePlayers.length === 2){
        dealer = activePlayers[0];
    }

    moveDealerBotton(dealer);

    appendText("RoundStarted. Players: " + names)
}

function moveDealerBotton(dealerName){
    var bottonEle = document.getElementsByClassName('botton')[0];
    bottonEle.id = 'botton' + seats[dealerName];
}

function resetRound(){
    var players = document.getElementsByClassName('player');
    while(players.length > 0){
        players[0].remove();
    }

    var communityCards = document.getElementsByClassName('card-small')
    while(communityCards.length > 0){
        communityCards[0].remove();
    }

    var actions = document.getElementsByClassName('action')
    while(actions.length > 0){
        actions[0].remove();
    }

    var pot = document.getElementById('pot');
    pot.textContent = "Pot: $0";
}

function makePlayer(playerData, index) {
    var player = document.createElement("div");
    player.classList.add('player')
    player.id = 'player' + index;

    var winchance = document.createElement("p");
    winchance.classList.add('winchance');
    winchance.textContent = "-";
    player.appendChild(winchance)

    var stack = document.createElement("p");
    stack.classList.add('stack');
    stack.textContent = "$" + playerData.chips;
    player.appendChild(stack)

    var name = document.createElement("p");
    name.textContent = playerData.name;
    player.appendChild(name)

    var action = document.createElement("p");
    action.classList.add('action');
    action.id = "action" + index;
    //action.textContent = "50$"

    document.getElementById("table").appendChild(player);
    document.getElementById("table").appendChild(action);
}

function handleBetAction(data) {
    //console.log(BetActionString(data) + JSON.stringify(data));
    displayConsole.push(BetActionString(data));
    var Actions = document.getElementById("action-list");
    Actions.children[0].innerHTML = "<li>"+displayConsole[displayConsole.length-1]+"</li>" + Actions.children[0].innerHTML;
    
    var playerData = data.betAction.player;
    var player = document.getElementById('player' + seats[playerData.name]);
    player.getElementsByClassName('stack')[0].textContent = '$' + playerData.chips
    
    if(data.betAction.action === "fold"){
        changeHandColor(player, 'gray');
        var actionEle = document.getElementById('action' + seats[playerData.name]);
        actionEle.textContent = "Fold";
        activePlayers.shift();
    }else{
        var actionEle = document.getElementById('action' + seats[playerData.name]);
        updateBet(actionEle, parseInt(data.betAction.bet));
        changeHandColor(player, 'white');
        activePlayers.push(activePlayers.shift());
    }
    updateNextToAct();
    appendText("Bet happened - " + JSON.stringify(data))
}

function updateBet(actionEle, newBet){
    if(actionEle.textContent === "" || actionEle.textContent === 'Check'){
        if(newBet === 0){
            actionEle.textContent = 'Check';
        }else{
            actionEle.textContent = '$' + newBet;
        }
    }else{
        var currentBet = getAmountFromText(actionEle.textContent);
        actionEle.textContent = '$' + (currentBet + newBet);
    }
    var potEle = document.getElementById('pot');
    var potAmount = getAmountFromText(potEle.textContent);
    potEle.textContent = 'Pot: $' + (potAmount + newBet)
}

function handleStateChange(data) {
    if(data.stateChange.state != "final"){
        //console.log(StateChangeString(data) + JSON.stringify(data));
        displayConsole.push(StateChangeString(data));
        var Actions = document.getElementById("action-list");
        Actions.children[0].innerHTML = "<li>"+displayConsole[displayConsole.length-1]+"</li>" + Actions.children[0].innerHTML;
    }    
    appendText("state changed - " + data.stateChange.state + JSON.stringify(data))
    
    activePlayers = [];
    data.stateChange.players.forEach(function(element) {
        if(element.state === "active"){
            changeHandColor(document.getElementById('player' + seats[element.name]), 'white');
            addWinchanceToPlayer(element);
            activePlayers.push(element.name);
        }else{
            removeWinchanceFromPlayer(element);
        }
    });
    //activePlayers.sort();
    resetBets();

    var state = data.stateChange.state;
    if (state === 'pre-flop') {
        // Setup cards for players 
        var index = 0;
        var blinds = 0;
        var allPlayerCards = {};
        data.stateChange.players.forEach(function(element) {
            var thisPlayer = document.getElementById("player"+[seats[element.name]]);

            var playerCards = document.createElement("div");
            playerCards.classList.add('playerCards');
            thisPlayer.appendChild(playerCards);
            element.cards.forEach(function(card) {
                var suitIcon = getSuitIcon(card);
                var rank = getRank(card);
                addHtmlCard(suitIcon, rank, playerCards);
            })
            if(index === 0 || index === 1){
                document.getElementById('action' + seats[element.name]).textContent = '$' + element.blind;
                blinds += element.blind;
                thisPlayer.getElementsByClassName('stack')[0].textContent = '$' + element.chips;
                activePlayers.push(activePlayers.shift())
            }
            index++;
        });

        if(activePlayers.length === 2){
            activePlayers.push(activePlayers.shift());
        }
        
        document.getElementById('pot').textContent = 'Pot: $' + blinds;
    } else if (state === 'flop') {
        var communityContainer = document.getElementById("community")
        data.stateChange.community.forEach(function(card) {
            var suit = getSuitIcon(card);
            var rank = getRank(card)
            addHtmlCard(suit, rank, communityContainer)
        });
    } else if (state === 'turn') {
        var communityContainer = document.getElementById("community")
        data.stateChange.community.splice(3).forEach(function(card) {
            var suit = getSuitIcon(card);
            var rank = getRank(card)
            addHtmlCard(suit, rank, communityContainer)
        });
    } else if (state === 'river') {
        var communityContainer = document.getElementById("community")
        data.stateChange.community.splice(4).forEach(function(card) {
            var suit = getSuitIcon(card);
            var rank = getRank(card)
            addHtmlCard(suit, rank, communityContainer)
        });
    }

    if (state !== 'final'){
        updateNextToAct();
    }
}

function addWinchanceToPlayer(player){
    if(player.winchance === undefined) {return;}

    var playerEle = document.getElementById("player"+[seats[player.name]]);
    playerEle.getElementsByClassName('winchance')[0].textContent = player.winchance + "%"

}

function removeWinchanceFromPlayer(player){
    var playerEle = document.getElementById("player"+[seats[player.name]]);
    playerEle.getElementsByClassName('winchance')[0].textContent = "-"

}

function getRank(card) {
    return card[0];
}

function getSuitIcon(card) {
    var suit = card[1];
    var suitIcon = '';
    if (suit == 'c') {
        suitIcon = '♣';
    } else if (suit == 'h') {
        suitIcon = '♥';
    } else if (suit == 'd') {
        suitIcon = '♦';
    } else if (suit == 's') {
        suitIcon = '♠';
    }
    return suitIcon;
}

function handleComplete(data) {    
    //console.log(CompleteString(data)+ JSON.stringify(data));
    displayConsole.push(CompleteString(data));
    var Actions = document.getElementById("action-list");
    Actions.children[0].innerHTML = "<li>"+displayConsole[displayConsole.length-1]+"</li>" + Actions.children[0].innerHTML;

    var communityCards = data.complete.community;

    data.complete.winners.forEach((winner) => {
        var player = data.complete.players[winner.position];
        document.getElementById('action' + seats[player.name]).textContent = 'WIN: $' + winner.amount;
        var numNonFolded = 0;
        data.complete.players.forEach(player => {
            if(player.state !== "folded"){
                numNonFolded++;
            }
        });
        if(numNonFolded == 1){
            var actualWin = 0
            var actionRounds = Object.values(player.actions) 
            if (actionRounds.length === 0){
                actualWin = player.payout
            }else{
                var lastRoundActions = actionRounds[actionRounds.length-1]
                var lastBet = lastRoundActions[lastRoundActions.length-1]["bet"]
                actualWin = (winner.amount - lastBet);
            }
            document.getElementById('action' + seats[player.name]).textContent = 'WIN: $' + actualWin;

            document.getElementById('player' + seats[player.name]).getElementsByClassName('stack')[0].textContent = '$' + (player.chips - actualWin);
        }
        
        document.getElementById('pot').textContent = player.handName;
        if(player.hand !== undefined){
            player.hand.forEach((card) => {
                card = card.slice(0, 2)
                var communityCardIndex = communityCards.indexOf(card);
                if (communityCardIndex !== -1){
                    var communityCardEles = document.getElementById('community').getElementsByClassName('card-small');
                    communityCardEles[communityCardIndex].style.backgroundColor = 'yellow';
                }else{
                    var handCardIndex = player.cards.indexOf(card);
                    var handCardEles = document.getElementById('player' + seats[player.name]).getElementsByClassName('card-small');
                    handCardEles[handCardIndex].style.backgroundColor = 'yellow';
                }
            });
        }
    });
    

    appendText("Game is over");
}

function addHtmlCard(suit, rank, list) {
    var node = document.createElement("div");
    node.classList.add('card-small');
    var rankPart = document.createElement("p");
    rankPart.textContent = rank;
    rankPart.classList.add('card-text');

    var suitPart = document.createElement("p");
    if (suit == '♥' || suit == '♦') {
        suitPart.innerHTML = suit.fontcolor('red');
    } else {
        suitPart.innerHTML = suit
    }

    suitPart.classList.add('card-img');

    node.appendChild(rankPart)
    node.appendChild(suitPart)

    list.appendChild(node)
}

function resetBets(){
    var actions = document.getElementsByClassName('action');

    for (let i = 0; i < actions.length; i++) {
        var action = actions[i];
        action.textContent = "";
    }
}

function updateNextToAct(){
    if(activePlayers.length !== 0){
        changeHandColor(document.getElementById('player' + seats[activePlayers[0]]), 'yellow');
    }
}

function changeHandColor(playerElement, color){
    var cards = playerElement.getElementsByClassName('card-small');
    for (var i = 0; i < cards.length; i++){
        var card = cards[i];
        card.style.backgroundColor = color;
    }
}

function getAmountFromText(text){
    return parseInt(text.split("$")[1]);
}

function BetActionString(data){
    var action_string = "<b>" + data.betAction.player.name + "</b>" + " ";
    if(data.betAction.action == "call"){
        action_string += "called with ";
        action_string += data.betAction.bet;
        action_string += " to a total of ";
        action_string += data.betAction.player.wagered
    }else if(data.betAction.action == "check"){
        action_string += "checked";
    }else if(data.betAction.action == "raise"){
        action_string += "raised with "
        action_string += data.betAction.bet;
        action_string += " to a total of ";
        action_string += data.betAction.player.wagered
    }else if(data.betAction.action == "allIn"){
        action_string += "<b style='color:#FF0000'>" + "went all in !!!" + "</b>"
    }else{
        action_string += "folded"
    }
    return action_string
}

function StateChangeString(data){
    var statechange_string = "";
    if(data.stateChange.state == "pre-flop"){
        statechange_string += "We are in the Pre-flop phase with ";
        statechange_string += "<b>" + data.stateChange.players[data.stateChange.players.length-1].name + "</b>";
        statechange_string += " as dealer, ";
        statechange_string += "<b>" + data.stateChange.players[0].name + "</b>";
        statechange_string += " as Small blind at ";
        statechange_string += data.stateChange.players[0].blind;
        statechange_string += "$ and ";
        statechange_string += "<b>" + data.stateChange.players[1].name + "</b>";
        statechange_string += " as Big blind at ";
        statechange_string += data.stateChange.players[1].blind;
        statechange_string += "$"
    }else if(data.stateChange.state == "flop"){
        statechange_string += "The flop reveals "//"a "
        statechange_string += getCardName(data.stateChange.community[0]);
        statechange_string += " "//",a "
        statechange_string += getCardName(data.stateChange.community[1]);
        statechange_string += " "//"and a "
        statechange_string += getCardName(data.stateChange.community[2]);
        statechange_string += " giving "
        statechange_string += "<b>" + data.stateChange.players[IndexOfHigestWinrate(data)].name + "</b>"
        statechange_string += " the best chance to win at "
        statechange_string += data.stateChange.players[IndexOfHigestWinrate(data)].winchance
        statechange_string += "%" 
    }else if(data.stateChange.state == "turn"){
        statechange_string += "The turn reveals "//"a "
        statechange_string += getCardName(data.stateChange.community[3]);
        statechange_string += " giving "
        statechange_string += "<b>" + data.stateChange.players[IndexOfHigestWinrate(data)].name + "</b>"
        statechange_string += " the best chance to win at "
        statechange_string += data.stateChange.players[IndexOfHigestWinrate(data)].winchance
        statechange_string += "%" 
    }else if(data.stateChange.state == "river"){
        statechange_string += "The river reveals "//"a "
        statechange_string += getCardName(data.stateChange.community[4]);
        statechange_string += " giving "
        statechange_string += "<b>" + data.stateChange.players[IndexOfHigestWinrate(data)].name + "</b>"
        statechange_string += " the best chance to win at "
        statechange_string += data.stateChange.players[IndexOfHigestWinrate(data)].winchance
        statechange_string += "%" 
    }    
    return statechange_string
}

function IndexOfHigestWinrate(data){
    var i;
    var highestWinrate = -1;
    var Index;
    for (i = 0; i < data.stateChange.players.length; i++) {
        if(data.stateChange.players[i].winchance > highestWinrate){
            highestWinrate = data.stateChange.players[i].winchance;
            Index = i;
        }
    }
 return Index;
}

function CompleteString(data){
    var complete_string = "The round has ended with ";
    if(data.complete.winners.length < 2){
        var player = data.complete.players[parseInt(data.complete.winners[0].position)];
        var numNonFolded = 0;
        var winAmount = data.complete.winners[0].amount

        data.complete.players.forEach(player => {
            if(player.state !== "folded"){
                numNonFolded++;
            }
        });
        if(numNonFolded == 1){
            var actionRounds = Object.values(player.actions) 
            if (actionRounds.length === 0){
                winAmount = player.payout
            }else{
                var lastRoundActions = actionRounds[actionRounds.length-1]
                var lastBet = lastRoundActions[lastRoundActions.length-1]["bet"]
                winAmount = (winAmount - lastBet);
            }
            
        }

        complete_string += "<b>" + player.name + "</b>";
        complete_string += " winning ";
        complete_string += winAmount;
        complete_string += "$"
    }else if (data.complete.winners.length >= 2){
        complete_string += "pot is split, between "
        complete_string += "<b>" + data.complete.players[parseInt(data.complete.winners[0].position)].name + "</b> "
        complete_string += "winning ";
        complete_string += data.complete.winners[0].amount;
        complete_string += "$"
        for(var i = 1; i < data.complete.winners.length; i++) {
            winner = data.complete.winners[i]
            complete_string += " and "
            complete_string += "<b>" + data.complete.players[parseInt(winner.position)].name + "</b> "
            complete_string += "winning ";
            complete_string += winner.amount;
            complete_string += "$"            
        }
    }else{
        complete_string += "no winners :'("
    }
    
    return complete_string
}

function getCardName(card){
    var cardname = ""
    /*switch(card[0]) {
        case "K":
          cardname += "King"
          break;
        case "Q":
            cardname += "Queen"
          break;
        case "J":
            cardname += "Jack"
          break;
        case "T":
            cardname += "Ten"
            break;
        case "9":
              cardname += "Nine"
            break;
        case "8":
              cardname += "Eight"
            break;
        case "7":
                cardname += "Seven"
            break;
        case "6":
                  cardname += "Six"
            break;
        case "5":
                  cardname += "Five"
            break;
        case "4":
                  cardname += "Four"
            break;
        case "3":
                    cardname += "Three"
            break;
        default:
            cardname += "Two"
            break;
      }*/
    //cardname +=" of " ;
    cardname += card[0]
    cardname += getSuitIcon(card)
    /*switch(card[1]) {
        case "h":
          cardname += "Hearts"
          break;
        case "s":
            cardname += "Spades"
          break;
        case "c":
            cardname += "Clubs"
          break;
        case "d":
            cardname += "Diamonds"
            break;        
      }*/
    return cardname;
}