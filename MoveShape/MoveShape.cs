using System;
using System.Collections.Concurrent;
using System.Threading;
using Microsoft.AspNet.SignalR;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Hatsoff
{
    public class Broadcaster
    {
        private readonly static Lazy<Broadcaster> _instance =
            new Lazy<Broadcaster>(() => new Broadcaster());
        // We're going to broadcast to all clients a maximum of 25 times per second.
        private readonly TimeSpan BroadcastInterval =
            TimeSpan.FromMilliseconds(16);
        private readonly IHubContext _hubContext;
        private Timer _broadcastLoop;
        private bool _modelUpdated;
        private bool _playerDisconnected = false;
        public int _newID = 0;
        private ConcurrentDictionary<string, RemotePlayer> connectedPlayers;
        private List<ShapeModel> _updatedPlayers = new List<ShapeModel>();
        private List<ShapeModel> _disconnctedPlayers = new List<ShapeModel>();
        public Broadcaster()
        {
            // Save our hub context so we can easily use it 
            // to send to its connected clients
            _hubContext = GlobalHost.ConnectionManager.GetHubContext<MoveShapeHub>();

            _modelUpdated = false;
            connectedPlayers = new ConcurrentDictionary<string, RemotePlayer>();
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
                ShapeModel[] array = _updatedPlayers.ToArray();
                _hubContext.Clients.All.updateShapes(array);
                _modelUpdated = false;
                _updatedPlayers.Clear();
            }
            if (_playerDisconnected)
            {
                _hubContext.Clients.All.playerDisconnected(_disconnctedPlayers);
                _playerDisconnected = false;
            }

        }

        public void PlayerDisconnect(string connectionId)
        {
            try
            {
                RemotePlayer dPlayer;
                connectedPlayers.TryRemove(connectionId, out dPlayer);
                if (dPlayer != null)
                {
                    _disconnctedPlayers.Add(dPlayer.getPlayerShape());
                    _playerDisconnected = true;
                }

            }
            catch (ArgumentNullException ex)
            {
                
            }

        }

        public int NewID()
        {
            _newID++;
            return _newID;
        }
        public void UpdateShape(ShapeModel clientModel)
        {
            //TODO: Make player gradually move ovetime 
            RemotePlayer p;
            connectedPlayers.TryGetValue(clientModel.LastUpdatedBy, out p);
            p.setPosition(clientModel.Left, clientModel.Top);

            _updatedPlayers.Add(clientModel);
            _modelUpdated = true;
        }

        public void AddPlayer(string connectionid)
        {
            int id = NewID();
            RemotePlayer newplayer = new RemotePlayer(connectionid, id);
            connectedPlayers.TryAdd(connectionid, newplayer);
            _hubContext.Clients.AllExcept(connectionid).addPlayer(newplayer.getPlayerShape());
            _hubContext.Clients.Client(connectionid).getMyID(id);
        }

        public static Broadcaster Instance
        {
            get
            {
                return _instance.Value;
            }
        }

        internal void SendPlayersListTo(string connectionId)
        {
            List<ShapeModel> playerlist = new List<ShapeModel>();
            if(connectedPlayers.Count > 1)
            {
                foreach (KeyValuePair<string, RemotePlayer> p in connectedPlayers)
                {
                    if (p.Key == connectionId)
                        continue;
                    else
                    {
                        playerlist.Add(p.Value.getPlayerShape());
                    }
                }

                _hubContext.Clients.Client(connectionId).addPlayers(playerlist);
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
        public void AddPlayer()
        {
            _broadcaster.AddPlayer(Context.ConnectionId);
        }
        public void GetPlayers()
        {
            _broadcaster.SendPlayersListTo(Context.ConnectionId);
        }

        public override Task OnDisconnected(bool stopCalled)
        {
            _broadcaster.PlayerDisconnect(Context.ConnectionId);
            return base.OnDisconnected(stopCalled);
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
            _playerShape.id = ID;
        }
        public ShapeModel getPlayerShape()
        {
            return _playerShape;
        }

        public void setPosition(double left, double top)
        {
            _playerShape.Left = left;
            _playerShape.Top = top;
        }
    }
}
