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
        private GameData _gamedata;
        private readonly static Lazy<Broadcaster> _instance =
            new Lazy<Broadcaster>(() => new Broadcaster());
        // We're going to broadcast to all clients a maximum of 25 times per second.
        private readonly TimeSpan BroadcastInterval =
            TimeSpan.FromMilliseconds(50);
        private readonly IHubContext _hubContext;
        private Timer _broadcastLoop;
        private bool _modelUpdated;
        private bool _playerDisconnected = false;
        public int _newID = 0;
        private ConcurrentDictionary<string, RemotePlayer> connectedPlayers;
        private List<PlayerActor> _updatedPlayers = new List<PlayerActor>();
        private List<PlayerActor> _disconnctedPlayers = new List<PlayerActor>();
        public Broadcaster()
        {
            // Save our hub context so we can easily use it 
            // to send to its connected clients
            _hubContext = GlobalHost.ConnectionManager.GetHubContext<ConnectionHub>();

            _modelUpdated = false;
            connectedPlayers = new ConcurrentDictionary<string, RemotePlayer>();
            // Start the broadcast loop
            _broadcastLoop = new Timer(
                Broadcast,
                null,
                BroadcastInterval,
                BroadcastInterval);
            _gamedata = new GameData();
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
                _gamedata.maps[dPlayer.getPlayerShape().areaname].mapstate.playerlist.Remove(dPlayer.getPlayerShape());
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

        public void Message(string cmd, string attribs, string connectionId)
        {
            RemotePlayer p;
            connectedPlayers.TryGetValue(connectionId, out p);
            if(cmd == "hittrigger")
            {
                if (Collision.TestCircleCollision(p.getPosition(), 50, _gamedata.maps[p.getPlayerShape().areaname].triggerareas[attribs].getCenter(), 50))
                {
                    p.setPosition(400, 400);
                    _hubContext.Clients.Client(connectionId).teleport(400, 400);
                }
            }

        }

        public void AddPlayer(string connectionid)
        {
            int id = NewID();
            RemotePlayer newplayer = new RemotePlayer(connectionid, id);
            connectedPlayers.TryAdd(connectionid, newplayer);
            _gamedata.maps["Overworld"].mapstate.playerlist.Add(newplayer.getPlayerShape());
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
            RemotePlayer p;
            connectedPlayers.TryGetValue(connectionId, out p);
            WorldInfo world = new WorldInfo(_gamedata.maps[p.getPlayerShape().areaname]);
            _hubContext.Clients.Client(connectionId).getWorldInfo(world);
        }
        
    }

    public class ConnectionHub : Hub
    {
        // Is set via the constructor on each creation
        private Broadcaster _broadcaster;
        public ConnectionHub()
            : this(Broadcaster.Instance)
        {
        }
        public ConnectionHub(Broadcaster broadcaster)
        {
            _broadcaster = broadcaster;
        }
        public void UpdateModel(PlayerActor clientModel)
        {
            clientModel.LastUpdatedBy = Context.ConnectionId;
            // Update the shape model within our broadcaster
            _broadcaster.UpdateShape(clientModel);
        }

        public void Message(string cmd, string attribs)
        {
            _broadcaster.Message(cmd, attribs, Context.ConnectionId);
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












}
