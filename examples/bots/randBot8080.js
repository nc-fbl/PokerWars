module.exports = function () {

    var info = {
      name: "RandBot80"
    };
  
    function update(game) {
      if (game.state !== "complete") {
        var heads = Math.random() > 0.8;
        if (heads) {
          return game.betting.fold;
        } else {if(Math.random()>0.8){
          return game.betting.call
        }else{return game.betting.raise}
      }
      }
    }
  
    return { update: update, info: info }
  
  }
  