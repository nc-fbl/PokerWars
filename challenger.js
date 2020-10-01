var PreFlopRange = require("./range").PreFlopRange;
var Hand = require("pokersolver").Hand;

module.exports = function () {

  var info = {
    name: "Nameless Challenger",
    email: "",
    btcWallet: ""
  };

  function update(game) {
    if (game.state !== "complete") {

      if(game.state === "pre-flop"){

        var raiseRange = new PreFlopRange("JJ+, AKs");
        var callRange = new PreFlopRange("22-TT, ATs+, AQo+, KQs");
        
        if(raiseRange.isHandInRange(game.self.cards)){
          return game.betting.raise;
        } else if (callRange.isHandInRange(game.self.cards)){
          return game.betting.call;
        } else {
          return 0;
        }

      } else {

        var hand = Hand.solve(game.self.cards.concat(game.community));

        if (hand.rank > 2){
          return game.betting.raise;
        } else if (hand.rank === 2){
          return game.betting.call;
        } else {
          return 0;
        }

      }
    }
  }

  return { update: update, info: info }

}
