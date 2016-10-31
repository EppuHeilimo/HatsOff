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
            maps.Add("Overworld", new Map());
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