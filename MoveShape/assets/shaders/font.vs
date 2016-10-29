attribute vec2 v_Position;
attribute vec2 v_TexCoord;

uniform vec2 u_Position;
uniform vec2 u_Scale;
uniform vec2 u_Size;
uniform vec2 u_RenderSize;
uniform float u_Depth;
uniform float u_CharIndex;

varying vec2 f_TexCoord;

void main(void)
{
	vec4 pos = vec4(v_Position, u_Depth, 1.0);
	pos.xy *= u_Size;
	pos.xy += u_Position - u_RenderSize / 2.0;
	pos.xy /= u_Scale;
    gl_Position = pos;
    f_TexCoord = v_TexCoord;

    float xi = mod(u_CharIndex, 8.0);
    float yi = floor(u_CharIndex / 8.0);

    f_TexCoord /= vec2(8.0,12.0);
    f_TexCoord += vec2(xi/8.0,yi/12.0);

}