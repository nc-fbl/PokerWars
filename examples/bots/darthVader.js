module.exports=function(){function t(t){this.card=t,this.value=this.getValue(),this.suit=t[1]}function e(t){this.cards=t,this.cards=this.sortCards(this.cards)}return t.prototype.getValue=function(){return isNaN(this.card[0])?"A"==this.card[0]?14:"K"==this.card[0]?13:"Q"==this.card[0]?12:11:this.card[0]},e.prototype.sortCards=function(t){return t[0].getValue()<t[1].getValue()?Array(t[1],t[0]):t},e.prototype.isPair=function(){return this.cards[0].getValue()===this.cards[1].getValue()},e.prototype.isStrong=function(){return!!(this.isPair()&&this.cards[0].getValue()>=9)||(this.cards[1].getValue()>=11||void 0)},{update:function(r){if("complete"!==r.state){var i=new t(r.self.cards[0]),s=new t(r.self.cards[1]),a=new e([i,s]);if("pre-flop"===r.state)return d=a,(f=r).betting.call>500?d.isPair()&&d.cards[0].getValue()>=13?f.self.chips:-1:d.isStrong()?4*f.betting.call:void 0;if("flop"===r.state){for(var n=new t(r.community[0]),o=new t(r.community[0]),c=new t(r.community[0]),u=Array(n,o,c),l=!1,h=0;h<u.length;h++)i.getValue()!=u[h].getValue()&&s.getValue()!=u[h].getValue()||(l=!0);return l?r.self.chips:10}return 0}var d,f},info:{name:"darthVader",email:"",btcWallet:""}}};