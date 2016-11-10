precision mediump float;

uniform vec4 u_Color;
uniform sampler2D u_Texture;

varying vec2 f_TexCoord;


void main(void)
{
    gl_FragColor = texture2D(u_Texture, f_TexCoord) * u_Color;
    if (gl_FragColor.a < 0.5)
    	discard;
}