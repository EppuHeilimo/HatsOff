﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace MoveShape
{
    public partial class Index : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            var logd = Session["loginId"];

            if (logd == null)
            {
                Server.Transfer("/Login.aspx?ReturnUrl=Index.aspx");
            }

        }
    }
}