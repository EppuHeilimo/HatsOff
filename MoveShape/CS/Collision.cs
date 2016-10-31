
namespace Hatsoff
{
    static class Collision
    {
        
        static public bool TestCircleCollision(Vec2 c1, double r1, Vec2 c2, double r2)
        {
            Vec2 delta = c2 - c1;

            if (delta.x * delta.x + delta.y * delta.y > (r1 + r2) * (r1 + r2))
                return true;
            return false;
        }

        
    }
}