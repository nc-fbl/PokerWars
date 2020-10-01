module.exports = function () {

  var info = {
    name: "RandBot50"
  };

  function update(game) {
    if (game.state !== "complete") {
      var heads = Math.random() > 0.5;
      if (heads) {
        return game.betting.fold;
      } else {if(Math.random()>0.5){
        return game.betting.call
      }else{return game.betting.raise}
    }
    }
  }

  return { update: update, info: info }

}
