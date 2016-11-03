using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Hatsoff
{
    public class RemotePlayer
    {
        PlayerActor _playerShape;
        string _connectionID;
        int _ID;
        public string areaname;
        public RemotePlayer(string connectionID, int ID, string areaname)
        {
            _connectionID = connectionID;
            _playerShape = new PlayerActor(ID, 0, 0, connectionID);
            _playerShape.x = 0;
            _playerShape.y = 0;
            _playerShape.LastUpdatedBy = connectionID;
            _ID = ID;
            _playerShape.id = ID;
            this.areaname = areaname;
        }
        public RemotePlayer(string connectionID, int ID, PlayerActor player)
        {
            _connectionID = connectionID;
            _playerShape = player;
            _ID = ID;
        }
        public PlayerActor getPlayerShape()
        {
            return _playerShape;
        }

        public void setPosition(double left, double top)
        {
            _playerShape.x = left;
            _playerShape.y = top;
        }
        public Vec2 getPosition()
        {
            return new Vec2(_playerShape.x, _playerShape.y);
        }
    }
}