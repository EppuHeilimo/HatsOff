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
    public class TwoWayConcurrentDictionary<A, B>
    {
        public ConcurrentDictionary<A, B> internalContainer = new ConcurrentDictionary<A, B>();
        public ConcurrentDictionary<B, A> reverseContainer = new ConcurrentDictionary<B, A>();

        public bool TryAddPair(A a, B b)
        {
            if (internalContainer.TryAdd(a, b))
            {
                if (!reverseContainer.TryAdd(b, a))
                {
                    B dummy;
                    internalContainer.TryRemove(a, out dummy);
                    return false;
                }
            }
            else
                return false;
            return true;
        }

        public void RemovePair(A a, B b)
        {
            B dummyB;
            A dummyA;
            internalContainer.TryRemove(a, out dummyB);
            reverseContainer.TryRemove(b, out dummyA);
        }

    }
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
        public ConcurrentDictionary<string, List<Npc>> updatedNpcs;
        public List<PlayerActor> disconnctedPlayers = new List<PlayerActor>();
        public ConcurrentDictionary<string, ConcurrentDictionary<RemotePlayer, List<string>>> sentMessages;
        public ConcurrentDictionary<string, List<PlayerActor>> joinedPlayers;
        public ConcurrentDictionary<string, List<PlayerActor>> leftPlayers;
        public ConcurrentDictionary<string, List<ClientBattleInformation>> updatedBattles;

        public TwoWayConcurrentDictionary<string, string> connectionUserNames = new TwoWayConcurrentDictionary<string, string>();

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
            
            updatedBattles       = new ConcurrentDictionary<string, List<ClientBattleInformation>>();
            sentMessages         = new ConcurrentDictionary<string, ConcurrentDictionary<RemotePlayer, List<string>>>();
            updatedPlayers       = new ConcurrentDictionary<string, List<PlayerActor>>();
            joinedPlayers        = new ConcurrentDictionary<string, List<PlayerActor>>();
            leftPlayers          = new ConcurrentDictionary<string, List<PlayerActor>>();
            updatedNpcs          = new ConcurrentDictionary<string, List<Npc>>();

            game = new Game();
            game.Init(this);

            foreach (KeyValuePair<string, MapState> m in game.mapstates)
            {
                sentMessages.TryAdd(m.Key, new ConcurrentDictionary<RemotePlayer, List<string>>());
            }

            foreach (KeyValuePair<string, MapState> area in game.mapstates)
            {
                updatedBattles.TryAdd(area.Key, new List<ClientBattleInformation>());
                updatedPlayers.TryAdd(area.Key, new List<PlayerActor>());
                joinedPlayers.TryAdd(area.Key, new List<PlayerActor>());
                leftPlayers.TryAdd(area.Key, new List<PlayerActor>());
                updatedNpcs.TryAdd(area.Key, new List<Npc>());
            }

            _broadcastLoop = new Timer(Broadcast, null, BroadcastInterval, BroadcastInterval);
            asd.Start();
        }

        public static Broadcaster Instance
        {
            get { return _instance.Value; }
        }

        private Object _broadcast_lock = new Object();
        public void Broadcast(object state)
        {
            if (Monitor.TryEnter(_broadcast_lock))
            {
                try
                {
                    asd.Stop();
                    Debug.WriteLine(asd.ElapsedMilliseconds);
                    asd.Start();
                    bool collisionupdate = playerShapeChanged || playerDisconnected;
                    // This is how we can access the Clients property 
                    // in a static hub method or outside of the hub entirely
                    if (updateNpcs)
                    {
                        updateNpcs = false;
                        if (updatedNpcs.Count > 0)
                        {
                            foreach (var area in updatedNpcs)
                            {
                                List<string> clientsinarea = new List<string>();
                                foreach (var player in game.mapstates[area.Key].playerlist)
                                {
                                    clientsinarea.Add(player.owner);
                                }
                                _hubContext.Clients.Clients(clientsinarea).updateNpcs(area.Value);
                                area.Value.Clear();
                            }
                        }
                    }
                    if (playerShapeChanged)
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

                    if (newMessage)
                    {
                        newMessage = false;
                        foreach (KeyValuePair<string, ConcurrentDictionary<RemotePlayer, List<string>>> area in sentMessages)
                        {
                            if (area.Value.Count > 0)
                            {
                                foreach (KeyValuePair<RemotePlayer, List<string>> p in area.Value)
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

                    if(battlesChanged)
                    {
                       foreach(KeyValuePair<string, List<ClientBattleInformation>> area in updatedBattles)
                        {
                            if (area.Value.Count == 0) continue;
                            List<string> clientsInArea = new List<string>();
                            foreach (PlayerActor player in game.mapstates[area.Key].playerlist)
                            {
                                clientsInArea.Add(player.owner);
                            }
                            _hubContext.Clients.Clients(clientsInArea).battleAction(area.Value);
                            area.Value.Clear();
                        }
                    }
                    game.Tick();
                }
                finally
                {
                    Monitor.Exit(_broadcast_lock);
                }
            }
            else
            {
                Debug.WriteLine("Broadcaster skip tick");
            }
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

        internal void StartBattle(Battle b)
        {
            if (b.pvp)
            {
                _hubContext.Clients.Client(b.player1.GetPlayerShape().owner).startBattle(b.player2.GetPlayerShape().id, b.player1.GetPlayerShape().myturn, true);
                _hubContext.Clients.Client(b.player2.GetPlayerShape().owner).startBattle(b.player1.GetPlayerShape().id, b.player2.GetPlayerShape().myturn, true);
            }
            else
            {
                _hubContext.Clients.Client(b.player1.GetPlayerShape().owner).startBattle(b.npc.id, b.player1.GetPlayerShape().myturn, false);
            }
            
        }

        public void SendGameInfo(string connectionId)
        {
            _hubContext.Clients.Client(connectionId).getGameInfo(game.gameData);
        }

        public void SendPlayerId(string connectionId, int id, string name)
        {
            _hubContext.Clients.Client(connectionId).getMyID(id, name);
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

        private bool ValidatePlayer()
        {
            return _broadcaster.connectionUserNames.internalContainer.ContainsKey(Context.ConnectionId);
        }
        private bool ValidatePlayer(out string name)
        {
            return _broadcaster.connectionUserNames.internalContainer.TryGetValue(Context.ConnectionId, out name);
        }
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
            string name;
            if (ValidatePlayer(out name))
                _broadcaster.game.AddPlayer(Context.ConnectionId, name);
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
            string ts;

            if (ValidatePlayer())
                _broadcaster.game.PlayerDisconnect(Context.ConnectionId);
            if (_broadcaster.connectionUserNames.internalContainer.TryGetValue(Context.ConnectionId, out ts))
            {
                _broadcaster.connectionUserNames.RemovePair(Context.ConnectionId, ts);
            }
            return base.OnDisconnected(stopCalled);
        }
        
        public override Task OnConnected()
        {
            bool success = _broadcaster.connectionUserNames.TryAddPair(Context.ConnectionId, Context.User.Identity.Name);

            return base.OnConnected();
        }
        
        public void GetGameInfo()
        {
            _broadcaster.SendGameInfo(Context.ConnectionId);
        }
    }


}
