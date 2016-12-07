<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Registration.aspx.cs" Inherits="MoveShape.Registration" MasterPageFile="master.master" Title="Register"%>

<asp:Content ContentPlaceHolderID="Main" runat="server">
<h2>Register to HatsOff</h2>
<asp:Label ID="Label1" runat="server" Text="Register as a new user."/><br /><br />
    <asp:Login ID="LoginControl" runat="server" 
        onauthenticate="LoginControl_Register" DisplayRememberMe="False" LoginButtonText="Regisgter" TitleText="Register">
    </asp:Login>
</asp:Content>
