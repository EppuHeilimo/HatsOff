using System;
using System.Collections.Concurrent;
using System.Threading;
using Microsoft.AspNet.SignalR;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web.UI.WebControls;

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
        private bool _playerChangedMap = false;
        public int _newID = 0;
        private ConcurrentDictionary<string, RemotePlayer> connectedPlayers;
        //zone, player
        private ConcurrentDictionary<string, List<PlayerActor>> _updatedPlayers;
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
            _updatedPlayers = new ConcurrentDictionary<string, List<PlayerActor>>();
        }
        public void Broadcast(object state)
        {

            // This is how we can access the Clients property 
            // in a static hub method or outside of the hub entirely
            if(_modelUpdated)
            {
                if (_updatedPlayers.Count > 0)
                {
                    //clone dictionary so we can process in peace
                    var updatedPlayers = new ConcurrentDictionary<string, List<PlayerActor>>(_updatedPlayers);
                    _updatedPlayers.Clear();
                    foreach (KeyValuePair<string, List<PlayerActor>> area in updatedPlayers)
                    {
                        List<string> clientsinarea = new List<string>();
                        foreach (var player in _gamedata.maps[area.Key].mapstate.playerlist)
                        {
                            clientsinarea.Add(player.owner);
                        }
                        _hubContext.Clients.Clients(clientsinarea).updateShapes(area.Value);
                    }
                    _modelUpdated = false;

                }

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
        public void UpdateShape(PlayerActor player)
        {
            //TODO: Make player gradually move ovetime 
            RemotePlayer p;
            connectedPlayers.TryGetValue(player.LastUpdatedBy, out p);
            //Check that the owner was the one who moved the actor
            if (p.getPlayerShape().LastUpdatedBy == p.getPlayerShape().owner)
            {
                p.setPosition(player.x, player.y);
                if (_updatedPlayers.ContainsKey(p.getPlayerShape().areaname))
                {
                    _updatedPlayers[player.areaname].Add(p.getPlayerShape());
                }
                else
                {
                    _updatedPlayers.TryAdd(p.getPlayerShape().areaname, new List<PlayerActor>());
                    _updatedPlayers[p.getPlayerShape().areaname].Add(p.getPlayerShape());                  
                }
                _modelUpdated = true;
            }
        }

        public void Message(string cmd, string attribs, string connectionId)
        {
            RemotePlayer p;
            connectedPlayers.TryGetValue(connectionId, out p);
            if(cmd == "areatrigger")
            {
                if (Collision.TestCircleCollision(p.getPosition(), 50, _gamedata.maps[p.getPlayerShape().areaname].triggerareas[attribs].getCenter(), 50))
                {
                    ChangePlayerArea(0, 0, p, connectionId, attribs);
                }
            }
        }

        private void ChangePlayerArea(double x, double y, RemotePlayer p, string connectionId, string targetArea)
        {
            p.setPosition(x, y);
            _hubContext.Clients.Client(connectionId).teleport(0, 0);
            PlayerLeftArea(connectionId, p);
            //delete player from areas playerlist
            _gamedata.maps[p.getPlayerShape().areaname].mapstate.playerlist.Remove(p.getPlayerShape());
            //add the player to the new area
            _gamedata.maps[targetArea].mapstate.playerlist.Add(p.getPlayerShape());
            p.getPlayerShape().areaname = targetArea;
            PlayerJoinedArea(connectionId, p);
            ChangeMap(connectionId);
        }

        public void PlayerJoinedArea(string connectionId, RemotePlayer p)
        {
            List<string> clientsInArea = new List<string>();
            foreach (PlayerActor player in _gamedata.maps[p.getPlayerShape().areaname].mapstate.playerlist)
            {
                if (connectionId == player.owner) continue;
                clientsInArea.Add(player.owner);
            }
            _hubContext.Clients.Clients(clientsInArea).playerJoinedArea(p.getPlayerShape());
            try
            {
                _updatedPlayers[p.getPlayerShape().areaname].Remove(p.getPlayerShape());
            }
            catch (Exception)
            {

            }

        }

        public void PlayerLeftArea(string connectionId, RemotePlayer p)
        {
            List<string> clientsInArea = new List<string>();
            foreach (PlayerActor player in _gamedata.maps[p.getPlayerShape().areaname].mapstate.playerlist)
            {
                if(connectionId == player.owner) continue;
                clientsInArea.Add(player.owner);
            }
            _hubContext.Clients.Clients(clientsInArea).playerLeftArea(p.getPlayerShape().id);
           
        }

        private void ChangeMap(string connectionId)
        {
            _hubContext.Clients.Client(connectionId).changeMap();
        }

        public void AddPlayer(string connectionid)
        {
            int id = NewID();
            RemotePlayer newplayer = new RemotePlayer(connectionid, id);
            connectedPlayers.TryAdd(connectionid, newplayer);
            _gamedata.maps["Overworld"].mapstate.playerlist.Add(newplayer.getPlayerShape());
            PlayerJoinedArea(connectionid, newplayer);
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
        private readonly Broadcaster _broadcaster;
        public ConnectionHub()
            : this(Broadcaster.Instance)
        {
        }
        public ConnectionHub(Broadcaster broadcaster)
        {
            _broadcaster = broadcaster;
        }
        public void UpdateModel(PlayerActor player)
        {
            player.LastUpdatedBy = Context.ConnectionId;
            // Update the shape model within our broadcaster
            _broadcaster.UpdateShape(player);
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
