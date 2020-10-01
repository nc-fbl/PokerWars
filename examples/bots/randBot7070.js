module.exports = function () {

    var info = {
      name: "RandBot70"
    };
  
    function update(game) {
      if (game.state !== "complete") {
        var heads = Math.random() > 0.7;
        if (heads) {
          return game.betting.fold;
        } else {if(Math.random()>0.7){
          return game.betting.call
        }else{return game.betting.raise}
      }
      }
    }
  
    return { update: update, info: info }
  
  }
  