<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="data.aspx.cs" Inherits="Hatsoff.data" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
</head>
<body>
    <form id="form1" runat="server">
    <div>
        
        <asp:GridView ID="gridItems" runat="server" AutoGenerateColumns="true">
            <columns>
                <asp:boundfield headertext="ID" datafield="Item1" />
                <asp:boundfield headertext="Name"  datafield="Item2.name" />
                <asp:boundfield headertext="Description" datafield="Item2.description" />
                <asp:boundfield headertext="basepower"  datafield="Item2.basepower" />
                <asp:boundfield headertext="stamina" datafield="Item2.stamina" />
                <asp:boundfield headertext="rarity"  datafield="Item2.rarity" />
                <asp:boundfield headertext="type" datafield="Item2.type" />
                <asp:boundfield headertext="wearable" datafield="Item2.wearable" />
                <asp:boundfield headertext="appearance"  datafield="Item2.appearance" />
                <asp:boundfield headertext="effect" datafield="Item2.effect" />   
                <asp:TemplateField HeaderText="attributes">
                    <ItemTemplate>
                        <asp:Repeater ID="repeater" runat="server" DataSource='<%# Eval("Item2.attributedefense") %>'>
                            <ItemTemplate>
                                <%# Eval("key")%>: <%# Eval("value")%><br />
                            </ItemTemplate>
                        </asp:Repeater>
                    </ItemTemplate>
                </asp:TemplateField>
            </columns>
        </asp:GridView>
    </div>
    </form>
</body>
</html>
