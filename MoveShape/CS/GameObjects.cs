using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Hatsoff
{
    public class BaseItem
    {
        [JsonProperty("name")] public string name { get; set; }
        [JsonProperty("description")] public string description { get; set; }
        [JsonProperty("basepower")] public double basepower { get; set; }
        [JsonProperty("stamina")] public double stamina { get; set; }
        [JsonProperty("attributedefense")] public Dictionary<int, double> attributedefense { get; set; }
        [JsonProperty("rarity")] public int rarity { get; set; }
        [JsonProperty("type")] public string type { get; set; }
        [JsonProperty("wearable")] public string wearable { get; set; }
        [JsonProperty("appearance")] public string appearance { get; set; }
        [JsonProperty("effect")] public string effect { get; set; }
        
    }

    public class Item
    {
        [JsonProperty("baseitem")] public BaseItem baseitem;
        [JsonProperty("modifier")] public string modifier;
        [JsonProperty("attributename")] public string attriname;
        [JsonProperty("attributepower")] public double attributepower;
        [JsonProperty("name")] public string name;

        [JsonIgnore] public int attributeid;
        [JsonIgnore] public double modifiervalue;

        public Item(BaseItem bitem, string modifier)
        {
            baseitem = bitem;
            this.modifier = modifier;
            name = modifier + " " + baseitem.name;
            this.attriname = "None";
            this.attributepower = 0;
        }

        public Item(int id, string modifier)
        {
            GameData.data.items.TryGetValue(id, out baseitem);
            this.modifier = modifier;
            name = modifier + " " + baseitem.name;
            this.attriname = "None";
            this.attributepower = 0;
        }

        //Stat randomizer constructors
        public Item(BaseItem bitem, int actorlevel)
        {
            baseitem = bitem;
            Random rand = new Random();
            int r = rand.Next(101);
            if (r < 50)
            {
                this.modifier = GameData.data.modifiers[0].name;
                this.modifiervalue = GameData.data.modifiers[0].modifier;
            }
            else if (r >= 50 && r < 75)
            {
                this.modifier = GameData.data.modifiers[1].name;
                this.modifiervalue = GameData.data.modifiers[1].modifier;
            }
            else if (r >= 75 && r < 90)
            {
                this.modifier = GameData.data.modifiers[2].name;
                this.modifiervalue = GameData.data.modifiers[2].modifier;
            }
            else if (r >= 90 && r < 96)
            {
                this.modifier = GameData.data.modifiers[3].name;
                this.modifiervalue = GameData.data.modifiers[3].modifier;
            }
            else if (r >= 96 && r < 99)
            {
                this.modifier = GameData.data.modifiers[4].name;
                this.modifiervalue = GameData.data.modifiers[4].modifier;
            }
            else if (r >= 99)
            {
                this.modifier = GameData.data.modifiers[5].name;
                this.modifiervalue = GameData.data.modifiers[5].modifier;
            }

            r = rand.Next(GameData.data.attributes.Count);
            this.attriname = GameData.data.attributes[r].name;
            this.attributepower = actorlevel * modifiervalue * 2;
            name = modifier + " " + baseitem.name + " of " + attriname;
        }

        public Item(int id, int actorlevel)
        {
            GameData.data.items.TryGetValue(id, out baseitem);
            Random rand = new Random();
            int r = rand.Next(101);
            if (r < 50)
            {
                this.modifier = GameData.data.modifiers[0].name;
                this.modifiervalue = GameData.data.modifiers[0].modifier;
            }
            else if (r >= 50 && r < 75)
            {
                this.modifier = GameData.data.modifiers[1].name;
                this.modifiervalue = GameData.data.modifiers[1].modifier;
            }
            else if (r >= 75 && r < 90)
            {
                this.modifier = GameData.data.modifiers[2].name;
                this.modifiervalue = GameData.data.modifiers[2].modifier;
            }
            else if (r >= 90 && r < 96)
            {
                this.modifier = GameData.data.modifiers[3].name;
                this.modifiervalue = GameData.data.modifiers[3].modifier;
            }
            else if (r >= 96 && r < 99)
            {
                this.modifier = GameData.data.modifiers[4].name;
                this.modifiervalue = GameData.data.modifiers[4].modifier;
            }
            else if (r >= 99)
            {
                this.modifier = GameData.data.modifiers[5].name;
                this.modifiervalue = GameData.data.modifiers[5].modifier;
            }

            r = rand.Next(GameData.data.attributes.Count);
            this.attriname = GameData.data.attributes[r].name;
            this.attributepower = actorlevel * modifiervalue * 2;
            name = modifier + " " + baseitem.name + " of " + attriname;
        }
    }

    public struct Stats
    {
        [JsonProperty("health")] public double health { get; set; }
        [JsonProperty("maxhealth")] public double maxhealth { get; set; }
        [JsonProperty("attack")] public double attack { get; set; }
        [JsonProperty("attributename")] public string attriname;
        [JsonProperty("attributepower")] public double attributepower;
        [JsonProperty("attributedefenses")] public Dictionary<int, double> attributedefenses { get; set; }

        [JsonIgnore]
        public int attributeid;
        public Stats(Item myhat, int level)
        {
            attack = myhat.baseitem.basepower + level * 2 * myhat.modifiervalue;
            health = myhat.baseitem.stamina + level * 2 * myhat.modifiervalue;
            maxhealth = this.health;
            attributepower = myhat.attributepower;
            attributeid = myhat.attributeid;
            attriname = myhat.attriname;
            attributedefenses = new Dictionary<int, double>();
            for (int i = 0; i < 6; i++)
            {
                attributedefenses.Add(i, 0);
            }
            foreach (KeyValuePair<int, double> a in myhat.baseitem.attributedefense)
            {
                attributedefenses[a.Key] = a.Value + level*2;
            }

        }

        //don't change current health
        public void ChangedHatInBattle(Item myhat, int level)
        {
            attack = myhat.baseitem.basepower + level * 2 * myhat.modifiervalue;
            maxhealth = myhat.baseitem.stamina + level * 2 * myhat.modifiervalue;
            attributepower = myhat.attributepower;
            attributeid = myhat.attributeid;
            attriname = myhat.attriname;
            attributedefenses = new Dictionary<int, double>();
            foreach (KeyValuePair<int, double> a in myhat.baseitem.attributedefense)
            {
                attributedefenses.Add(a.Key, a.Value + level * 2);
            }
        }

        public void AttackedWith(Stats ostats)
        {
            double attridefense = attributedefenses[ostats.attributeid];
            double attributemodifier = attack - attridefense;
            //if modifier is 0, enemy will attack only with base dmg
            if (attributemodifier < 0)
                attributemodifier = 0;
            health -= ostats.attack + attributemodifier;
        }
    }

    public class Npc
    {
        [JsonProperty("stats")] public Stats stats;
        [JsonProperty("appearance")] public string appearance;
        [JsonProperty("effect")] public string effect;
        [JsonProperty("level")] public int level;
        [JsonProperty("position")] public Vec2 position;
        [JsonProperty("id")]
        public double id;


        [JsonIgnore] private double speed;
        [JsonIgnore] public BattleStatus battlestatus;
        [JsonIgnore] public List<Item> droplist;
        [JsonIgnore] public bool hostile;
        [JsonIgnore] public CollisionCircle collision;
        [JsonIgnore] private Vec2 targetposition;
        [JsonIgnore] private Random rand;

        public Npc(Item hat, int level, Vec2 position, bool hostile, double id)
        {
            this.id = id;
            rand = new Random();
            this.position = position;
            this.targetposition = position;
            droplist = new List<Item>();
            this.stats = new Stats(hat, level);
            this.appearance = hat.baseitem.appearance;
            droplist.Add(hat);
            this.level = level;
            this.hostile = hostile;
            this.speed = 10;
            this.collision = new CollisionCircle(position, 50, this, CollisionCircle.ObjectType.NPC);
        }

        public void DropItems()
        {
            
        }


        public void Update()
        {
            if(Vec2.Approximately(position, targetposition))
            {
                targetposition = GetRandPosFromCurPos(50);
            }
            else
            {
                position += Vec2.Normalize(targetposition) * speed;
            }
        }
        private Vec2 GetRandPosFromCurPos(double distance)
        {
            Vec2 ret;
            ret = new Vec2(position.x + (double)rand.Next(-1, 1) * distance, position.y + (double)rand.Next(-1, 1) * distance);
            return ret;
        }

    }

    public class PlayerActor
    {
        public struct Inventory
        {
            [JsonProperty("inventorysize")] public int inventorysize;
            [JsonProperty("items")] public List<Item> items;
            [JsonProperty("equippeditem")] public Item equippeditem;
            [JsonProperty("inventoryindex")] public int inventoryindex;

            public Inventory(int invsize)
            {
                inventorysize = invsize;
                items = new List<Item>();
                items.Add(new Item(0, "Broken"));
                items.Add(new Item(1, "Broken"));
                equippeditem = items[0];
                inventoryindex = 0;
            }

            bool AddItem(int id)
            {
                if(items.Count < inventorysize)
                {
                    items.Add(new Item(id, "Broken"));
                    return true;
                }
                return false;
            }

            bool RemoveItem(string itemname)
            {
                foreach(Item i in items)
                {
                    if(i.baseitem.name == itemname)
                    {
                        items.Remove(i);
                        return true;
                    }
                }
                return false;
            }

            public bool EquipItem(int selectedhat)
            {
                if (items.Count >= selectedhat)
                {
                    equippeditem = items[selectedhat - 1];
                    return true;
                }
                return false;
            }
        }

        //Send these to client
        [JsonProperty("pos")] public Vec2 pos { get; set; }
        [JsonProperty("name")] public string name { get; set; }
        [JsonProperty("id")] public double id { get; set; }
        [JsonProperty("level")] public int level;
        [JsonProperty("appearance")] public string appearance;
        [JsonProperty("iteminventoryid")] public double iteminventoryid;

        //Don't send these to client
        [JsonIgnore] public bool insafezone;
        [JsonIgnore] public int lastbattletimer;
        [JsonIgnore] public Inventory inventory;
        [JsonIgnore] public Stats stats;
        [JsonIgnore] public string LastUpdatedBy;
        [JsonIgnore] public string owner;

        public PlayerActor(double id, Vec2 pos, string owner, string playername, int level)
        {
            this.owner = owner;
            this.id = id;
            this.pos = pos;
            inventory = new Inventory(9);
            this.level = level;
            name = playername;
            insafezone = false;
            lastbattletimer = 0;
            appearance = inventory.equippeditem.baseitem.appearance;
            stats = new Stats(inventory.equippeditem, level);
        }

        public bool EquipItem(int selectedhat)
        {
            bool ret = inventory.EquipItem(selectedhat);
            appearance = inventory.equippeditem.baseitem.appearance;
            stats = new Stats(inventory.equippeditem, level);
            return ret;
        }

        public bool EquipItemInBattle(int selectedhat)
        {
            bool ret = inventory.EquipItem(selectedhat);
            appearance = inventory.equippeditem.baseitem.appearance;
            stats.ChangedHatInBattle(inventory.equippeditem, level);
            return ret;
        }

        public bool MoveTo(Vec2 newpos)
        {
            bool ret = true;
            if (Vec2.Distance(pos, newpos) > 50)
            {
                newpos = Vec2.GetDistanceAlongLine(pos, newpos, 10);
                ret = false;
            }
            pos = newpos;
            return ret;
        }
    }
}

