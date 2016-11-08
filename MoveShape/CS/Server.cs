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
        private bool _newMessage;
        private bool _playerDisconnected = false;
        public int _newID = 0;
        private Dictionary<string, MapState> mapstates;
        private ConcurrentDictionary<string, RemotePlayer> connectedPlayers;
        //zone, player
        private ConcurrentDictionary<string, List<PlayerActor>> _updatedPlayers;
        private List<PlayerActor> _disconnctedPlayers = new List<PlayerActor>();
        private QuadTree overworldcollisions;
        private ConcurrentDictionary<string, ConcurrentDictionary<RemotePlayer, List<string>>> _sentMessages;
        public Broadcaster()
        {
            // Save our hub context so we can easily use it 
            // to send to its connected clients
            _hubContext = GlobalHost.ConnectionManager.GetHubContext<ConnectionHub>();

            _modelUpdated = false;
            _newMessage = false;
            connectedPlayers = new ConcurrentDictionary<string, RemotePlayer>();
            _sentMessages = new ConcurrentDictionary<string, ConcurrentDictionary<RemotePlayer, List<string>>>();
            // Start the broadcast loop
            _broadcastLoop = new Timer(
                Broadcast,
                null,
                BroadcastInterval,
                BroadcastInterval);
            _gamedata = new GameData();
            _updatedPlayers = new ConcurrentDictionary<string, List<PlayerActor>>();
            mapstates = new Dictionary<string, MapState>();
            foreach(KeyValuePair<string, Map> m in _gamedata.maps)
            {
                mapstates.Add(m.Key, new MapState());
            }
            overworldcollisions = new QuadTree(0, new Rectangle(new Vec2(1600, 1600), 3200, 3200));
            /*
            foreach (var area in _gamedata.maps["Overworld"].triggerareas)
            {
                overworldcollisions.Insert(new CollisionCircle(area.Value.getCenter(), 50));
            }
            */
            foreach(KeyValuePair<string, MapState> m in mapstates)
            {
                _sentMessages.TryAdd(m.Key, new ConcurrentDictionary<RemotePlayer, List<string>>());
            }
        }
        public void Broadcast(object state)
        {
            bool somethingchanged = _modelUpdated || _playerDisconnected;
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
                        foreach (var player in mapstates[area.Key].playerlist)
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

            if(_newMessage)
            {
                foreach(KeyValuePair<string, ConcurrentDictionary<RemotePlayer, List<string>>> area in _sentMessages )
                {
                    if(area.Value.Count > 0)
                    {
                        foreach(KeyValuePair<RemotePlayer, List<string>> p in area.Value)
                        {
                            List<string> clientsinarea = new List<string>();
                            foreach (var player in mapstates[p.Key.areaname].playerlist)
                            {
                                clientsinarea.Add(player.owner);
                            }
                            _hubContext.Clients.Clients(clientsinarea).say(p.Key.GetPlayerShape(), p.Value);
                        }
                        area.Value.Clear();
                    }
                }
                _newMessage = false;


            }
            if(somethingchanged)
            {
                overworldcollisions.Clear();
                foreach (KeyValuePair<string, RemotePlayer> p in connectedPlayers)
                {
                    overworldcollisions.Insert(p.Value.getCollCircle());
                }
            }
        }

        public void PlayerDisconnect(string connectionId)
        {
            try
            {
                RemotePlayer dPlayer;
                connectedPlayers.TryRemove(connectionId, out dPlayer);
                mapstates[dPlayer.areaname].playerlist.Remove(dPlayer.GetPlayerShape());
                _disconnctedPlayers.Add(dPlayer.GetPlayerShape());
                _playerDisconnected = true;
            }

            catch (ArgumentNullException ex)
            {
                
            }

        }

        public int NewId()
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
            if (p.GetPlayerShape().LastUpdatedBy == p.GetPlayerShape().owner)
            {
                bool hit = false;

                List<CollisionCircle> posCollisions = new List<CollisionCircle>();
                    
                overworldcollisions.Retrieve(posCollisions, new CollisionCircle(p.getCollCircle()));
                foreach (var collision in posCollisions)
                {
                    if (Collision.TestCircleCollision(new Vec2(player.x, player.y), 30, collision.getCenter(), 30))
                    {
                        if (collision.getType() == CollisionCircle.ObjectType.PLAYER && (RemotePlayer)collision.getObject() != p)
                        {
                                
                        }
                    }
                }
                
                //Temporary simple tile check
                var tm = p.areaname;
                Map map;
                if (_gamedata.maps.TryGetValue(tm, out map))
                {
                    var tile = map.tilemap.getTileInRealCoordinates((int)player.x, (int)player.y);
                    if ((tile == null) || tile.isBlocking)
                        hit = true;
                }


                if (hit)
                {
                    Vec2 temp = p.GetRecordedPos(1);
                    p.SetPosition(temp.x, temp.y);
                    _modelUpdated = true;
                    _hubContext.Clients.Client(p.GetPlayerShape().LastUpdatedBy).teleport(temp.x, temp.y);
                }
                else
                {
                    p.SetPosition(player.x, player.y);
                    if (_updatedPlayers.ContainsKey(p.areaname))
                    {
                        _updatedPlayers[p.areaname].Add(p.GetPlayerShape());
                    }
                    else
                    {
                        _updatedPlayers.TryAdd(p.areaname, new List<PlayerActor>());
                        _updatedPlayers[p.areaname].Add(p.GetPlayerShape());
                    }
                    _modelUpdated = true;
                }
            }
        }

        public void Message(string cmd, string attribs, string connectionId)
        {
            RemotePlayer p;
            connectedPlayers.TryGetValue(connectionId, out p);
            if(cmd == "areachangetrigger")
            {
                if (_gamedata.maps.ContainsKey(attribs))
                {
                    if (Collision.TestCircleCollision(p.GetPosition(), 50, _gamedata.maps[p.areaname].triggerareas[attribs].getCenter(), 50))
                    {
                        ChangePlayerArea(p, connectionId, attribs);
                    }
                }
            }
        }

        private void ChangePlayerArea(RemotePlayer p, string connectionId, string targetArea)
        {
            Vec2 fromareapos = _gamedata.maps[targetArea].triggerareas[p.areaname].getCenter();
            p.SetPosition(fromareapos.x, fromareapos.y);
            p.GetPlayerShape().x = fromareapos.x;
            p.GetPlayerShape().y = fromareapos.y;
            PlayerLeftArea(connectionId, p);
            //delete player from areas playerlist
            mapstates[p.areaname].playerlist.Remove(p.GetPlayerShape());
            //add the player to the new area
            mapstates[targetArea].playerlist.Add(p.GetPlayerShape());
            p.areaname = targetArea;
            PlayerJoinedArea(connectionId, p);
            ChangeMap(connectionId, fromareapos);
        }

        public void PlayerJoinedArea(string connectionId, RemotePlayer p)
        {
            List<string> clientsInArea = new List<string>();
            foreach (PlayerActor player in mapstates[p.areaname].playerlist)
            {
                if (connectionId == player.owner) continue;
                clientsInArea.Add(player.owner);
            }
            _hubContext.Clients.Clients(clientsInArea).playerJoinedArea(p.GetPlayerShape());
            try
            {
                _updatedPlayers[p.areaname].Remove(p.GetPlayerShape());
            }
            catch (Exception)
            {

            }

        }

        public void PlayerLeftArea(string connectionId, RemotePlayer p)
        {
            List<string> clientsInArea = new List<string>();
            foreach (PlayerActor player in mapstates[p.areaname].playerlist)
            {
                if(connectionId == player.owner) continue;
                clientsInArea.Add(player.owner);
                
            }
            _hubContext.Clients.Clients(clientsInArea).playerLeftArea(p.GetPlayerShape().id);
           
        }

        private void ChangeMap(string connectionId, Vec2 newpos)
        {
            
            _hubContext.Clients.Client(connectionId).changeMap();
            _hubContext.Clients.Client(connectionId).teleport(newpos.x, newpos.y);
        }

        public void AddPlayer(string connectionid)
        {
            int id = NewId();
            RemotePlayer newplayer = new RemotePlayer(connectionid, id, "Overworld");
            connectedPlayers.TryAdd(connectionid, newplayer);
            mapstates["Overworld"].playerlist.Add(newplayer.GetPlayerShape());
            PlayerJoinedArea(connectionid, newplayer);
            _hubContext.Clients.Client(connectionid).getMyID(id);
            overworldcollisions.Insert(new CollisionCircle(newplayer.getCollCircle()));
        }

        public static Broadcaster Instance
        {
            get
            {
                return _instance.Value;
            }
        }

        internal void SendAreaInfo(string connectionId)
        {
            RemotePlayer p;
            connectedPlayers.TryGetValue(connectionId, out p);
            WorldInfo world = new WorldInfo(mapstates[p.areaname], p.areaname);
            _hubContext.Clients.Client(connectionId).getAreaInfo(world);
        }
        public void SendGameInfo(string connectionId)
        {
            _hubContext.Clients.Client(connectionId).getGameInfo(_gamedata);
        }

        internal void NewMessage(PlayerActor player, string message)
        {
            //TODO: Make player gradually move ovetime 
            RemotePlayer p;
            connectedPlayers.TryGetValue(player.LastUpdatedBy, out p);
            ConcurrentDictionary<RemotePlayer, List<string>> areamessages;
            _sentMessages.TryGetValue(p.areaname, out areamessages);
            if (areamessages.ContainsKey(p))
            {
                List<string> messages;
                areamessages.TryGetValue(p, out messages);
                messages.Add(player.name + ": " + message);
            }
            else
            {
                List<string> messages = new List<string>();
                messages.Add(player.name + ": " + message);
                areamessages.TryAdd(p, messages);
            }
            _newMessage = true;
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
        public void GetAreaInfo()
        {
            _broadcaster.SendAreaInfo(Context.ConnectionId);
        }
        public void NewMessage(PlayerActor p, string message)
        {
            p.LastUpdatedBy = Context.ConnectionId;
            _broadcaster.NewMessage(p, message);
        }

        public override Task OnDisconnected(bool stopCalled)
        {
            _broadcaster.PlayerDisconnect(Context.ConnectionId);
            return base.OnDisconnected(stopCalled);
        }
        public void GetGameInfo()
        {
            _broadcaster.SendGameInfo(Context.ConnectionId);
        }
    }
}
