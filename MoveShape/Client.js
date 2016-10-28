﻿
$(function () {
    function Player(s, i)
    {
        this.$shape = s;
        this.ID = i;
    }

    var players = [];

    //players.find((x)=>x.ID == 3);

    var myId;
    var me = document.createElement('div');
    me.id = "myShape";
    document.getElementsByTagName('body')[0].appendChild(me);
    var moveShapeHub = $.connection.moveShapeHub,
        $shape = $("#myShape"),
        // Send a maximum of 10 messages per second
        // (mouse movements trigger a lot of messages)
        messageFrequency = 20,
        // Determine how often to send messages in
        // time to abide by the messageFrequency
        updateRate = 1000 / messageFrequency,
        shapeModel = {
            left: 0,
            top: 0,
            id: 0
        }
    var moved = false;

    findPlayerByID = function (id)
    {
        return players.find((x) =>x.ID == id);
    }
            
    moveShapeHub.client.updateShapes = function (models) {
        for(var i = 0; i < models.length; i++) {
            var a = findPlayerByID(models[i].id);
            if(a)
            {
                $("#player" + a.ID).animate({ left: models[i].left + "px", top: models[i].top + "px" }, { duration: updateRate, queue: false });
            }
            
            //players[models[index].id].$shape.animate(models[index], { duration: updateRate, queue: false });
        }
        // Gradually move the shape towards the new location (interpolate)
        // The updateRate is used as the duration because by the time
        // we get to the next location we want to be at the "last" location
        // We also clear the animation queue so that we start a new
        // animation and don't lag behind.
    };

    moveShapeHub.client.playerDisconnected = function(disconnectedPlayers)
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
    moveShapeHub.client.getMyID = function(ID)
    {
        myId = ID;
        shapeModel.id = ID;
    }

    addPlayer = function(model)
    {
        var player = document.createElement('div');
        player.id = "player" + model.id;
        player.className = 'player';
        document.getElementsByTagName('body')[0].appendChild(player);
        var newplayer = new Player($("#" + player.id), model.id);
        newplayer.$shape.animate({ left: model.left + "px", top: model.top + "px" });
        players.push(newplayer);
    }

    moveShapeHub.client.addPlayer = function (model) {
        addPlayer(model);
    }

    moveShapeHub.client.addPlayers = function(playerlist)
    {
        for(var i = 0; i < playerlist.length; i++)
        {
            addPlayer(playerlist[i]);
        }
    }

    $.connection.hub.start().done(function () {
        $shape.draggable({
            drag: function () {
                shapeModel.left = $shape.offset().left;
                shapeModel.top = $shape.offset().top;
                moved = true;
            }
        });
        // Start the client side server update interval
        setInterval(updateServerModel, updateRate);
        moveShapeHub.server.addPlayer();
        moveShapeHub.server.getPlayers();
    });
    function updateServerModel() {
        // Only update server if we have a new movement
        if (moved) {
            moveShapeHub.server.updateModel(shapeModel);
            moved = false;
        }
    }
});
