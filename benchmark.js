const challenger = require('./challenger');

var NUMBER_OF_TOURNAMENTS = 1000,
    HANDS_PER_ROUND = 16,
    CHIPS = 1000,
    MAXROUNDS = 1000,
    BLINDS = [10, 25, 45, 70, 100, 135, 175, 220, 270, 325, 385, 450];

var MachinePoker = require('machine-poker'),
    JsSeat = MachinePoker.seats.JsLocal;
    jackSparrow = require('./examples/bots/jackSparrow'),
    batman = require('./examples/bots/batman'),
    ironMan = require('./examples/bots/ironMan'),
    jamesBond = require('./examples/bots/jamesBond'),
    tylerDurden = require('./examples/bots/tylerDurden'),
    aragorn = require('./examples/bots/aragorn'),
    johnMcClane = require('./examples/bots/johnMcClane'),
    darthVader = require('./examples/bots/darthVader'),
    indianaJones = require('./examples/bots/indianaJones'),
    martyMcFly = require('./examples/bots/martyMcFly'),
    theJoker = require('./examples/bots/theJoker'),
    async = require('async'),
    noLimitWithIncreasingBlinds = require('./src/bettings/no_limit_with_increasing_blinds')
    assert = require('assert');

var redColor = '\033[31m',
    greenColor = '\033[32m',
    blueColor = '\033[34m',
    resetColor = '\033[0m';

var currentBlinds = BLINDS

var bots = [
    { player: JsSeat.create(aragorn) },
    { player: JsSeat.create(tylerDurden) },
    { player: JsSeat.create(jamesBond) }, 
    { player: JsSeat.create(johnMcClane) }, 
    { player: JsSeat.create(jackSparrow) }, 
    { player: JsSeat.create(batman) },
    { player: JsSeat.create(darthVader) },
    { player: JsSeat.create(indianaJones) },
    { player: JsSeat.create(ironMan) },
    { player: JsSeat.create(challenger) },
    { player: JsSeat.create(martyMcFly) },
    { player: JsSeat.create(theJoker) },
];


function reset(){
    bots.forEach(bot => {
        bot.tournamentsPlayed = 0;
        bot.busted = false;
        bot.chips = CHIPS;
    });
    currentBlinds = BLINDS
}

function runTournaments(n, next) {
    reset();
    async.timesSeries(
        MAXROUNDS,
        runRounds,
        function(err, winnings) {
            console.log(resetColor);
            winnings[winnings.length-1].forEach(winner => {
                if (playerWinnings[winner.player.name]) {
                    playerWinnings[winner.player.name] += winner.chips;
                } else {
                    playerWinnings[winner.player.name] = winner.chips;
                }
                console.log(greenColor + winner.player.name + " Won " + winner.chips  + "$" + resetColor);
            });
            console.log(playerWinnings);
            next(null, playerWinnings);
        });
    
}

function runRounds(n, next){

    var selectedBots = selectNextBots();

    if(selectedBots.length == 1){
        
        next("done", selectedBots);
        return;
    }

    var opts = {
        maxRounds: HANDS_PER_ROUND,
        chips: CHIPS,
        betting: noLimitWithIncreasingBlinds(currentBlinds,selectedBots.length)
    }

    var table = MachinePoker.create(opts);
    var rounds = 0
    table.addPlayers(selectedBots);
    table.on('roundStart', function(data) {
        rounds++;
    })
    table.on('tournamentComplete', function(players) {
        selectedBots.forEach(bot => {
            player = players.filter(player => player.name === bot.player.name)[0];
            bot.busted = player.chips <= 0;
            if(bot.busted){
                currentBlinds = currentBlinds.slice(1, currentBlinds.length)
            }
            bot.chips = player.chips;
            bot.tournamentsPlayed++;
        });

        printTournamentResults(selectedBots);
        next(null, selectedBots);
    });
    table.start();
    
    
}

function selectNextBots(){
    var activeBots = bots.filter(bot => !bot.busted);
    if (activeBots.length <= 8) {
        return activeBots;
    }
    var lowestTournamentsPlayed = activeBots.reduce((min, bot) => 
        bot.tournamentsPlayed < min ? bot.tournamentsPlayed : min, bots[0].tournamentsPlayed);
    var selectedBots = activeBots.filter(bot => bot.tournamentsPlayed == lowestTournamentsPlayed);
    if (selectedBots.length == 8) {
        return selectedBots;
    } else if (selectedBots.length > 8) {
        shuffle(selectedBots);
        return selectedBots.slice(0, 8);
    } else {
        var i = 1;
        while(selectedBots.length < 8 && selectedBots.length < activeBots.length){
            var nextBots = activeBots.filter(bot => bot.tournamentsPlayed == lowestTournamentsPlayed + i);
            shuffle(nextBots);
            var lowBotCount = selectedBots.length;
            for (let index = 0; index < 8 - lowBotCount && index < nextBots.length; index++) {
                selectedBots.push(nextBots[index]);
            }
            i++;
        }
        return selectedBots;
        
    }
}

function shuffle(array) {
    var m = array.length, t, i;
  
    // While there remain elements to shuffle…
    while (m) {
  
      // Pick a remaining element…
      i = Math.floor(Math.random() * m--);
  
      // And swap it with the current element.
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }
  
    return array;
  }

function printTournamentResults(selectedBots) {
    console.log(resetColor);
    console.log("Player Standings");
    console.log(resetColor);
    var sortable = [];
    selectedBots.sort((bot1, bot2) => bot1.chips - bot2.chips);

    selectedBots.forEach(bot => {
        if (bot.chips == 0) {
            console.log(redColor + bot.player.name + " is out of the tournamnet!" + resetColor);
        } else {
            console.log(greenColor + bot.player.name + " is still in it with " + bot.chips  + "$" + resetColor);
        }
    });
}

var playerWinnings = {}

function benchmark() {
    console.log("\n\n===Starting Tournament===\n\n");
    async.timesSeries(
        NUMBER_OF_TOURNAMENTS,
        runTournaments,
        function(err, winnings) {
        });
}

benchmark();