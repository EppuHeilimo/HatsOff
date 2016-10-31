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
            maps = new Dictionary<string, Map>();
            maps = js.Deserialize<Dictionary<string, Map>>(new JsonTextReader(new StreamReader(Path.Combine(HttpContext.Current.Server.MapPath("~"), @"./Data/maps.json"))));

            return;
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