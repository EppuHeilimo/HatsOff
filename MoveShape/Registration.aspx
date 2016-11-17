<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Registration.aspx.cs" Inherits="MoveShape.Registration" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml" >
<head runat="server">
    <title>Register to Hatsoff</title>
</head>
<body>
    <form id="form1" runat="server">
    <div>
        <h2>Register to HatsOff</h2>
        <asp:Label ID="Label1" runat="server" Text="Register yo ass."/><br /><br />
            <asp:Login ID="LoginControl" runat="server" 
                onauthenticate="LoginControl_Register" DisplayRememberMe="False" LoginButtonText="Regisgter" TitleText="Registersdgariton">
            </asp:Login>
        </div>
    </form>
</body>
</html>
