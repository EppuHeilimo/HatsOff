
function collisionCircle(centera, rada, centerb, radb) {
    var delta = {}
    delta.x = centerb.x - centera.x
    delta.y = centerb.y - centera.y

    if (Math.sqrt(delta.x * delta.x + delta.y * delta.y) < (rada + radb))
        return true;
    return false;
}

$(function () {
    function Player(s, i)
    {
        this.$shape = s;
        this.ID = i;
    }

    var players = [];

    //players.find((x)=>x.ID == 3);

    var myId;
    var moved = false
    var world;
    var me = document.createElement('div');
    me.id = "myShape";
    document.getElementsByTagName('body')[0].appendChild(me);
    var connectionHub = $.connection.connectionHub,
        $shape = $("#myShape"),
        // Send a maximum of 10 messages per second
        // (mouse movements trigger a lot of messages)
        messageFrequency = 5,
        // Determine how often to send messages in
        // time to abide by the messageFrequency
        updateRate = 1000 / messageFrequency,
        PlayerActor = {
            x: 0,
            y: 0,
            id: 0
        },
        WorldInfo =
        {
            map: {}
        }
    

    findPlayerByID = function (id)
    {
        return players.find((x) =>x.ID == id);
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

                $("#player" + a.ID).animate({ left: models[i].x + "px", top: models[i].y + "px" }, { duration: updateRate, queue: false });
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
                a.$shape.remove();
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
        PlayerActor.id = ID;
    }

    addPlayer = function(model)
    {
        var player = document.createElement('div');
        player.id = "player" + model.id;
        player.className = 'player';
        document.getElementsByTagName('body')[0].appendChild(player);
        var newplayer = new Player($("#" + player.id), model.id);
        newplayer.$shape.animate({ left: model.x + "px", top: model.y + "px" });
        players.push(newplayer);
    }

    connectionHub.client.addPlayer = function (model) {
        addPlayer(model);
    }

    connectionHub.client.getWorldInfo = function (worldd)
    {
        for (var i = 0; i < worldd.map.mapstate.playerlist.length; i++) {
            if(worldd.map.mapstate.playerlist[i].id != myId)
                addPlayer(worldd.map.mapstate.playerlist[i]);
        }

        if (world) {
            for (var j in world.map.triggerareas) {

                var area = world.map.triggerareas[j];
                GFX.removeDrawable(area.drawable);
            }
        }
        world = worldd;
        for (var j in world.map.triggerareas)
        {
            var area = world.map.triggerareas[j];
            if (!world.map.triggerareas.hasOwnProperty(j)) continue;
            a = new DrawableColorBox();
            a.position.x = area.x;
            a.position.y = area.y;
            a.size.x = area.sizex;
            a.size.y = area.sizey;
            a.color.b = 1;
            GFX.addDrawable(a);
            area.drawable = a;
        }  
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
        PlayerActor.x = x;
        PlayerActor.y = y;
        $shape.animate({ left: x + "px", top: y + "px" });
    }

    connectionHub.client.changeMap = function ()
    {
        for (var i = 0; i < players.length; i++) {
            players[i].$shape.remove();
        }
        players = [];
        connectionHub.server.getWorldInfo();
    }

    $.connection.hub.start().done(function () {
        $shape.draggable({
            drag: function () {
                PlayerActor.x = $shape.offset().left;
                PlayerActor.y = $shape.offset().top;
                moved = true;
            }
        });
        // Start the client side server update interval
        setInterval(updateServerModel, updateRate);
        connectionHub.server.addPlayer();
        connectionHub.server.getWorldInfo();
    });
    function updateServerModel() {
        // Only update server if we have a new movement
        if (moved) {
            connectionHub.server.updateModel(PlayerActor);
            var hit = false;
            for (var j in world.map.triggerareas) {
                var area = world.map.triggerareas[j];
                if (!world.map.triggerareas.hasOwnProperty(j)) continue;
                if (collisionCircle(PlayerActor, 50, area, 50)) {
                    hit = true;
                }
            }
            if (hit)
            {
                connectionHub.server.message("hittrigger", "Town");
            }

            moved = false;
        }
    }
});
