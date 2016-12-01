namespace Chat {
    export declare var messages: Array<DrawableText>;
    export declare var messageindex: number;
    export declare var currentmessage: DrawableText;
    export declare var lastmessage: string;
    export declare var chatactivated: boolean;
    export declare var sentmessage: boolean;
    export declare var initialized: boolean;
    export declare var chattimeout: number;
    export declare var fadetimer: number;
    export declare var fading: boolean;

    export function newMessage(message: string) {
        let temp = Array<string>();
        let count = 1;
        let mes1 = "";
        let mes2 = "";
        let name = "";
        let temp2 = message.split(":");
        name = temp2[0];
        message = "";
        for (let i = 1; i < temp2.length; i++)
        {
            message += temp2[i];
        }
        if (message.length > 32) {
            mes1 = message.substr(0, 32);
            mes2 = message.substr(32, message.length);
            count = 2;
        }
        else {
            mes1 = message;
        }

        for (let i = 0; i < messages.length; i++) {
            temp.push(messages[i].text);
        }
        for (let i = 0; i < messages.length - count; i++) {
            messages[i + count].text = temp[i];
        }
        if (count == 1) {
            messages[0].text = name.trim() + ":" + mes1;
        }
        if (count == 2) {
            messages[1].text = name.trim() + ":" + mes1;
            messages[0].text = mes2;
        }
        

        showchat();
        chattimeout = setTimeout(function () { fading = true; }, 3000);
    }

    export function loop()
    {
        if (fading)
        {
            if (fadetimer > 0) {
                fadetimer -= 0.1;
                fadechat(fadetimer);
            }
            else if (fadetimer <= 0) {
                fadetimer = 1;
                fading = false;
            }
        }
    }

    export function windowResize()
    {
        currentmessage.position.y = window.innerHeight - 25;
        for (let i = 0; i < messages.length; i++)
        {
            messages[i].position.y = window.innerHeight - 50 - i * 20;
        }
    }

    export function deactivateChat()
    {
        chatactivated = false;
        chattimeout = setTimeout(function () { fading = true; }, 3000);
    }

    export function fadechat(alpha: number)
    {
        for (let i = 0; i < messages.length; i++)
        {
            messages[i].color.a = alpha;
        }   
    }

    export function showchat() {
        for (let i = 0; i < messages.length; i++)
        {
            messages[i].color.a = 1;
        }
        clearTimeout(chattimeout);
    }

    export function init()
    {
        fadetimer = 1;
        messages = new Array<DrawableText>();
        messageindex = 0;
        for (let i = 0; i < 10; i++) {
            let mes = new DrawableText();
            mes.setTexture(GFX.textures["font1"]);
            mes.depth = -1;
            mes.characterScale = 2;
            mes.position.y = window.innerHeight - 50 - i * 20;
            mes.position.x = 20;
            mes.screenSpace = true;
            mes.text = "";
            GFX.addDrawable(mes, Layer.LayerAlpha);
            this.messages.push(mes);
        }

        chatactivated = false;
        currentmessage = new DrawableText();
        currentmessage.setTexture(GFX.textures["font1"]);
        currentmessage.depth = -1;
        currentmessage.characterScale = 2;
        currentmessage.position.y = window.innerHeight - 25;
        currentmessage.position.x = 20;
        currentmessage.screenSpace = true;
        currentmessage.text = "Press enter to chat";
        GFX.addDrawable(currentmessage, Layer.LayerAlpha);
        sentmessage = false;
        initialized = true;
    }

    export function clearCurrentMessage()
    {
        currentmessage.text = "";
    }

    export function sendCurrentMessage()
    {
        if (currentmessage.text.length > 0) {
            lastmessage = currentmessage.text;
            sentmessage = true;        
        }
        currentmessage.text = "Press enter to chat";
    }

    export function addKeyToCurrentMessage(char: string, capitalized: boolean)
    {
        if (currentmessage.text.length < 64)
        {
            if (capitalized) {
                currentmessage.text = currentmessage.text + char.toUpperCase();
            } else {
                currentmessage.text = currentmessage.text + char;
            }
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