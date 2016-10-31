using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Hatsoff
{
    public class PlayerActor
    {
        // We declare Left and Top as lowercase with 
        // JsonProperty to sync the client and server models
        [JsonProperty("x")]
        public double x { get; set; }
        [JsonProperty("y")]
        public double y { get; set; }
        // We don't want the client to get the "LastUpdatedBy" property
        [JsonIgnore]
        public string LastUpdatedBy { get; set; }
        [JsonProperty("id")]
        public double id { get; set; }
        [JsonProperty("areaname")]
        public string areaname { get; set; }
        public PlayerActor(double id, double x, double y, string areaname)
        {
            this.id = id;
            this.x = x;
            this.y = y;
            this.areaname = areaname;
        }
    }
}