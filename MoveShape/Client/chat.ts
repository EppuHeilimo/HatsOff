namespace CHAT
{
    export declare var messages : Array<DrawableText>;
    export declare var messageindex : number;

    export function newMessage(message: string) {
        if (this.messages.length < 10) {
            let mes = new DrawableText();
            mes.setTexture(GFX.textures["font1"]);
            mes.depth = -1;
            mes.position.y = 930 - 10 * messageindex;
            mes.position.x = 10;
            mes.screenSpace = true;
            mes.text = message;
            GFX.addDrawable(mes);
            this.messages.push(mes);
            this.messageindex++;
        }
        else {
            if (this.messageindex > 9)
                this.messageindex = 0;
            this.messages[this.messageindex].text = message;
            this.messageindex++;
        }
        console.log(message);
    }

    export function init()
    {
        messages = new Array<DrawableText>();
        messageindex = 0;
    }  
}