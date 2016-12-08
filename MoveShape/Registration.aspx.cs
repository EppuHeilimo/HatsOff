using MySql.Data.MySqlClient;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Configuration;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace MoveShape
{
    public partial class Registration: System.Web.UI.Page
    {
        static Configuration rootWebConfig = WebConfigurationManager.OpenWebConfiguration("/HatsOff");
        const string connectionString = "hatsoffDatabase";

        protected void Page_Load(object sender, EventArgs e)
        {

        }

        protected void LoginControl_Register(object sender, EventArgs ea)
        {
            bool authenticated = this.ValidateCredentials(LoginControl.UserName, LoginControl.Password);

            if (authenticated)
            {
                Response.Redirect("/Login.aspx");
               // FormsAuthentication.RedirectFromLoginPage(LoginControl.UserName, false);
                
            }
        }

        public bool isAlphaNumeric(string text)
        {
            return Regex.IsMatch(text, "^[a-zA-Z0-9]+$");
        }

        private static string CreateSalt() //funcsaltion
        {
            //Generate a cryptographic random number.
            RNGCryptoServiceProvider rng = new RNGCryptoServiceProvider();
            byte[] buff = new byte[6];
            rng.GetBytes(buff);

            // Return a Base64 string representation of the random number.
            return Convert.ToBase64String(buff).Substring(0,6);
        }

        private bool ValidateCredentials(string userName, string passWord)
        {
            bool returnValue = false;

            if (this.isAlphaNumeric(userName) && userName.Length <= 16 && passWord.Length <= 16)
            {

                ConnectionStringSettings hatsoffDatabase = rootWebConfig.ConnectionStrings.ConnectionStrings[connectionString];
                MySqlConnection conn = new MySqlConnection(hatsoffDatabase.ConnectionString);
                try
                {
                    string sql = "select * from hatsoff_account where username = @username";

                    MySqlCommand cmd = new MySqlCommand(sql, conn);

                    MySqlParameter user = new MySqlParameter();
                    user.ParameterName = "@username";
                    user.Value = userName.Trim();
                    cmd.Parameters.Add(user);

                    conn.Open();

                    if (cmd.ExecuteScalar() == null)
                    {
                        SHA512 shaZam = new SHA512Managed();
                        var saltstr = CreateSalt();
                        var result = Convert.ToBase64String(shaZam.ComputeHash(Encoding.UTF8.GetBytes(saltstr + passWord)));

                        sql = "insert into hatsoff_account (username, passwrd, salt, player_id) values (@username, @passwrd, @salt, 1)";

                        cmd = new MySqlCommand(sql, conn);

                        user = new MySqlParameter();
                        user.ParameterName = "@username";
                        user.Value = userName.Trim();
                        cmd.Parameters.Add(user);

                        MySqlParameter password = new MySqlParameter();
                        password.ParameterName = "@passwrd";
                        password.Value = result;
                        cmd.Parameters.Add(password);

                        MySqlParameter salt = new MySqlParameter();
                        salt.ParameterName = "@salt";
                        salt.Value = saltstr;
                        cmd.Parameters.Add(salt);

                        cmd.ExecuteScalar();
                        returnValue = true;
                    }
                }
                catch (Exception ex)
                {

                }
                finally
                {
                    if (conn != null)
                        conn.Close();
                }
            }
            else
            {

                // Errors with login, false information and other stuff
            }
            return returnValue;
        }
    }
}
