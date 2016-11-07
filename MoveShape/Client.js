
function collisionCircle(centera, rada, centerb, radb) {
    var delta = {}
    delta.x = centerb.x - centera.x
    delta.y = centerb.y - centera.y

    if (Math.sqrt(delta.x * delta.x + delta.y * delta.y) < (rada + radb))
        return true;
    return false;
}

$(function () {

    var players = [];

    //players.find((x)=>x.ID == 3);

    var myId;
    var moved = false;
    var currentarea;
    var gamedata;
    var me = new LocalPlayerClient();
    Game.addActor(me);
    var connectionHub = $.connection.connectionHub,
        // Send a maximum of 10 messages per second
        // (mouse movements trigger a lot of messages)
        messageFrequency = 10,
        // Determine how often to send messages in
        // time to abide by the messageFrequency
        updateRate = 1000 / messageFrequency
    

    findPlayerByID = function (id)
    {
        return players.find((x) =>x.id == id);
    }

    connectionHub.client.say = function sayHi(p, messages)
    {
        var p;
        var playerid = p.id;
        if (playerid != me.id)
        {
            p = findPlayerByID(playerid);
        }
        else
        {
            p = me;
        }
        p.text.text = messages[messages.length - 1];
        setTimeout(function () { p.text.text = ""; }, 2000);

    }


            
    connectionHub.client.updateShapes = function (models) {
        for(var i = 0; i < models.length; i++) {
            var a = findPlayerByID(models[i].id);
            if(a)
            {
                //Create a new test particle with maximum size of 16 by 16
                //(defined in Client/gfx/box.ts)

                var dtp = new DrawableTestParticle({ x: 16, y: 16 });

                //Set the particle color to random tone of orange
                dtp.color.r = 1.0;
                dtp.color.g = Math.random();
                dtp.color.b = 0.0;

                //Set the particle position
                dtp.position.x = models[i].x + 50;
                dtp.position.y = models[i].y + 50;

                //Hand it to the GFX engine, it'll take care of the rest

                GFX.addDrawable(dtp);

                a.position = Vector2Clone(models[i]);
            }
            
            //players[models[index].id].$shape.animate(models[index], { duration: updateRate, queue: false });
        }
        // Gradually move the shape towards the new location (interpolate)
        // The updateRate is used as the duration because by the time
        // we get to the next location we want to be at the "last" location
        // We also clear the animation queue so that we start a new
        // animation and don't lag behind.
    };

    connectionHub.client.playerDisconnected = function (disconnectedPlayers)
    {
        for (var i = 0; i < disconnectedPlayers.length; i++) {
            var a = findPlayerByID(disconnectedPlayers[i].id);
            if (a) {
                Game.removeActor(a);
                var index = players.indexOf(a);
                if (index > -1) {
                    players.splice(index, 1);
                }
            }

        }
    }
    connectionHub.client.getMyID = function (ID)
    {
        myId = ID;
        me.id = ID;
    }

    addPlayer = function(model)
    {
        var player = new InterpolatedPlayerClient();
        player.id = model.id;
        player.teleport(Vector2Clone(model));
        Game.addActor(player);
        players.push(player);
    }

    connectionHub.client.addPlayer = function (model) {
        addPlayer(model);
    }

    connectionHub.client.getAreaInfo = function (newarea)
    {
        for (var i = 0; i < newarea.mapstate.playerlist.length; i++) {
            if (newarea.mapstate.playerlist[i].id != myId)
                addPlayer(newarea.mapstate.playerlist[i]);
        }

        if (currentarea) {
            for (var j in gamedata.maps[currentarea.mapname].triggerareas) {

                var area = gamedata.maps[currentarea.mapname].triggerareas[j];
                GFX.removeDrawable(area.drawable);
            }
        }
        currentarea = newarea;
        for (var j in gamedata.maps[currentarea.mapname].triggerareas)
        {
            var area = gamedata.maps[currentarea.mapname].triggerareas[j];
            if (!gamedata.maps[currentarea.mapname].triggerareas.hasOwnProperty(j)) continue;
            a = new DrawableTextureBox();
            a.position.x = area.x;
            a.position.y = area.y;
            a.size.x = area.sizex;
            a.size.y = area.sizey;
            a.texture = GFX.textures[area.appearance];
            GFX.addDrawable(a);
            area.drawable = a;
        }

        Game.changeMap(currentarea.mapname);
    }

    connectionHub.client.getGameInfo = function (data)
    {
        gamedata = data;
    }

    connectionHub.client.playerLeftArea = function(id)
    {
        var a = findPlayerByID(id);
        Game.removeActor(a);
        var index = players.indexOf(a);
        if (index > -1) {
            players.splice(index, 1);
        }
    }

    connectionHub.client.playerJoinedArea = function (joinedplayer) {
        addPlayer(joinedplayer);
    }

    connectionHub.client.addPlayers = function (playerlist)
    {
        for(var i = 0; i < playerlist.length; i++)
        {
            addPlayer(playerlist[i]);
        }
    }

    connectionHub.client.teleport = function (x, y)
    {
        me.teleport({ x: x, y: y });
    }

    connectionHub.client.changeMap = function ()
    {
        for (var i = 0; i < players.length; i++) {
            Game.removeActor(players[i])
        }
        players = [];
        connectionHub.server.getAreaInfo();
    }

    $.connection.hub.start().done(function () {
        // Start the client side server update interval
        setInterval(updateServerModel, updateRate);
        connectionHub.server.addPlayer();
        connectionHub.server.getGameInfo();
        connectionHub.server.getAreaInfo();

    });

    function updateServerModel() {
        // Only update server if we have a new movement
        if (me.moved) {
            connectionHub.server.updateModel({x: me.position.x, y: me.position.y, id: me.id});
            me.moved = false;
        }
        if (me.activated)
        {
            var hit = false;
            var hitarea;
            for (var key in gamedata.maps[currentarea.mapname].triggerareas) {
                if (key in gamedata.maps[currentarea.mapname].triggerareas) {
                    var area = gamedata.maps[currentarea.mapname].triggerareas[key];
                    if (!gamedata.maps[currentarea.mapname].triggerareas.hasOwnProperty(key)) continue;
                    if (collisionCircle(me.position, 50, area, 50)) {
                        hit = true;
                        hitarea = key;
                    }
                }
            }
            if (hit) {
                connectionHub.server.message("areachangetrigger", hitarea);
            }
        }
        if (me.sayed)
        {
            connectionHub.server.newMessage(me);
        }
        me.activated = false;
    }
});
