using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Hatsoff
{
    public class GameData
    {
        public Dictionary<string, Map> maps;

        public GameData()
        {
            maps = new Dictionary<string, Map>();
            Dictionary<string, TriggerArea> triggers = new Dictionary<string, TriggerArea>();

            triggers.Add("Town", new TriggerArea(200, 200, 100, 100));
            maps.Add("Overworld", new Map(triggers));

            Dictionary<string, TriggerArea> triggers2 = new Dictionary<string, TriggerArea>();

            triggers2.Add("Overworld", new TriggerArea(500, 100, 100, 100));
            maps.Add("Town", new Map(triggers2));
        }
    }
    /*
        WorldInfo class represents data which is sent only once to player, on join. 
     */
    public class WorldInfo
    {
        [JsonProperty("map")]
        public Map map;
        public WorldInfo(Map currentmap)
        {
            map = currentmap;
        }
    }
}