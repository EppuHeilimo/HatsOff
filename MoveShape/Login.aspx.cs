﻿using MySql.Data.MySqlClient;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Security.Policy;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Configuration;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace MoveShape
{
    public partial class Login : System.Web.UI.Page
    {
        static Configuration rootWebConfig = WebConfigurationManager.OpenWebConfiguration("/HatsOff");
        const string connectionString = "hatsoffDatabase";

        protected void Page_Load(object sender, EventArgs e)
        {

        }

        protected void LoginControl_Authenticate(object sender, AuthenticateEventArgs ea)
        {
            bool authenticated = this.ValidateCredentials(LoginControl.UserName, LoginControl.Password);

            if (authenticated)
            {
                FormsAuthentication.RedirectFromLoginPage(LoginControl.UserName, LoginControl.RememberMeSet);
            }
        }

        public bool isAlphaNumeric(string text)
        {
            return Regex.IsMatch(text, "[a-zA-Z0-9]");
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

                    MySqlParameter password = new MySqlParameter();
                    password.ParameterName = "@passwrd";
                    password.Value = passWord.Trim();
                    cmd.Parameters.Add(password);

                    conn.Open();
                
                    int count = (int)cmd.ExecuteScalar();

                    if (count > 0)
                        returnValue = true;
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
            return returnValue;
        }  
    }
}