var MachinePoker = require('machine-poker');
var LocalSeat = MachinePoker.seats.JsLocal;
var CallBot = require('./examples/bots/callBot');
var RandBot = require('./examples/bots/randBot3030');
var FoldBot = require('./examples/bots/foldBot');
var tylerDurden = require('./examples/bots/tylerDurden');
var darthVader = require('./examples/bots/darthVader');
var jamesBond = require('./examples/bots/jamesBond');
var johnMcClane = require('./examples/bots/johnMcClane');
var jackSparrow = require('./examples/bots/jackSparrow');
var ironMan = require('./examples/bots/ironMan');
var batman = require('./examples/bots/batman');
var challenger = require('./challenger');
var narrator = MachinePoker.observers.narrator;
var express_observer = require('./express_observer')
var fileLogger = MachinePoker.observers.fileLogger('./examples/results.json');
const noLimitWithIncreasingBlinds = require('./src/bettings/no_limit_with_increasing_blinds')
const express = require('express')
const app = express()
const port = 3000

var expressWs = require('express-ws')(app);

app.listen(port);

const numberOfPlayers = 8;
var blinds = [10, 25, 45, 70, 100, 135, 175, 220, 270, 325, 385, 450];
var stopAtPlayers = 1
var rounds = 0
var startTime = 0
var table = MachinePoker.create({
    maxRounds: 10000,
    chips: 1000,
    betting: noLimitWithIncreasingBlinds(blinds,numberOfPlayers)
});

var players = [
    //LocalSeat.create(FoldBot), 
    //LocalSeat.create(CallBot), 
    // LocalSeat.create(RandBot),
    {player: LocalSeat.create(tylerDurden), chips: 1000},
    {player: LocalSeat.create(darthVader), chips: 1000},
    {player: LocalSeat.create(jamesBond), chips: 1000},
    {player: LocalSeat.create(johnMcClane), chips: 1000},
    {player: LocalSeat.create(jackSparrow), chips: 1000},
    {player: LocalSeat.create(ironMan), chips: 1000},
    {player: LocalSeat.create(batman), chips: 1000},
    {player: LocalSeat.create(challenger), chips: 1000}
];
table.addPlayers(players);
table.on('roundStart', function (data) { 
    rounds++
    console.log(rounds + ": " + (new Date().getTime() - startTime) / 1000)
    var activePlayerCount = 0;
    data.players.forEach(player => {
        if (player["state"] === "active"){
            activePlayerCount++;
        }
    });
    if (activePlayerCount <= stopAtPlayers){
        console.log("total rounds: " + rounds);
        process.exit();
    }
})
table.on('tournamentClosed', function () { 
    console.log("total rounds: " + rounds);
    process.exit();
});
table.addObserver(express_observer);

app.ws('/', function (ws, req) {
    ws.on('message', function (msg) {
        //console.log("WS connection started")
        express_observer.setWs(ws);
        startTime = new Date().getTime()
        table.start();
    });
});

