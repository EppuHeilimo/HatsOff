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
        struct Stats
        {
            [JsonProperty("health")]
            double health { get; set; }
            [JsonProperty("health")]
            double attack { get; set; }
            public Stats(double attack, double health)
            {
                this.attack = attack;
                this.health = health;
            }
        }
        struct Inventory
        {
            [JsonProperty("inventorysize")]
            int inventorysize;
            [JsonProperty("items")]
            List<Item> items;
            public Inventory(int invsize)
            {
                inventorysize = invsize;
                items = new List<Item>();
            }
            bool addItem(string itemname)
            {
                if(items.Count < inventorysize)
                {
                    items.Add(new Item(itemname));
                    return true;
                }
                return false;
            }
            bool removeItem(string itemname)
            {
                foreach(Item i in items)
                {
                    if(i.itemname == itemname)
                    {
                        items.Remove(i);
                        return true;
                    }
                }
                return false;
            }
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
        Inventory inventory { get; set; }
        [JsonIgnore]
        Stats stats { get; set; }
        [JsonIgnore]
        public string LastUpdatedBy { get; set; }
        [JsonProperty("id")]
        public double id { get; set; }
        [JsonIgnore]
        public string owner { get; set; }
        [JsonProperty("level")]
        public int level;
        public PlayerActor(double id, double x, double y, string owner, string playername, int level)
        {
            this.owner = owner;
            this.id = id;
            this.x = x;
            this.y = y;
            stats = new Stats(10, 100);
            inventory = new Inventory(9);
            this.level = level;
        }
    }
    public class Item
    {
        [JsonProperty("description")]
        public string description;
        [JsonProperty("itemname")]
        public string itemname { get; set; }
        public Item(string itemname)
        {
            this.itemname = itemname;
        }
    }
}