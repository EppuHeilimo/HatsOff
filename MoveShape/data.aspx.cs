using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Xml;

namespace Hatsoff
{
    
    public partial class data : System.Web.UI.Page
    {
        public List<Tuple<int, BaseItem>> items;
        public List<Tuple<int, ItemAttribute>> attributes;
        public List<Tuple<int, ItemModifier>> modifiers;
        public List<Tuple<string, Map>> maps;

        private static List<Tuple<A,B>> dictToTupleList<A,B>(Dictionary<A, B> c)
        {
            List<Tuple<A, B>> ret = new List<Tuple<A, B>>();
            foreach (var d in c )
            {
                ret.Add(new Tuple<A, B>(d.Key, d.Value));
            }
            return ret;
        }
        protected void Page_Load(object sender, EventArgs e)
        {
            JsonSerializer js = new JsonSerializer();
            maps = dictToTupleList(js.Deserialize<Dictionary<string, Map>>(new JsonTextReader(new StreamReader(Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath("~"), @"Data\maps.json")))));
            items = dictToTupleList(js.Deserialize<Dictionary<int, BaseItem>>(new JsonTextReader(new StreamReader(Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath("~"), @"Data\items.json")))));
            modifiers = dictToTupleList(js.Deserialize<Dictionary<int, ItemModifier>>(new JsonTextReader(new StreamReader(Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath("~"), @"Data\modifiers.json")))));
            attributes = dictToTupleList(js.Deserialize<Dictionary<int, ItemAttribute>>(new JsonTextReader(new StreamReader(Path.Combine(System.Web.Hosting.HostingEnvironment.MapPath("~"), @"Data\attributes.json")))));

            
            gridItems.DataSource = items;
            gridItems.DataBind();
            
        }
    }
}