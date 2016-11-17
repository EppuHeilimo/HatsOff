using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Hatsoff
{
    public class Game
    {
        private Broadcaster _broadcaster;
        public QuadTree overworldcollisions;
        private Random _rand;
        public Dictionary<string, MapState> mapstates;
        public  GameData gameData;
        public ConcurrentDictionary<int, Battle> battles;
        public ConcurrentDictionary<string, RemotePlayer> connectedPlayers;
        public int newID = 0;

        public Game()
        {
            connectedPlayers    = new ConcurrentDictionary<string, RemotePlayer>();
            gameData            = new GameData();
            _rand               = new Random();
            mapstates           = new Dictionary<string, MapState>();
            overworldcollisions = new QuadTree(0, new Rectangle(new Vec2(1600, 1600), 3200, 3200));
            battles             = new ConcurrentDictionary<int, Battle>();

            foreach (KeyValuePair<string, Map> m in gameData.maps)
            {
                mapstates.Add(m.Key, new MapState());
            }
        }

        public void Init(Broadcaster broadcaster)
        {
            _broadcaster = broadcaster;
        }

        private void addNpc(string area, Vec2 pos)
        {
            Npc npc = new Npc(new Item(0, 1), 1, pos, true);
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

        }

        internal void NewMessage(PlayerActor player, string message)
        {
            //TODO: Make player gradually move ovetime 
            RemotePlayer p;
            connectedPlayers.TryGetValue(player.LastUpdatedBy, out p);
            ConcurrentDictionary<RemotePlayer, List<string>> areamessages;
            _broadcaster.sentMessages.TryGetValue(p.areaname, out areamessages);
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

        public void AddPlayer(string connectionid)
        {
            int id = NewId();
            RemotePlayer newplayer = new RemotePlayer(connectionid, id, "Overworld");
            connectedPlayers.TryAdd(connectionid, newplayer);
            mapstates["Overworld"].playerlist.Add(newplayer.GetPlayerShape());
            PlayerJoinedArea(connectionid, newplayer);
            _broadcaster.SendPlayerId(connectionid, id);
            overworldcollisions.Insert(new CollisionCircle(newplayer.getCollCircle()));
        }

        internal void UpdateStatus(string connectionId, int selectedhat)
        {
            RemotePlayer p;
            //TODO: add safety checks
            connectedPlayers.TryGetValue(connectionId, out p);
            if (p.GetPlayerShape().EquipItemInBattle(selectedhat))
            {
                _broadcaster.SendUpdatedStatus(connectionId, p.GetPlayerShape());
                _broadcaster.updatedPlayers[p.areaname].Add(p.GetPlayerShape());
                _broadcaster.playerShapeChanged = true;
            }
        }

        public void Message(string cmd, string attribs, string connectionId)
        {
            RemotePlayer p;
            connectedPlayers.TryGetValue(connectionId, out p);
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
            _broadcaster.MovePlayerInNewZone(connectionId, fromareapos);
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
                //Temporary simple tile check
                var tm = p.areaname;
                Map map;
                if (gameData.maps.TryGetValue(tm, out map))
                {
                    var tile = map.tilemap.getTileInRealCoordinates((int)player.x, (int)player.y);
                    if ((tile == null) || tile.isBlocking)
                        hit = true;
                }
                if (hit)
                {
                    Vec2 temp = p.GetRecordedPos(1);
                    p.SetPosition(temp.x, temp.y);
                    _broadcaster.playerShapeChanged = true;
                    _broadcaster.TeleportPlayer(p.GetPlayerShape().owner, temp);
                }
                else
                {
                    p.SetPosition(player.x, player.y);
                    _broadcaster.updatedPlayers[p.areaname].Add(p.GetPlayerShape());
                    _broadcaster.playerShapeChanged = true;
                }
            }
        }
    }
}