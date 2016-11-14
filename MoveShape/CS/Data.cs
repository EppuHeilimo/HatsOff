using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.IO;

namespace Hatsoff
{
    public class ItemAttribute
    {
        [JsonProperty("name")]
        public string name;
        [JsonProperty("effect")]
        public string effect;
        public ItemAttribute()
        {

        }
        public ItemAttribute(string name)
        {
            this.name = name;
        }
    }

    public class GameData
    {
        public Dictionary<int, BaseItem> items;
        public Dictionary<int, ItemAttribute> attributes;
        public Dictionary<string, Map> maps;
        static public GameData data;

        public GameData()
        {
            JsonSerializer js = new JsonSerializer();
            maps = js.Deserialize<Dictionary<string, Map>>(new JsonTextReader(new StreamReader(Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath("~"), @"Data\maps.json"))));
            items = js.Deserialize<Dictionary<int, BaseItem>>(new JsonTextReader(new StreamReader(Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath("~"), @"Data\items.json"))));
            attributes = js.Deserialize<Dictionary<int, ItemAttribute>>(new JsonTextReader(new StreamReader(Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath("~"), @"Data\attributes.json"))));
            foreach (var map in maps)
            {
                //construct tilemaps for our maps
                map.Value.tilemap = new TileMap();
                try
                {
                    //and try to load them from Map.tilemapsource
                    map.Value.tilemap.load(new StreamReader(Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath("~"), map.Value.tilemapsource)));
                }
                catch (Exception e)
                {
                    System.Diagnostics.Debug.WriteLine(e.Message);
                }
                
            }
            data = this;
            /*
            Dictionary<string, TriggerArea> triggers = new Dictionary<string, TriggerArea>();

            triggers.Add("Town", new TriggerArea(200, 200, 100, 100));
            maps.Add("Overworld", new Map(triggers));

            Dictionary<string, TriggerArea> triggers2 = new Dictionary<string, TriggerArea>();

            triggers2.Add("Overworld", new TriggerArea(500, 100, 100, 100));
            maps.Add("Town", new Map(triggers2));
            */
        }
    }
    /*
        WorldInfo class represents data which is sent only once to player, on join. 
     */
    public class WorldInfo
    {
        [JsonProperty("mapstate")]
        public MapState mapstate;
        [JsonProperty("mapname")]
        public string mapname;
        public WorldInfo(MapState currentmap, string mapname)
        {
            this.mapname = mapname;
            mapstate = currentmap;
        }
    }
}