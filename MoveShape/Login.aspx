<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Login.aspx.cs" Inherits="MoveShape.Login" MasterPageFile="master.master" Title="Login"%>

<asp:Content ContentPlaceHolderId="Main" runat="server">
    <h2>Login to HatsOff</h2>
    <asp:Label ID="Label1" runat="server" Text="You need to be logged in to play the game. 
            
        Please, give us your player name and choose your password."></asp:Label>
    <br />
    <br />
    <asp:Login ID="LoginControl" runat="server" 
        onauthenticate="LoginControl_Authenticate">
    </asp:Login>
    <a href="/Registration.aspx">Register</a>
</asp:Content>
