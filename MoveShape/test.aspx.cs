using MySql.Data.MySqlClient;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using System.Web.Configuration;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace MoveShape
{
    public partial class test : System.Web.UI.Page
    {
        static Configuration rootWebConfig = WebConfigurationManager.OpenWebConfiguration("/HatsOff");
        const string connectionString = "hatsoffDatabase";

        protected void Page_Load(object sender, EventArgs e)
        {

            ConnectionStringSettings hatsoffDatabase = rootWebConfig.ConnectionStrings.ConnectionStrings[connectionString];

            try
            {
                MySqlConnection conn = new MySqlConnection(hatsoffDatabase.ConnectionString);
                conn.Open();

                string sql = "SELECT username, hatlevel FROM hatsoff_player";
                MySqlCommand cmd = new MySqlCommand(sql, conn);
                MySqlDataReader rdr = cmd.ExecuteReader();

                while (rdr.Read())
                {
                    Console.WriteLine(rdr[0] + " -- " + rdr[1]);
                    this.divi.InnerHtml += rdr[0] + " -- " + rdr[1] + "\n";
                }
                rdr.Close();
            }
            catch (MySql.Data.MySqlClient.MySqlException ex)
            {
                Console.WriteLine(ex.Message);
                this.divi.InnerHtml += ex.Message;
            }
        }
    }
}