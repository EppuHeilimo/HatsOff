using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Newtonsoft.Json;
using System.IO;

namespace Hatsoff
{
    //Tiled map format internal stuff
    namespace Tiled
    {
        public class Layer
        {
            [JsonProperty("data")]
            public List<int> data;
            [JsonProperty("name")]
            public string name;
            [JsonProperty("type")]
            public string type;
        }
        public class Tile
        {
            [JsonProperty("image")]
            public string image;
        }
        public class TileSet
        {
            [JsonProperty("tiles")]
            public Dictionary<int, Tile> tiles;
            [JsonProperty("firstgid")]
            public int firstgid;
        }
        public class TileMap
        {
            [JsonProperty("height")]
            public int height = 0;
            [JsonProperty("width")]
            public int width = 0;
            [JsonProperty("layers")]
            public List<Layer> layers;
            [JsonProperty("tilesets")]
            public List<TileSet> tilesets;
        }
    }

    //A single tile
    public class Tile
    {
        //Might be null
        public bool isBlocking;
        public TileDefinition tileDef;
        public Tile(TileDefinition tileDef, bool collision)
        {
            this.tileDef = tileDef;
			this.isBlocking = collision;
        }
    }

    //Tile type
    public class TileDefinition
    {
        public string image;
    }

    public class TileMap
    {
        public const int tileWidth = 64;
        public const int tileHeight = 64;
        private int _width;
        private int _height;
        public int width
        {
            get
            {
                return _width;
            }
        }
        public int height
        {
            get
            {
                return _height;
            }
        }
        private List<Tile> tiles;
        private Dictionary<int, TileDefinition> tileDefinitions;
        
        //Might return null
        public Tile getTile(int x, int y)
        {
            if (x < 0 || y < 0)
                return null;
            if (x >= _width || y >= _height)
                return null;
            return tiles[x + y * _width];
        }

        //Might return null
        public Tile getTileInRealCoordinates(int x, int y)
        {
            x /= tileWidth;
            y /= tileHeight;
            return getTile(x, y);
        }

        //Load tilemap data from a stream (in a tiled JSON format)
        //return false on failure, or just throws an exception
        public bool load(StreamReader stream)
        {
            JsonSerializer js = new JsonSerializer();
            Tiled.TileMap map = js.Deserialize<Tiled.TileMap>(new JsonTextReader(stream));
            if (map.height == 0 || map.width == 0)
                return false;
            tileDefinitions = new Dictionary<int, TileDefinition>();

            foreach (var k in map.tilesets)
            {
                foreach (var pair in k.tiles)
                {
                    var gid = pair.Key + k.firstgid;
                    TileDefinition tiledef = new TileDefinition();
                    tiledef.image = pair.Value.image;
                    tileDefinitions.Add(gid, tiledef);
                }
            }
            Tiled.Layer tilelayer = null;
            Tiled.Layer colllayer = null;
            foreach (var lay in map.layers)
            {
                if (lay.type != "tilelayer")
                    continue;
                if (lay.name == "terrain")
					tilelayer = lay;
				if (lay.name == "collision")
					colllayer = lay;
            }
            if (tilelayer == null)
                return false;

            if (tilelayer.data.Count != map.width * map.height)
                return false;
			
			
            if (colllayer == null || colllayer.data.Count != map.width * map.height)
                colllayer = null;

            _height = map.height;
            _width = map.width;
            tiles = new List<Tile>();
            
			int i = 0;
            foreach (var k in tilelayer.data)
            {
				bool collision = false;
                if (colllayer != null)
					collision = colllayer.data[i] > 0;
				
                TileDefinition td = null;
                tileDefinitions.TryGetValue(k, out td);

                Tile t = new Tile(td, collision);
                tiles.Add(t);
				i++;
            }
            
            return true;
        }
    }
}