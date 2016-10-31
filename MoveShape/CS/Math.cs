using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Hatsoff
{
    public struct Vec2
    {
        public double x;
        public double y;
        public Vec2(double x, double y)
        {
            this.x = x;
            this.y = y;
        }
        public static Vec2 operator +(Vec2 v1, Vec2 v2)
        {
            return new Vec2(v1.x + v2.x, v1.y + v2.y);
        }
        public static Vec2 operator -(Vec2 v1, Vec2 v2)
        {
            return new Vec2(v1.x - v2.x, v1.y - v2.y);
        }
    }
}