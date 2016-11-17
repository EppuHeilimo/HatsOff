using System;
using System.Collections.Concurrent;
using System.Threading;
using Microsoft.AspNet.SignalR;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web.UI.WebControls;
using System.Diagnostics;

namespace Hatsoff
{
    public class Broadcaster
    {
        private readonly static Lazy<Broadcaster> _instance =
            new Lazy<Broadcaster>(() => new Broadcaster());

        // Broadcast to clients every 50 millseconds
        private readonly TimeSpan BroadcastInterval = TimeSpan.FromMilliseconds(50);
        private readonly IHubContext _hubContext;
        private Timer _broadcastLoop;

        public Game game;

        //Flags
        public bool battlesChanged;
        public bool updateNpcs;
        public bool playerShapeChanged;
        public bool newMessage;
        public bool playerDisconnected;
        public bool playerJoinedArea;
        public bool playerLeftArea;
        public Stopwatch asd = new Stopwatch();

        //Updated objects
        public ConcurrentDictionary<string, List<PlayerActor>> updatedPlayers;
        public List<PlayerActor> disconnctedPlayers = new List<PlayerActor>();
        public ConcurrentDictionary<string, ConcurrentDictionary<RemotePlayer, List<string>>> sentMessages;
        public ConcurrentDictionary<string, List<PlayerActor>> joinedPlayers;
        public ConcurrentDictionary<string, List<PlayerActor>> leftPlayers;
        public ConcurrentDictionary<string, List<Battle>> updatedBattles;

        public Broadcaster()
        {
            battlesChanged       = false;
            updateNpcs           = false;
            playerShapeChanged   = false;
            newMessage           = false;
            playerDisconnected   = false;
            playerJoinedArea     = false;
            playerLeftArea       = false;
            _hubContext          = GlobalHost.ConnectionManager.GetHubContext<ConnectionHub>();
            
            updatedBattles       = new ConcurrentDictionary<string, List<Battle>>();
            sentMessages         = new ConcurrentDictionary<string, ConcurrentDictionary<RemotePlayer, List<string>>>();
            updatedPlayers       = new ConcurrentDictionary<string, List<PlayerActor>>();
            joinedPlayers        = new ConcurrentDictionary<string, List<PlayerActor>>();
            leftPlayers          = new ConcurrentDictionary<string, List<PlayerActor>>();

            game = new Game();
            game.Init(this);

            foreach (KeyValuePair<string, MapState> m in game.mapstates)
            {
                sentMessages.TryAdd(m.Key, new ConcurrentDictionary<RemotePlayer, List<string>>());
            }

            foreach (KeyValuePair<string, MapState> area in game.mapstates)
            {
                updatedBattles.TryAdd(area.Key, new List<Battle>());
                updatedPlayers.TryAdd(area.Key, new List<PlayerActor>());
                joinedPlayers.TryAdd(area.Key, new List<PlayerActor>());
                leftPlayers.TryAdd(area.Key, new List<PlayerActor>());
            }
            _broadcastLoop = new Timer(Broadcast, null, BroadcastInterval, BroadcastInterval);
            asd.Start();
        }

        public static Broadcaster Instance
        {
            get { return _instance.Value; }
        }

        public void Broadcast(object state)
        {
            asd.Stop();
            Debug.WriteLine(asd.ElapsedMilliseconds);
            asd.Start();
            bool collisionupdate = playerShapeChanged || playerDisconnected;
            // This is how we can access the Clients property 
            // in a static hub method or outside of the hub entirely
            if(playerShapeChanged)
            {
                playerShapeChanged = false;
                if (updatedPlayers.Count > 0)
                {
                    foreach (KeyValuePair<string, List<PlayerActor>> area in updatedPlayers)
                    {
                        List<string> clientsinarea = new List<string>();
                        foreach (var player in game.mapstates[area.Key].playerlist)
                        {
                            clientsinarea.Add(player.owner);
                        }
                        _hubContext.Clients.Clients(clientsinarea).updateShapes(area.Value);
                        area.Value.Clear();
                    }          
                }
            }

            if (playerJoinedArea)
            {
                playerJoinedArea = false;
                foreach (KeyValuePair<string, List<PlayerActor>> area in joinedPlayers)
                {
                    if (area.Value.Count == 0) continue;
                    List<string> clientsInArea = new List<string>();
                    foreach (PlayerActor player in game.mapstates[area.Key].playerlist)
                    {
                        bool send = true;
                        foreach (PlayerActor p in area.Value)
                        {
                            if (p.owner == player.owner)
                                send = false;
                        }
                        if (!send) continue;
                        clientsInArea.Add(player.owner);
                    }
                    _hubContext.Clients.Clients(clientsInArea).addPlayers(area.Value);
                    area.Value.Clear();
                }
            }

            if (playerLeftArea)
            {
                playerLeftArea = false;
                foreach (KeyValuePair<string, List<PlayerActor>> area in leftPlayers)
                {
                    if (area.Value.Count == 0) continue;
                    List<string> clientsInArea = new List<string>();
                    foreach (PlayerActor player in game.mapstates[area.Key].playerlist)
                    {
                        bool send = true;
                        foreach (PlayerActor p in area.Value)
                        {
                            if (p.owner == player.owner)
                                send = false;
                        }
                        if (!send) continue;
                        clientsInArea.Add(player.owner);
                    }
                    _hubContext.Clients.Clients(clientsInArea).playersLeftArea(area.Value);
                    area.Value.Clear();
                }
            }

            if (playerDisconnected)
            {
                _hubContext.Clients.All.playerDisconnected(disconnctedPlayers);
                playerDisconnected = false;
            }

            if(newMessage)
            {
                newMessage = false;
                foreach (KeyValuePair<string, ConcurrentDictionary<RemotePlayer, List<string>>> area in sentMessages)
                {
                    if(area.Value.Count > 0)
                    {
                        foreach(KeyValuePair<RemotePlayer, List<string>> p in area.Value)
                        {
                            List<string> clientsinarea = new List<string>();
                            foreach (var player in game.mapstates[p.Key.areaname].playerlist)
                            {
                                clientsinarea.Add(player.owner);
                            }
                            _hubContext.Clients.Clients(clientsinarea).say(p.Key.GetPlayerShape(), p.Value);
                        }
                        area.Value.Clear();
                    }
                }   
            }

            if (collisionupdate)
            {
                game.overworldcollisions.Clear();
                foreach (KeyValuePair<string, RemotePlayer> p in game.connectedPlayers)
                {
                    game.overworldcollisions.Insert(p.Value.getCollCircle());
                }
            }
            game.Tick();
        }   

        internal void SendAreaInfo(string connectionId)
        {
            
            RemotePlayer p;
            if (!game.connectedPlayers.TryGetValue(connectionId, out p))
            {
                Debug.WriteLine("SendAreaInfo called with playerless connectionId");
                return;
            }
            WorldInfo world = new WorldInfo(game.mapstates[p.areaname], p.areaname);
            _hubContext.Clients.Client(connectionId).getAreaInfo(world);
        }

        public void SendGameInfo(string connectionId)
        {
            _hubContext.Clients.Client(connectionId).getGameInfo(game.gameData);
        }

        public void SendPlayerId(string connectionId, int id)
        {
            _hubContext.Clients.Client(connectionId).getMyID(id);
        }

        public void SendUpdatedStatus(string connectionId, PlayerActor player)
        {
            _hubContext.Clients.Client(connectionId).updateMyStatus(player.inventory, player.stats);
        }

        public void MovePlayerInNewZone(string connectionId, Vec2 newpos)
        {
            _hubContext.Clients.Client(connectionId).changeMap();
            _hubContext.Clients.Client(connectionId).teleport(newpos.x, newpos.y);
        }

        public void TeleportPlayer(string connectionId, Vec2 pos)
        {
            _hubContext.Clients.Client(connectionId).teleport(pos.x, pos.y);
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
            _broadcaster.game.UpdateShape(player);
        }
        public void UpdateStatus(int selectedhat)
        {
            _broadcaster.game.UpdateStatus(Context.ConnectionId, selectedhat);
        }

        public void UpdateBattle(PlayerActor player, BattleAction action)
        {
            player.LastUpdatedBy = Context.ConnectionId;
            _broadcaster.game.UpdateBattle(player, action);
        }

        public void Message(string cmd, string attribs)
        {
            _broadcaster.game.Message(cmd, attribs, Context.ConnectionId);
        }
        public void AddPlayer()
        {
            _broadcaster.game.AddPlayer(Context.ConnectionId);
        }
        public void GetAreaInfo()
        {
            _broadcaster.SendAreaInfo(Context.ConnectionId);
        }
        public void NewMessage(PlayerActor p, string message)
        {
            p.LastUpdatedBy = Context.ConnectionId;
            _broadcaster.game.NewMessage(p, message);
        }

        public override Task OnDisconnected(bool stopCalled)
        {
            _broadcaster.game.PlayerDisconnect(Context.ConnectionId);
            return base.OnDisconnected(stopCalled);
        }

        public void GetGameInfo()
        {
            _broadcaster.SendGameInfo(Context.ConnectionId);
        }
    }


}
