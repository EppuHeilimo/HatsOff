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
        public static Vec2 operator *(Vec2 v1, double d)
        {
            return new Vec2(v1.x * d, v1.y * d);
        }
        public double Length()
        {
            return (Math.Sqrt(x * x + y * y));
        }
        public static double Distance(Vec2 v1, Vec2 v2)
        {
            return (v2 - v1).Length();
        }

        public static Vec2 GetDistanceAlongLine(Vec2 startpos, Vec2 endpos, double length)
        {
            Vec2 realpos = endpos - startpos;
            double d = realpos.Length() / length;
            if (d == 0) return startpos;
            realpos.x /= d;
            realpos.y /= d;
            return startpos + realpos;
        }

        public static bool Approximately(Vec2 v1, Vec2 v2)
        {
            if(Distance(v1, v2) < 5)
            {
                return true;
            }
            return false;
        }
        public static Vec2 Normalize(Vec2 v)
        {
            return new Vec2(v.x / v.Length(), v.y / v.Length());
        }
    }
}