<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Index.aspx.cs" Inherits="MoveShape.Index" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title>Hats Off</title>
    <style>
        #myShape {
            width: 100px;
            height: 100px;
            position: absolute;
            background-color: #FF0000;
        }
        .player {
            width: 100px;
            height: 100px;
            position: absolute;
            background-color: #00FF00;
        }

        #canvas {
            position: fixed;
            top: 0;
            left: 0;
            z-index: -1;
        }
        body {
            margin: 0px 0px 0px 0px;
        }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    <script src="Scripts/jquery-1.12.4.min.js"></script>
    <script src="Scripts/jquery-ui-1.12.1.min.js"></script>
    <script src="Scripts/jquery.signalR-2.2.1.js"></script>
    <script src="/signalr/hubs"></script>
    <script src="/Client.js"></script>
	<script src="/TSClient.js"></script>

    <script src="Scripts/howler.min.js"></script>
   
   <script>
       function after_load()
       {
           new Howl({
               src: ['assets/middle.ogg'],
               autoplay: true,
               volume: 0.3,
               loop: true
           });
       }
       initMain(after_load);
   </script> 
</body>
</html>
