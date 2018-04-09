var express = require("express");
var app = express();
var mc = require('mc');
var client = new mc.Client();
client.connect(() => {
  console.log("connected to memcache on local host port 11211!")
});
client.setAdapter(mc.Adapter.json)
var mysql = require('mysql');
var connection = mysql.createConnection({host: 'localhost', user: 'jastworld', password: 'jastworld', database: 'hw7'});

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

connection.connect();

app.get("/hw7", (req, res, next) => {
  ///hw7?club=HOU&pos=M
  var club = req.query.club + "";
  var position = req.query.pos + "";
  console.log(position + " <> " + club)
  client.get(club.toUpperCase() + position.toUpperCase(), function(err, response) {
    if (!err) {
      console.log('found in cache')
      return response[club.toUpperCase() + position.toUpperCase()];
    } else {
      console.log('!found in cache')
      //{ club:, pos:, max_assists:, player:, avg_assists:}
      connection.query('select * from `assists` where `POS` = ? and `club` = ? ORDER BY A DESC, GS DESC', [
        position, club
      ], function(err, player) {
        //console.log(err)
        //console.log(player)
        if (err)
          return res.json({status: "OK"});

        //console.log(req.query.pos);
        //console.log(req.query.club);
        connection.query('SELECT AVG(A) AS average FROM assists', function(err, result) {
          var response = {club: player[0].Club, pos: player[0].POS, max_assists: player[0].A, player: player[0].Player, avg_assists: result[0].average};
          res.json(response);
          client.set(club.toUpperCase() + position.toUpperCase(), response,function(err,status){
            if(!err){
              console.log(status)
            }
          })

        });
      });
    }
  });

});

var port = process.env.port || 80;
app.listen(port, () => {
  console.log("App is running on port:" + port);
})
