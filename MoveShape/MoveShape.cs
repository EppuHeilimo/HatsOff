using System;
using System.Threading;
using Microsoft.AspNet.SignalR;
using Newtonsoft.Json;
using System.Collections.Generic;

namespace Hatsoff
{
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
        private int _shapeID;
        private bool _modelUpdated;
        public int newID = 0;
        private Dictionary<string, RemotePlayer> connectedPlayers;
        private List<ShapeModel> updatedmodels = new List<ShapeModel>();
        public Broadcaster()
        {
            // Save our hub context so we can easily use it 
            // to send to its connected clients
            _hubContext = GlobalHost.ConnectionManager.GetHubContext<MoveShapeHub>();
            _model = new ShapeModel();
            _modelUpdated = false;
            connectedPlayers = new Dictionary<string, RemotePlayer>();
            // Start the broadcast loop
            _broadcastLoop = new Timer(
                Broadcast,
                null,
                BroadcastInterval,
                BroadcastInterval);
        }
        public void Broadcast(object state)
        {
            // This is how we can access the Clients property 
            // in a static hub method or outside of the hub entirely
            if(_modelUpdated)
            {
                ShapeModel[] array = updatedmodels.ToArray();
                _hubContext.Clients.All.updateShapes(array);
                _modelUpdated = false;
                updatedmodels.Clear();
            }

        }

        public int NewID()
        {
            newID++;
            return newID;
        }
        public void UpdateShape(ShapeModel clientModel)
        {
            updatedmodels.Add(clientModel);
            _modelUpdated = true;
        }

        public void AddPlayer(string connectionid)
        {
            connectedPlayers.Add(connectionid, new RemotePlayer(connectionid, newID));
            _hubContext.Clients.AllExcept(connectionid).addPlayer(newID);
            _hubContext.Clients.Client(connectionid).getMyID(newID);
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
        public MoveShapeHub()
            : this(Broadcaster.Instance)
        {
        }
        public MoveShapeHub(Broadcaster broadcaster)
        {
            _broadcaster = broadcaster;
        }
        public void UpdateModel(ShapeModel clientModel)
        {
            clientModel.LastUpdatedBy = Context.ConnectionId;
            // Update the shape model within our broadcaster
            _broadcaster.UpdateShape(clientModel);
        }
        public int AddPlayer()
        {
            _broadcaster.NewID();
            _broadcaster.AddPlayer(Context.ConnectionId);
            return _broadcaster.newID;
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
        [JsonProperty("id")]
        public double id { get; set; }
    }

    public class RemotePlayer
    {
        ShapeModel _playerShape;
        string _connectionID;
        int _ID;
        public RemotePlayer(string connectionID, int ID)
        {
            _connectionID = connectionID;
            _playerShape = new ShapeModel();
            _playerShape.Left = 0;
            _playerShape.Top = 0;
            _playerShape.LastUpdatedBy = connectionID;
            _ID = ID;
        }
    }
}
