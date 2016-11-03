using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Hatsoff
{
    public class PlayerActor
    {
        struct PlayerInfo
        {
            [JsonProperty("playername")]
            string playername { get; set; }
        }
        // We declare Left and Top as lowercase with 
        // JsonProperty to sync the client and server models
        [JsonProperty("x")]
        public double x { get; set; }
        [JsonProperty("y")]
        public double y { get; set; }
        // We don't want the client to get the "LastUpdatedBy" property
        [JsonProperty("playerinfo")]
        PlayerInfo playerinfo { get; set; }
        [JsonIgnore]
        public string LastUpdatedBy { get; set; }
        [JsonProperty("id")]
        public double id { get; set; }
        [JsonIgnore]
        public string owner { get; set; }
        public PlayerActor(double id, double x, double y, string owner, string playername)
        {
            this.owner = owner;
            this.id = id;
            this.x = x;
            this.y = y;
        }
    }
}