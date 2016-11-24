
function collisionCircle(centera, rada, centerb, radb) {
    var delta = {}
    delta.x = centerb.x - centera.x;
    delta.y = centerb.y - centera.y;

    if (Math.sqrt(delta.x * delta.x + delta.y * delta.y) < (rada + radb))
        return true;
    return false;
}


$(function () {

    var players = [];
    var npcs = [];

    //players.find((x)=>x.ID == 3);
    var connectionHub;
    var myId;
    var moved = false;
    var currentarea;
    var gamedata;
    var me = new LocalPlayerClient();
    Game.addActor(me);
    connectionHub = $.connection.connectionHub,
        // Send a maximum of 10 messages per second
        // (actions trigger too many sends)
        messageFrequency = 10,
        // Determine how often to send messages in
        // time to abide by the messageFrequency
        updateRate = 1000 / messageFrequency,
    

    findPlayerByID = function (id)
    {
        return players.find((x) =>x.id == id);
    }

    findNpcByID = function (id) {
        return npcs.find((x) =>x.id == id);
    }

    connectionHub.client.say = function(sender, messages)
    {
        var p;
        var playerid = sender.id;
        if (playerid != me.id)
        {
            p = findPlayerByID(playerid);
        }
        else
        {
            p = me;
        }
        //p.showmessage(messages[messages.length - 1]);
        Chat.newMessage(sender.name + messages[messages.length - 1]);
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

                a.position = Vector2Clone(models[i].pos);
                a.sprite.texture = GFX.textures[models[i].appearance];
            }
        }
    };

    connectionHub.client.updateNpcs = function (npclist) {
        for (var i = 0; i < npclist.length; i++) {
            var a = findNpcByID(npclist[i].id);
            if (a) {
                a.position = Vector2Clone(npclist[i].position);
            }
        }
    };

    connectionHub.client.loseBattle = function()
    {
        Battle.lose();
    }

    connectionHub.client.winBattle = function ()
    {
        Battle.win();
    }

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
        player.teleport(Vector2Clone(model.pos));
        player.sprite.texture = GFX.textures[model.appearance];
        Game.addActor(player);
        players.push(player);
    }

    spawnNpc = function (npc) {
        var n = new EnemyNpc(npc.position.x, npc.position.y, npc.stats.health, npc.appearance, npc.level);
        n.id = npc.id;
        Game.addActor(n);
        npcs.push(n);
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

        for (var i = 0; i < newarea.mapstate.npclist.length; i++) {
            if (newarea.mapstate.npclist[i].id != myId)
                spawnNpc(newarea.mapstate.npclist[i]);
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

    connectionHub.client.playersLeftArea = function (dplayers)
    {
        for (var i = 0; i < dplayers.length; i++) {
            var a = findPlayerByID(dplayers[i].id);
            Game.removeActor(a);
            var index = players.indexOf(a);
            if (index > -1) {
                players.splice(index, 1);
            }
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
        me.teleport({ x: x, y: y });
    }

    connectionHub.client.changeMap = function ()
    {
        for (var i = 0; i < players.length; i++) {
            Game.removeActor(players[i])
        }
        for (var i = 0; i < npcs.length; i++) {
            Game.removeActor(npcs[i])
        }
        players = [];
        npcs = [];
        connectionHub.server.getAreaInfo();
        Chat.clear();
    }

    $.connection.hub.start().done(function () {
        connectionHub.server.getGameInfo();

        //The player must be added ...
        connectionHub.server.addPlayer().done(function () {

            //... before we can get the area information
            connectionHub.server.getAreaInfo();
            //and update player status
            connectionHub.server.updateStatus(1);

            Chat.init();
            Battle.init();

            // Start the client side server update interval
            setInterval(updateServerModel, updateRate);
            connectionIsEstablished = true;
        });
        
    });

    connectionHub.client.updateMyStatus = function (inventory, stats)
    {
        me.updateInventory(inventory);
        me.stats = stats;
    }


    connectionHub.client.startBattle = function (enemyid, turn, pvp) {
        if (pvp)
        {
            var p = findPlayerByID(enemyid);
            Battle.startBattle(turn, p, me);
        }
        else
        {
            var n = findNpcByID(enemyid);
            Battle.startRandomBattle(turn, n, me);
        }

    }
    
    connectionHub.client.updateBattle = function(updatedbattles)
    {
        for(var i = 0; i < updatedbattles.length; i++)
        {
            if (updatedbattles[i].player1id == myId)
            {
                Battle.updateBattle(updatedbattles[i].player1health, updatedbattles[i].player2health);
            }
            else if(updatedbattles[i].player2id == myId)
            {
                Battle.updateBattle(updatedbattles[i].player2health, updatedbattles[i].player1health);
            }
            else
            {
                if (updatedbattles[i].pvp) {
                    var p1 = findPlayerByID(updatedbattles[i].player1id);
                    var p2 = findPlayerByID(updatedbattles[i].player2id);
                    p1.changetext("Health: " + updatedbattles[i].player1health);
                    p2.changetext("Health: " + updatedbattles[i].player2health);
                }
                else
                {
                    var p1 = findPlayerByID(updatedbattles[i].player1id);
                    p1.changetext("Health: " + updatedbattles[i].player1health);
                }
            }
        }
    }

    function updateServerModel() {
        // Only update server if we have a new movement
        if (me.moved) {
            connectionHub.server.updateModel({pos: me.position, id: me.id});
            me.moved = false;
        }

        if (me.inventorychanged)
        {
            connectionHub.server.updateStatus(me.inventoryindex);
            me.inventorychanged = false;
        }

        if (me.activated)
        {
            var trigger = "";
            var attribs;
            for (let key in gamedata.maps[currentarea.mapname].triggerareas) {
                if (key in gamedata.maps[currentarea.mapname].triggerareas) {
                    var area = gamedata.maps[currentarea.mapname].triggerareas[key];
                    if (!gamedata.maps[currentarea.mapname].triggerareas.hasOwnProperty(key)) continue;
                    if (collisionCircle(me.position, 50, area, 50)) {
                        trigger = "areachangetrigger";
                        attribs = key;
                    }
                }
            }
            
            if (trigger === "")
            {
                for (var i = 0; i < players.length; i++) {
                    if (players[i].id != myId) {
                        if (collisionCircle(me.position, 50, players[i], 50)) {
                            trigger = "playerhittrigger";
                            attribs = players[i].id;
                        }
                    }
                }
            }

            if (trigger === "") {
                for (var i = 0; i < npcs.length; i++) {
                    if (npcs[i].id != myId) {
                        if (collisionCircle(me.position, 50, npcs[i].lastposition, 50)) {
                            trigger = "npchittrigger";
                            attribs = npcs[i].id;
                            console.log("You hit npc");
                        }
                    }
                }
            }
            if (trigger !== "") {
                connectionHub.server.message(trigger, attribs);
            }
        }
        if (Chat.sentmessage) {
            connectionHub.server.newMessage(me, Chat.lastmessage);
            Chat.sentmessage = false;

        }
        if (Battle.active)
        {
            if (Battle.action !== BattleAction.NONE) {
                connectionHub.server.updateBattle(me, Battle.action);
                Battle.clearAction();
            }
                
        }
        me.activated = false;
    }



    // Some crazy shite
    var canvas = document.getElementById("canvas");

    canvas.onclick = function (event) { getCursorPosition(canvas, event) }

    function getCursorPosition(canvas, event) {
        var rect = canvas.getBoundingClientRect();
        var x = event.clientX - rect.left + GFX.camera.x;
        var y = event.clientY - rect.top + GFX.camera.y;
        console.log("Haha, you clicked! x: " + x + " y: " + y);
    }
    /*
    for (var key in gamedata.maps[currentarea.mapname].triggerareas) {
        if (key in gamedata.maps[currentarea.mapname].triggerareas) {
            var area = gamedata.maps[currentarea.mapname].triggerareas[key];
            if (!gamedata.maps[currentarea.mapname].triggerareas.hasOwnProperty(key)) continue;
            if (collisionCircle(me.position, 50, area, 50)) {
                hit = true;
                hitarea = key;
            }
        }
    }*/
});
