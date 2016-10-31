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
        private List<PlayerActor> _updatedPlayers = new List<PlayerActor>();
        private WorldInfo world;
        private List<PlayerActor> _disconnctedPlayers = new List<PlayerActor>();
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
            world = new WorldInfo();
        }
        public void Broadcast(object state)
        {
            // This is how we can access the Clients property 
            // in a static hub method or outside of the hub entirely
            if(_modelUpdated)
            {
                PlayerActor[] array = _updatedPlayers.ToArray();
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
                world.playerlist.Remove(dPlayer.getPlayerShape());
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
        public void UpdateShape(PlayerActor clientModel)
        {
            //TODO: Make player gradually move ovetime 
            RemotePlayer p;
            connectedPlayers.TryGetValue(clientModel.LastUpdatedBy, out p);
            p.setPosition(clientModel.x, clientModel.y);
          
            _updatedPlayers.Add(clientModel);
            _modelUpdated = true;
        }

        public void AddPlayer(string connectionid)
        {
            int id = NewID();
            RemotePlayer newplayer = new RemotePlayer(connectionid, id);
            connectedPlayers.TryAdd(connectionid, newplayer);
            world.playerlist.Add(new PlayerActor(id, 0, 0));
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

        internal void SendWorldInfo(string connectionId)
        {

            
            if(connectedPlayers.Count > 1)
            {
                world.playerlist.Clear();
                foreach (KeyValuePair<string, RemotePlayer> p in connectedPlayers)
                {
                    if (p.Key == connectionId)
                        continue;
                    else
                    {
                        world.playerlist.Add(p.Value.getPlayerShape());
                    }
                }

                _hubContext.Clients.Client(connectionId).getWorldInfo(world);
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
        public void UpdateModel(PlayerActor clientModel)
        {
            clientModel.LastUpdatedBy = Context.ConnectionId;
            // Update the shape model within our broadcaster
            _broadcaster.UpdateShape(clientModel);

        }
        public void AddPlayer()
        {
            _broadcaster.AddPlayer(Context.ConnectionId);
        }
        public void GetWorldInfo()
        {
            _broadcaster.SendWorldInfo(Context.ConnectionId);
        }

        public override Task OnDisconnected(bool stopCalled)
        {
            _broadcaster.PlayerDisconnect(Context.ConnectionId);
            return base.OnDisconnected(stopCalled);
        }
    }
    public class PlayerActor
    {
        // We declare Left and Top as lowercase with 
        // JsonProperty to sync the client and server models
        [JsonProperty("x")]
        public double x { get; set; }
        [JsonProperty("y")]
        public double y { get; set; }
        // We don't want the client to get the "LastUpdatedBy" property
        [JsonIgnore]
        public string LastUpdatedBy { get; set; }
        [JsonProperty("id")]
        public double id { get; set; }
        public PlayerActor(double id, double x, double y)
        {
            this.id = id;
            this.x = x;
            this.y = y;
        }
    }

    public class WorldInfo
    {
        [JsonProperty]
        public List<PlayerActor> playerlist { get; set; }
        public WorldInfo()
        {
            playerlist = new List<PlayerActor>();
        }
    }

    public class RemotePlayer
    {
        PlayerActor _playerShape;
        string _connectionID;
        int _ID;
        public RemotePlayer(string connectionID, int ID)
        {
            _connectionID = connectionID;
            _playerShape = new PlayerActor(ID, 0, 0);
            _playerShape.x = 0;
            _playerShape.y = 0;
            _playerShape.LastUpdatedBy = connectionID;
            _ID = ID;
            _playerShape.id = ID;
        }
        public RemotePlayer(string connectionID, int ID, PlayerActor player)
        {
            _connectionID = connectionID;
            _playerShape = player;
            _ID = ID;
        }
        public PlayerActor getPlayerShape()
        {
            return _playerShape;
        }

        public void setPosition(double left, double top)
        {
            _playerShape.x = left;
            _playerShape.y = top;
        }
    }
}
