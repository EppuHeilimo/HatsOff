using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Hatsoff
{
    public class RemotePlayer
    {
        private PlayerActor _playerShape;
        private CollisionCircle _collisionCircle;
        private string _connectionId;
        private int _id;
        public string areaname;
        private Vec2[] _recordedpositions;
        private int posRecordIndex = 0;
        public BattleStatus battlestatus;
        public RemotePlayer(string connectionID, int ID, string areaname)
        {
            _connectionId = connectionID;
            _playerShape = new PlayerActor(ID, 0, 0, connectionID, "player" + ID, 1);
            _playerShape.LastUpdatedBy = connectionID;
            this.areaname = areaname;
            _recordedpositions = new Vec2[10];
            _collisionCircle = new CollisionCircle(new Vec2(_playerShape.x,_playerShape.y), 30, this, CollisionCircle.ObjectType.PLAYER);
            for (int i = 0; i < 10; i++)
            {
                RecordPosition(GetPosition());
            }           
        }

        public RemotePlayer(string connectionID, int ID, PlayerActor player)
        {
            _connectionId = connectionID;
            _playerShape = player;
            _id = ID;
            _collisionCircle = new CollisionCircle(new Vec2(_playerShape.x, _playerShape.y), 30, this, CollisionCircle.ObjectType.PLAYER);
        }

        public Vec2 GetRecordedPos(int steps)
        {
            int index = posRecordIndex - steps;
            if (index < 0)
            {
                index = 9 + index;
            }
            return _recordedpositions[index];
        }

        private void RecordPosition(Vec2 pos)
        {
            //record last 10 steps player has done. 
            _recordedpositions[posRecordIndex] = pos;
            posRecordIndex++;
            if (posRecordIndex > 9)
            {
                posRecordIndex = 0;
            }
        }
        public PlayerActor GetPlayerShape()
        {
            return _playerShape;
        }

        public CollisionCircle getCollCircle()
        {
            return _collisionCircle;
        }

        public void SetPosition(double x, double y)
        {
            _playerShape.x = x;
            _playerShape.y = y;
            RecordPosition(new Vec2(x, y));
            _collisionCircle.setPosition(GetPosition());
        }
        public Vec2 GetPosition()
        {
            return new Vec2(_playerShape.x, _playerShape.y);
        }
    }
}