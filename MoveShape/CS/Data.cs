using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.IO;
using System.Diagnostics;

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

    public class ItemModifier
    {
        [JsonProperty("name")]
        public string name;
        [JsonProperty("modifier")]
        public double modifier;
        public ItemModifier()
        {

        }
        public ItemModifier(string name)
        {
            this.name = name;
        }
    }

    public class GameData
    {
        public Dictionary<int, BaseItem> items;
        public Dictionary<int, ItemAttribute> attributes;
        public Dictionary<int, ItemModifier> modifiers;
        public Dictionary<string, Map> maps;
        static public GameData data;

        public GameData()
        {
            JsonSerializer js = new JsonSerializer();
            maps = js.Deserialize<Dictionary<string, Map>>(new JsonTextReader(new StreamReader(Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath("~"), @"Data\maps.json"))));
            items = js.Deserialize<Dictionary<int, BaseItem>>(new JsonTextReader(new StreamReader(Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath("~"), @"Data\items.json"))));
            modifiers = js.Deserialize<Dictionary<int, ItemModifier>>(new JsonTextReader(new StreamReader(Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath("~"), @"Data\modifiers.json"))));
            attributes = js.Deserialize<Dictionary<int, ItemAttribute>>(new JsonTextReader(new StreamReader(Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath("~"), @"Data\attributes.json"))));
            foreach (var kv in maps)
            {
                var map = kv.Value;
                //construct tilemaps for our maps
                map.tilemap = new TileMap();
                try
                {
                    //and try to load them from Map.tilemapsource
                    map.tilemap.load(new StreamReader(Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath("~"), map.tilemapsource)));
                
                    foreach (var lm in map.tilemap.landMarks)
                    {
                        string portalTo;
                        if (lm.properties.TryGetValue("portalTo", out portalTo))
                        {
                            if (map.triggerareas.ContainsKey(portalTo))
                            {
                                Debug.WriteLine("Duplicate landmark key {0} in area {1}", portalTo, map.tilemapsource);
                                continue;
                            }
                            //Send the trigger area with an empty appearance
                            //Because it is already visible on client map
                            TriggerArea ta = new TriggerArea(lm.area.getCenter().x, lm.area.getCenter().y, lm.area.getWidth(), lm.area.getHeight(), "");

                            map.triggerareas.Add(portalTo, ta);
                        }
                        string str = "";
                        string minLvl = "" ;
                        string maxLvl = "";

                        if (lm.properties.TryGetValue("type", out str))
                        {
                            if (str == "spawnPoint")
                            {
                                map.spawnpoint = lm.area;
                            }
                            else
                            if (str == "npcSpawn")
                            {
                                if (lm.properties.TryGetValue("minLvl", out minLvl) && lm.properties.TryGetValue("maxLvl", out maxLvl))
                                {
                                    map.spawnareas.Add(new SpawnArea(lm.area, Int32.Parse(minLvl), Int32.Parse(maxLvl)));
                                }
                            }

                        }
                    }
                }
                catch (Exception e)
                {
                    throw e;
                    System.Diagnostics.Debug.WriteLine(e);
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