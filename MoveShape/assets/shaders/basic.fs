precision mediump float;

uniform sampler2D u_Texture;

varying vec2 f_TexCoord;
void main(void)
{
    gl_FragColor = texture2D(u_Texture, f_TexCoord);
    if (gl_FragColor.a < 0.5)
    	discard;
}