namespace Chat
{
    export declare var messages : Array<DrawableText>;
    export declare var messageindex : number;
    export declare var keyMap: {};
    export declare var keyStates: {};
    export declare var currentmessage: DrawableText;
    export declare var lastmessage: string;
    export declare var chatactivated: boolean;
    export declare var sentmessage: boolean;

    export function newMessage(message: string) {
        let temp = Array<string>();
        for (let i = 0; i < messages.length; i++) {
            temp.push(messages[i].text);
        }  
        for (let i = 0; i < messages.length - 1; i++) {
            messages[i + 1].text = temp[i];
        }
        messages[0].text = message;
        console.log(message);
    }

    export function init()
    {
        messages = new Array<DrawableText>();
        messageindex = 0;
        for (let i = 0; i < 10; i++) {
            let mes = new DrawableText();
            mes.setTexture(GFX.textures["font1"]);
            mes.depth = -1;
            mes.characterScale = 1.3;
            mes.position.y = 30 + (15 * i);
            mes.position.x = 50;
            mes.screenSpace = true;
            mes.text = "";
            GFX.addDrawable(mes);
            this.messages.push(mes);
        }

        chatactivated = false;

        currentmessage = new DrawableText();
        currentmessage.setTexture(GFX.textures["font1"]);
        currentmessage.depth = -1;
        currentmessage.characterScale = 2;
        currentmessage.position.y = 800;
        currentmessage.position.x = 50;
        currentmessage.screenSpace = true;
        currentmessage.text = "";
        GFX.addDrawable(currentmessage);
        sentmessage = false;
    }

    export function sendCurrentMessage() {
        if (currentmessage.text.length > 0) {
            lastmessage = currentmessage.text;
            sentmessage = true;
            currentmessage.text = "";
        }
    }

    export function addKeyToCurrentMessage(char: string, capitalized: boolean)
    {
        if (capitalized) {
            currentmessage.text = currentmessage.text + char.toUpperCase();
        } else {
            currentmessage.text = currentmessage.text + char;
        }
    }

    export function deleteLastKeyFromCurrentMessage() {
        currentmessage.text = currentmessage.text.slice(0, -1);
    }

    export function clear() {
        for (let i = 0; i < messages.length; i++) {
            messages[i].text = "";
        }
        messageindex = 0;
    }  
}