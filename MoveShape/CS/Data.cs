using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.IO;

namespace Hatsoff
{
    public class GameData
    {
        public Dictionary<string, Map> maps;

        public GameData()
        {
            JsonSerializer js = new JsonSerializer();
            maps = js.Deserialize<Dictionary<string, Map>>(new JsonTextReader(new StreamReader(Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath("~"), @"Data\maps.json"))));

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