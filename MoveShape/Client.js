
$(function () {
    function playertest(s, i)
    {
        this.$shape = s;
        this.ID = i;
    }
    var players = [];
    var myID;
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
    moved = false;
            
    moveShapeHub.client.updateShapes = function (models) {
        for(index in models)
        {
            players[models[index].id].$shape.animate(models[index], { duration: updateRate, queue: false });
        }
        // Gradually move the shape towards the new location (interpolate)
        // The updateRate is used as the duration because by the time
        // we get to the next location we want to be at the "last" location
        // We also clear the animation queue so that we start a new
        // animation and don't lag behind.
    };
    moveShapeHub.client.getMyID = function(ID)
    {
        myID = ID;
        shapeModel.id = ID;
    }
    moveShapeHub.client.addPlayer = function (ID) {
        var player = document.createElement('div');
        player.id = "player" + players.length;
        player.className = 'player';
        document.getElementsByTagName('body')[0].appendChild(player);
        $temp = $(player.id);
        var test = new playertest($temp, ID);
        players.push(test);
    }

    $.connection.hub.start().done(function () {
        $shape.draggable({
            drag: function () {
                shapeModel = $shape.offset();
                moved = true;
            }
        });
        // Start the client side server update interval
        setInterval(updateServerModel, updateRate);
        moveShapeHub.server.addPlayer();
    });
    function updateServerModel() {
        // Only update server if we have a new movement
        if (moved) {
            moveShapeHub.server.updateModel(shapeModel);
            moved = false;
        }
    }
});
