using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Newtonsoft.Json;

namespace Hatsoff
{
    public class Map
    {
        [JsonIgnore]
        public TileMap tilemap;

        [JsonProperty("spawnpoint")]
        public Rectangle spawnpoint;

        [JsonProperty("tilemap")]
        public string tilemapsource;

        [JsonProperty("triggerareas")]
        public Dictionary<string, TriggerArea> triggerareas = new Dictionary<string, TriggerArea>();


        [JsonProperty("spawnareas")]
        public List<SpawnArea> spawnareas = new List<SpawnArea>();

        public Map()
        {
        }
    }

    public class MapState
    {
        [JsonProperty("playerlist")]
        public List<PlayerActor> playerlist { get; set; }
        [JsonProperty("npclist")]
        public List<Npc> npclist { get; set; }
        public MapState()
        {
            playerlist = new List<PlayerActor>();
            npclist = new List<Npc>();
        }
    }

    public class TriggerArea
    {
        [JsonProperty("x")]
        private double _x;
        [JsonProperty("y")]
        private double _y;
        [JsonProperty("sizex")]
        private double _sizex;
        [JsonProperty("sizey")]
        private double _sizey;
        [JsonProperty("appearance")]
        private string appearance;
        public TriggerArea(double x, double y, double sizex, double sizey, string appearance)
        {
            _x = x;
            _y = y;
            _sizex = sizex;
            _sizey = sizey;
            this.appearance = appearance;
        }
        public Vec2 getCenter()
        {
            return new Vec2(_x, _y);
        }
    }


    public class SpawnArea
    {
        public Rectangle area;
        public int minLevel;
        public int maxLevel;
        public SpawnArea(Rectangle rect, int minl, int maxl)
        {
            area = rect;

            minLevel = minl;
            maxLevel = maxl;
        }
    }
}