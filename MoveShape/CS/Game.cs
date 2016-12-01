using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Web;

namespace Hatsoff
{

    public class Game
    {
        private double npcid = 0;
        private Broadcaster _broadcaster;
        public QuadTree overworldcollisions;
        private Random _rand;
        public ConcurrentDictionary<string, MapState> mapstates;
        public GameData gameData;
        public List<Battle> battles;
       
        public ConcurrentDictionary<string, RemotePlayer> connectedPlayers;
        public int newID = 0;

        public Game()
        {
            connectedPlayers    = new ConcurrentDictionary<string, RemotePlayer>();
            gameData            = new GameData();
            _rand               = new Random();
            mapstates           = new ConcurrentDictionary<string, MapState>();
            overworldcollisions = new QuadTree(0, new Rectangle(new Vec2(1600, 1600), 3200, 3200));
            battles             = new List<Battle>();

            foreach (KeyValuePair<string, Map> m in gameData.maps)
            {
                mapstates.TryAdd(m.Key, new MapState());
            }
            for (int i = 0; i < 10; i++)
            {
                addNpc("Overworld", new Vec2(_rand.NextDouble() * 600, _rand.NextDouble() * 600));    
            }
        }

        public void Init(Broadcaster broadcaster)
        {
            _broadcaster = broadcaster;
        }

        public void Tick()
        {

            foreach(var area in mapstates)
            {
                foreach(var npc in area.Value.npclist)
                {
                     if(npc.Update())
                    {
                        _broadcaster.updatedNpcs[npc.areaname].Add(npc);
                        _broadcaster.updateNpcs = true;
                    }
                }
            }

            foreach(Battle b in battles)
            {
                if (b.Update())
                {
                    ClientBattleInformation binfo = b.GenerateBattleInfo();
                    _broadcaster.updatedBattles[b.player1.areaname].Add(binfo);
                }
            }
            //remove ended battles
            for(int i = battles.Count - 1; i >= 0; i--)
            {
                if(battles[i].end)
                {
                    battles.RemoveAt(i);
                }
            }

            overworldcollisions.Clear();
            foreach (KeyValuePair<string, RemotePlayer> p in connectedPlayers)
            {
                overworldcollisions.Insert(p.Value.getCollCircle());
            }
            foreach (Npc n in mapstates["Overworld"].npclist)
            {
                overworldcollisions.Insert(n.collision);
            }
        }

        private void addNpc(string area, Vec2 pos)
        {
            Npc npc = new Npc(new Item(MyRandom.rand.Next(2), 1), 1, pos, true, npcid++, area);
            overworldcollisions.Insert(new CollisionCircle(npc.collision));
            mapstates[area].npclist.Add(npc);
        }

        public int NewId()
        {
            newID++;
            return newID;
        }

        public void PlayerDisconnect(string connectionId)
        {
            try
            {
                RemotePlayer dPlayer;
                connectedPlayers.TryRemove(connectionId, out dPlayer);
                mapstates[dPlayer.areaname].playerlist.Remove(dPlayer.GetPlayerShape());
                _broadcaster.disconnctedPlayers.Add(dPlayer.GetPlayerShape());
                _broadcaster.playerDisconnected = true;
            }

            catch (ArgumentNullException ex)
            {

            }
        }


        internal void UpdateBattle(PlayerActor player, BattleAction action)
        {
            RemotePlayer p;
            if (!connectedPlayers.TryGetValue(player.LastUpdatedBy, out p))
                return; //Just In Case

            //Check that the owner was the one who moved the actor
            if (p.GetPlayerShape().LastUpdatedBy == p.GetPlayerShape().owner)
            {
                if(p.GetPlayerShape().myturn)
                    p.GetPlayerShape().action = action;
            }
        }
        internal void NewMessage(PlayerActor player, string message)
        {
            RemotePlayer p;
            connectedPlayers.TryGetValue(player.LastUpdatedBy, out p);
            if (p == null)
                return; //Just In Case

            ConcurrentDictionary<RemotePlayer, List<string>> areamessages;
            _broadcaster.sentMessages.TryGetValue(p.areaname, out areamessages);

            if (areamessages == null)
            {
                Debug.WriteLine("Invalid areaname '{0}' on player", p.areaname);
                return;
            }

            //TODO: Possible race condition on messages list?
            //if NewMessage is called with the same PlayerActor
            //multiple times concurrently ... somehow
            List<string> messages;
            if (areamessages.TryGetValue(p, out messages))
            {
                messages.Add(player.name + ": " + message);
            }
            else
            {
                messages = new List<string>();
                messages.Add(player.name + ": " + message);
               
                areamessages.TryAdd(p, messages);
            }
            _broadcaster.newMessage = true;
        }

        public void PlayerJoinedArea(string connectionId, RemotePlayer p)
        {
            try
            {
                _broadcaster.joinedPlayers[p.areaname].Add(p.GetPlayerShape());
                _broadcaster.updatedPlayers[p.areaname].Remove(p.GetPlayerShape());
                _broadcaster.playerJoinedArea = true;
            }
            catch (Exception)
            {

            }
        }
        public void PlayerLeftArea(string connectionId, RemotePlayer p)
        {            
            try
            {
                _broadcaster.leftPlayers[p.areaname].Add(p.GetPlayerShape());
                _broadcaster.updatedPlayers[p.areaname].Remove(p.GetPlayerShape());
                _broadcaster.playerLeftArea = true;
            }
            catch (Exception)
            {

            }
        }

        public void AddPlayer(string connectionid, string name)
        {
            int id = NewId();
            RemotePlayer newplayer = new RemotePlayer(connectionid, id, "Overworld", name);
            connectedPlayers.TryAdd(connectionid, newplayer);
            mapstates["Overworld"].playerlist.Add(newplayer.GetPlayerShape());
            newplayer.Teleport(GameData.data.maps["Overworld"].spawnpoint.getCenter());
            PlayerJoinedArea(connectionid, newplayer);
            _broadcaster.SendPlayerId(connectionid, id);
            _broadcaster.TeleportPlayer(connectionid, newplayer.GetPosition());
            overworldcollisions.Insert(new CollisionCircle(newplayer.getCollCircle()));
        }

        internal void UpdateStatus(string connectionId, int selectedhat)
        {
            RemotePlayer p;
            
            if (!connectedPlayers.TryGetValue(connectionId, out p))
            {
                Debug.WriteLine("UpdateStatus called with playerless connectionId");
                return;
            }
            if (p.GetPlayerShape().EquipItem(selectedhat))
            {
                _broadcaster.SendUpdatedStatus(connectionId, p.GetPlayerShape());
                _broadcaster.updatedPlayers[p.areaname].Add(p.GetPlayerShape());
                _broadcaster.playerShapeChanged = true;
            }
        }

        public void Message(string cmd, string attribs, string connectionId)
        {
            RemotePlayer p;
             if (!connectedPlayers.TryGetValue(connectionId, out p))
            {
                Debug.WriteLine("Message called with playerless connectionId");
                return;
            }

            if (cmd == "areachangetrigger")
            {
                if (gameData.maps.ContainsKey(attribs))
                {
                    if (Collision.TestCircleCollision(p.GetPosition(), 50, gameData.maps[p.areaname].triggerareas[attribs].getCenter(), 50))
                    {
                        ChangePlayerArea(p, connectionId, attribs);
                    }
                }
            }
            else if (cmd == "playerhittrigger")
            {
                List<CollisionCircle> posCollisions = new List<CollisionCircle>();
                overworldcollisions.Retrieve(posCollisions, new CollisionCircle(p.getCollCircle()));
                foreach (var collision in posCollisions)
                {
                    if (Collision.TestCircleCollision(p.GetPosition(), 50, collision.getCenter(), 50))
                    {
                        if (collision.getType() == CollisionCircle.ObjectType.PLAYER)
                        {
                            RemotePlayer rp = (RemotePlayer)collision.getObject();
                            if (rp != p && (int)rp.GetPlayerShape().id == int.Parse(attribs))
                            {
                                if(rp.currentbattle != null)
                                {
                //                    Battle b = new Battle(p, rp);
                //                    battles.Add(b);
                //                    _broadcaster.StartBattle(b);
                                }
                            }
                        }
                    }
                }
            }
            else if (cmd == "npchittrigger")
            {
                List<CollisionCircle> posCollisions = new List<CollisionCircle>();
                overworldcollisions.Retrieve(posCollisions, new CollisionCircle(p.getCollCircle()));
                foreach (var collision in posCollisions)
                {
                    if (Collision.TestCircleCollision(p.GetPosition(), 50, collision.getCenter(), 100))
                    {
                        if (collision.getType() == CollisionCircle.ObjectType.NPC)
                        {
                            
                            Npc npc = (Npc)collision.getObject();
                            if (npc.state != Npc.NPC_STATE.BATTLE)
                            {
                  //              Battle b = new Battle(npc, p);
                  //              npc.state = Npc.NPC_STATE.BATTLE;
                  //              battles.Add(b);
                  //              _broadcaster.StartBattle(b);
                            }
                        }
                    }
                }
            }
        }

        private void ChangePlayerArea(RemotePlayer p, string connectionId, string targetArea)
        {
            if (targetArea == "Town")
            {
                p.GetPlayerShape().insafezone = true;
                p.GetPlayerShape().lastbattletimer = 0;
            }
            else if (targetArea == "Overworld")
            {
                p.GetPlayerShape().insafezone = false;
                p.GetPlayerShape().lastbattletimer = 0;
            }
            Vec2 fromareapos = gameData.maps[targetArea].triggerareas[p.areaname].getCenter();
            p.Teleport(fromareapos);
            PlayerLeftArea(connectionId, p);
            //delete player from areas playerlist
            mapstates[p.areaname].playerlist.Remove(p.GetPlayerShape());
            //add the player to the new area
            mapstates[targetArea].playerlist.Add(p.GetPlayerShape());
            p.areaname = targetArea;
            PlayerJoinedArea(connectionId, p);
            _broadcaster.MovePlayerInNewZone(connectionId, fromareapos);
        }

        public void UpdateShape(PlayerActor player)
        {
            //TODO: Make player gradually move ovetime 
            RemotePlayer p;
            if (!connectedPlayers.TryGetValue(player.LastUpdatedBy, out p))
                return; //Just In Case

            //Check that the owner was the one who moved the actor
            if (p.GetPlayerShape().LastUpdatedBy == p.GetPlayerShape().owner)
            {
                if (p.lockmoving) return;
                bool hit = false;
                //Temporary simple tile check
                var tm = p.areaname;
                Map map;
                if (gameData.maps.TryGetValue(tm, out map))
                {
                    var tile = map.tilemap.getTileInRealCoordinates((int)player.pos.x, (int)player.pos.y);
                    if ((tile == null) || tile.isBlocking)
                        hit = true;
                }
                if (hit)
                {
                    Vec2 temp = p.GetRecordedPos(1);
                    p.Teleport(temp);
                    _broadcaster.playerShapeChanged = true;
                    _broadcaster.TeleportPlayer(p.GetPlayerShape().owner, temp);
                }
                else
                {
                    if(!p.SetPosition(player.pos))
                    {
                        _broadcaster.TeleportPlayer(p.GetPlayerShape().LastUpdatedBy, p.GetPosition());
                    }
                    _broadcaster.updatedPlayers[p.areaname].Add(p.GetPlayerShape());
                    _broadcaster.playerShapeChanged = true;
                }
            }
        }
    }
}