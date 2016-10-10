using System;
using System.Threading;
using Microsoft.AspNet.SignalR;
using Newtonsoft.Json;
using System.Collections.Generic;

namespace MoveShape
{
    public class Server
    {
        private Broadcaster _broadcaster;
        private readonly static Lazy<Server> _server = new Lazy<Server>(() => new Server());
        private List<RemotePlayer> connectedPlayers;
        public Server()
        {
            connectedPlayers = new List<RemotePlayer>();
        }

        public void NewConnection(string connectionID)
        {
            connectedPlayers.Add(new RemotePlayer(connectionID));
            _broadcaster.AddPlayer();
        }

        public static Server ServerInstance
        {
            get
            {
                return _server.Value;
            }
        }
    }

    public class Broadcaster
    {
        private readonly static Lazy<Broadcaster> _instance =
            new Lazy<Broadcaster>(() => new Broadcaster());
        // We're going to broadcast to all clients a maximum of 25 times per second
        private readonly TimeSpan BroadcastInterval =
            TimeSpan.FromMilliseconds(16);
        private readonly IHubContext _hubContext;

        private Timer _broadcastLoop;
        private ShapeModel _model;
        private ShapeModel _model2;
        private int _shapeID;
        private bool _modelUpdated;
        private bool _playerJoined;
        public Broadcaster()
        {
            // Save our hub context so we can easily use it 
            // to send to its connected clients
            _hubContext = GlobalHost.ConnectionManager.GetHubContext<MoveShapeHub>();
            _model = new ShapeModel();
            _modelUpdated = false;
            _playerJoined = false;
            // Start the broadcast loop
            _broadcastLoop = new Timer(
                Broadcast,
                null,
                BroadcastInterval,
                BroadcastInterval);
        }
        public void Broadcast(object state)
        {
            // No need to send anything if our model hasn't changed
            if (_modelUpdated)
            {
                // This is how we can access the Clients property 
                // in a static hub method or outside of the hub entirely
                _hubContext.Clients.AllExcept(_model.LastUpdatedBy).updateShape(_model, _shapeID);
                _modelUpdated = false;
            }
            if(_playerJoined)
            {
                _hubContext.Clients.AllExcept(_model.LastUpdatedBy).addPlayer();
                _playerJoined = false;
            }

        }
        public void UpdateShape(ShapeModel clientModel, int shapeID)
        {
            _shapeID = shapeID;
            _model = clientModel;
            _modelUpdated = true;
        }

        public void AddPlayer()
        {
            _playerJoined = true;
        }

        public static Broadcaster Instance
        {
            get
            {
                return _instance.Value;
            }
        }
    }

    public class MoveShapeHub : Hub
    {
        // Is set via the constructor on each creation
        private Broadcaster _broadcaster;
        private Server _server;
        public MoveShapeHub()
            : this(Broadcaster.Instance)
        {
            _server = Server.ServerInstance;
            _server.NewConnection(Context.ConnectionId);
        }
        public MoveShapeHub(Broadcaster broadcaster)
        {
            _broadcaster = broadcaster;
        }
        public void UpdateModel(ShapeModel clientModel, int shapeID)
        {
            clientModel.LastUpdatedBy = Context.ConnectionId;
            // Update the shape model within our broadcaster
            _broadcaster.UpdateShape(clientModel, shapeID);
        }
    }
    public class ShapeModel
    {
        // We declare Left and Top as lowercase with 
        // JsonProperty to sync the client and server models
        [JsonProperty("left")]
        public double Left { get; set; }
        [JsonProperty("top")]
        public double Top { get; set; }
        // We don't want the client to get the "LastUpdatedBy" property
        [JsonIgnore]
        public string LastUpdatedBy { get; set; }
    }

    public class RemotePlayer
    {
        ShapeModel _playerShape;
        string _connectionID;
        public RemotePlayer(string connectionID)
        {
            _connectionID = connectionID;
            _playerShape = new ShapeModel();
            _playerShape.Left = 0;
            _playerShape.Top = 0;
            _playerShape.LastUpdatedBy = connectionID;
        }
    }
}
