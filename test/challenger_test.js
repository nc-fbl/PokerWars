const challengerBot = require('../challenger');
const randBot3030 = require('../examples/bots/randBot3030');
const randBot4040 = require('../examples/bots/randBot4040');
const randBot5050 = require('../examples/bots/randBot5050');
const randbot6060 = require('../examples/bots/randbot6060');
const randBot7070 = require('../examples/bots/randBot7070');
const randbot7525 = require('../examples/bots/randbot7525');
const randBot8080 = require('../examples/bots/randBot8080');

const noLimitWithIncreasingBlinds = require('../src/bettings/no_limit_with_increasing_blinds')

var NUMBER_OF_TOURNAMENTS = 50,
    HANDS_PER_TOURNAMENT = 1000,
    CHIPS = 1000,
    BLINDS = [10, 25, 45, 70, 100, 135, 175, 220, 270, 325, 385, 450];

var MachinePoker = require('machine-poker'),
    JsSeat = MachinePoker.seats.JsLocal;
    jackSparrow = require('../examples/bots/jackSparrow'),
    batman = require('../examples/bots/batman'),
    ironMan = require('../examples/bots/ironMan'),
    jamesBond = require('../examples/bots/jamesBond'),
    tylerDurden = require('../examples/bots/tylerDurden'),
    aragorn = require('../examples/bots/aragorn'),
    johnMcClane = require('../examples/bots/johnMcClane'),
    martyMcFly = require('../examples/bots/martyMcFly')
    UnpredictableBot = require('../examples/bots/unpredictableBot')
    darthVader = require('../examples/bots/darthVader')
    indianaJones = require('../examples/bots/indianaJones')
    theJoker = require('../examples/bots/theJoker')
    async = require('async'),
    assert = require('assert');

var redColor = '\033[31m',
    greenColor = '\033[32m',
    blueColor = '\033[34m',
    resetColor = '\033[0m';

var bots = [];

// ### INDSÆT EGEN BOT ###
var challenger = JsSeat.create(challengerBot);

function getPlayer(players, player) {
    for (var i = 0; players.length > i; i++) {
        if (player.name === players[i].name) {
            return players[i];
        }
    }
}

var playerWinnings = {};
var totalBankroll = CHIPS * NUMBER_OF_TOURNAMENTS;

function runTournamentsHard(n, next) {
    bots = [
        { player: JsSeat.create(aragorn)},
        { player: JsSeat.create(tylerDurden)},
        { player: JsSeat.create(jamesBond)}, 
        { player: JsSeat.create(johnMcClane)}, 
        { player: JsSeat.create(jackSparrow)}, 
        { player: JsSeat.create(batman)},
        { player: JsSeat.create(ironMan)}
    ];
    runTournaments(n, next);
}

function runTournamentsEasy(n, next) {
    bots = [
        { player: JsSeat.create(randBot3030) },
        { player: JsSeat.create(randBot4040) },
        { player: JsSeat.create(randBot5050) },
        { player: JsSeat.create(randbot6060) },
        { player: JsSeat.create(randBot7070) },
        { player: JsSeat.create(randBot8080) },
        { player: JsSeat.create(randbot7525) }
    ];
    runTournaments(n, next);
}

function runTournamentsMedium(n, next) {
    bots = [
        { player: JsSeat.create(martyMcFly)},
        { player: JsSeat.create(UnpredictableBot)},
        { player: JsSeat.create(darthVader)}, 
        { player: JsSeat.create(indianaJones)}, 
        { player: JsSeat.create(theJoker)}, 
        { player: JsSeat.create(indianaJones)},
        { player: JsSeat.create(batman)}
    ];
    runTournaments(n, next);
}






function runTournaments(n, next) {
    var opts = {
        maxRounds: HANDS_PER_TOURNAMENT,
        chips: CHIPS,
        betting: noLimitWithIncreasingBlinds(BLINDS, 8)
    }
    var table = MachinePoker.create(opts);

    bots.push({ player: challenger });

    table.addPlayers(bots);
    table.on('tournamentComplete', function(players) {
        for (var i = 0; i < players.length; i++) {
            var p = players[i];
            if (playerWinnings[p.name]) {
                playerWinnings[p.name] += (p.chips - CHIPS);
            } else {
                playerWinnings[p.name] = (p.chips - CHIPS); // + CHIPS * NUMBER_OF_TOURNAMENTS
            }
        }
        var player = getPlayer(players, challenger);
        var bankRoll = playerWinnings[challenger.name];

        var bankRollColor = redColor;
        if (bankRoll > 0) { bankRollColor = greenColor }

        var earningsColor = redColor;
        if ((player.chips - CHIPS) > 0) { earningsColor = greenColor }

        console.log(earningsColor + (n + 1) + ". Earnings: $" + (player.chips - CHIPS) + bankRollColor + "\t\t\tTotal: $" + bankRoll + resetColor)

        next(null, player.chips);
    });
    table.start();
}

function printTournamentResults() {
    console.log(resetColor);
    console.log("Player Standings");
    console.log(resetColor);
    var sortable = [];
    for (var name in playerWinnings) {
        sortable.push([name, playerWinnings[name]])
    }
    sortable.sort(function(a, b) { return b[1] - a[1] })
    for (var i = 0; i < sortable.length; i++) {
        var color = redColor;
        if (sortable[i][1] > 0) { color = greenColor }

        console.log(color + (i + 1) + ". " + sortable[i][0] + " $" + sortable[i][1] + resetColor);
    }
}

describe("Writing a poker bot", function() {
    this.timeout(200000);
    it("should win some money",
        function(done) {
            console.log("\n\n===Starting Tournament===\n\n");
            async.timesSeries(
                NUMBER_OF_TOURNAMENTS,
                runTournamentsHard, // easy/medium/hard
                function(err, winnings) {
                    winnings = winnings.reduce(function(x, y) { return x + y });
                    printTournamentResults();
                    done();
                });
        }
    );
});