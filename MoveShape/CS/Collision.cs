
using System;
using System.Collections.Generic;


namespace Hatsoff
{
    static class Collision
    {
        static public bool TestCircleCollision(Vec2 c1, double r1, Vec2 c2, double r2)
        {
            Vec2 delta = c2 - c1;

            if (delta.x * delta.x + delta.y * delta.y < (r1 + r2) * (r1 + r2))
                return true;
            return false;
        }

        static public bool TestRectangleCollision(Rectangle a, Rectangle b)
        {

            Vec2 delta = a.getCenter() - b.getCenter();

            double sx = a.getWidth() + b.getWidth();
            double sy = a.getHeight() + b.getHeight();

            sx /= 2;
            sy /= 2;

            delta.x = Math.Abs(delta.x);
            delta.y = Math.Abs(delta.y);
            if (delta.x < sx && delta.y < sy)
                return true;
            return false;
        }
    }

    public class CollisionCircle
    {
        public enum ObjectType
        {
            PLAYER,
            NPC
        }
        Vec2 _center;
        double _radius;
        Object _object;
        ObjectType _type;

        public CollisionCircle(Vec2 center, double radius, Object obj, ObjectType type)
        {
            _center = center;
            _radius = radius;
            _object = obj;
            _type = type;
        }

        public CollisionCircle(CollisionCircle circle)
        {
            _center = circle.getCenter();
            _radius = circle.getRadius();
            _object = circle.getObject();
            _type = circle.getType();
        }


        public Vec2 getCenter()
        {
            return _center;
        }

        public Object getObject()
        {
            return _object;
        }
        public ObjectType getType()
        {
            return _type;
        }

        public double getRadius()
        {
            return _radius;
        }

        internal void setPosition(Vec2 pos)
        {
            this._center = pos;
        }
    }

    public struct Rectangle
    {
        private double _width;
        private double _height;
        private Vec2 _center;

        public Rectangle(Vec2 center, double width, double height)
        {
            _width = width;
            _height = height;
            _center = center;
        }

        public Vec2 getCenter()
        {
            return _center;
        }

        public double getHeight()
        {
            return _height; 
        }

        public double getWidth()
        {
            return _width;
        }
    }

    public class QuadTree
    {
        private int MAX_OBJECTS = 10;
        private int MAX_LAYERS = 5;
        private int _layer;
        private List<CollisionCircle> _collisiobobejcts;
        private Rectangle _limits;
        private QuadTree[] _nodes;

        public QuadTree(int layer, Rectangle limits)
        {
            _layer = layer;
            _collisiobobejcts = new List<CollisionCircle>();
            _limits = limits;
            _nodes = new QuadTree[4];
        }

        public void Clear()
        {
            _collisiobobejcts.Clear();

            for(int i = 0; i < _nodes.Length; i++)
            {
                if (_nodes[i] != null)
                {
                    _nodes[i].Clear();
                    _nodes[i] = null;
                }
            }
        }

        private void Split()
        {
            double width = (_limits.getWidth() / 2);
            double height = (_limits.getHeight() / 2);
            Vec2 temp = _limits.getCenter();

            //left top
            _nodes[0] = new QuadTree(_layer+1, new Rectangle(new Vec2(temp.x - width / 2, temp.y + height / 2), width, height));
            //right top
            _nodes[1] = new QuadTree(_layer+1, new Rectangle(new Vec2(temp.x + width / 2, temp.y + height / 2), width, height));
            //left bottom
            _nodes[2] = new QuadTree(_layer+1, new Rectangle(new Vec2(temp.x - width / 2, temp.y - height / 2), width, height));
            //right bottom
            _nodes[3] = new QuadTree(_layer+1, new Rectangle(new Vec2(temp.x + width / 2, temp.y - height / 2), width, height));
        }

        //Test where collisioncircle fits
        private int GetIndex(CollisionCircle circle)
        {
            //parent is -1 if circle cannot fit into the nodes it will belong to this leaf
            int index = -1;

            //test if the circle fits in the top quadrant of the rect
            bool top = (circle.getCenter().y + circle.getRadius() < _limits.getCenter().y + _limits.getHeight() / 2 && circle.getCenter().y - circle.getRadius() > _limits.getCenter().y);

            bool bottom = (circle.getCenter().y + circle.getRadius() < _limits.getCenter().y && circle.getCenter().y - circle.getRadius() > _limits.getCenter().y - _limits.getHeight() / 2);

            //test if the circle fits completely in the left quadrant
            if (circle.getCenter().x + circle.getRadius() < _limits.getCenter().x &&
                circle.getCenter().x - circle.getRadius() > _limits.getCenter().x - _limits.getWidth()/2)
            {
                if (top)
                    index = 0;
                else if (bottom)
                    index = 2;
            }
            //else test if it fits completely in the right quadrant
            else if (circle.getCenter().x + circle.getRadius() < _limits.getCenter().x + _limits.getWidth()/2 &&
                     circle.getCenter().x - circle.getRadius() > _limits.getCenter().x)
            {
                if (top)
                    index = 1;
                else if (bottom)
                    index = 3;
            }

            //returns -1 if circle doesn't fit completely into any quadrant
            return index;
        }

        public void Insert(CollisionCircle circle)
        {
            if (_nodes[0] != null)
            {
                int index = GetIndex(circle);
                if (index != -1)
                {
                    _nodes[index].Insert(circle);
                    return;
                }
            }

            _collisiobobejcts.Add(circle);
            if (_collisiobobejcts.Count > MAX_OBJECTS && _layer < MAX_LAYERS)
            {
                if(_nodes[0] == null)
                    Split();
                for (int i = 0; i < _collisiobobejcts.Count;)
                {
                    int index = GetIndex(_collisiobobejcts[i]);
                    if (index != -1)
                    {
                        _nodes[index].Insert(new CollisionCircle(circle));
                    }
                    else
                    {
                        i++;
                    }
                }
            }
        }

        public List<CollisionCircle> Retrieve(List<CollisionCircle> ret, CollisionCircle circle)
        {
            //Check where the circle fits
            int index = GetIndex(circle);
            //if it actually fit somewhere and this has nodes
            if (index != -1 && _nodes[0] != null)
            {
                //recursively retrieve from correct node
                _nodes[index].Retrieve(ret, circle);
            }
            //retrieve this leaf's objects
            foreach (CollisionCircle c in _collisiobobejcts)
            {
                ret.Add(c);
            }
            return ret;
        }

    }
}