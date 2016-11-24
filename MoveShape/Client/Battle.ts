
enum BattleAction {
    ATTACK,
    EQUIPCHANGE,
    NONE
}

namespace Battle
{
    export declare var active: boolean;
    export declare var action: BattleAction;
    export declare var enemy: BattleAction;
    declare var _myturn: boolean;
    declare var _enemyIsPlayer: boolean;
    declare var _enemyPlayer: InterpolatedPlayerClient;
    declare var _npc: EnemyNpc;
    declare var _myhealth: number;
    declare var _myattack: number;
    declare var _me: LocalPlayerClient;
    export declare var wait: boolean;

    export function startRandomBattle(myturn: boolean, npc: EnemyNpc, me: LocalPlayerClient) {
        _enemyIsPlayer = false;
        _myturn = myturn;
        action = BattleAction.NONE;
        _npc = npc;
        _me = me;
        _npc.text.text = "Health: " + _npc.health;
        _me.text.text = "Health: " + _me.health;
        _myhealth = me.health;
        _myattack = me.attack;
        active = true;
        wait = false;
    }

    export function stopBattle()
    {
        action = BattleAction.NONE;
        if (!_enemyIsPlayer) {
            _npc.text.text = "";
            Game.removeActor(_npc);
        }    
        active = false;
        _enemyIsPlayer = false;
        _me.health = 100;
        _me.text.text = "";
    }

    export function clearAction()
    {
        action = BattleAction.NONE;
    }

    export function startBattle(myturn: boolean, enemy: InterpolatedPlayerClient, me: LocalPlayerClient)
    {
        _myturn = myturn;
        _enemyPlayer = enemy;
        _me = me;
        _enemyIsPlayer = true;
        _myhealth = me.health;
        _enemyPlayer.text.text = "Health: " + _enemyPlayer.health;
        _me.text.text = "Health: " + _me.health;
        action = BattleAction.NONE;
        _myattack = me.attack;
        active = true;
        wait = false;
    }

    export function updateBattle(myhealth: number, enemyhealth: number) {
        wait = false;
        if (!_enemyIsPlayer) {
            _npc.health = enemyhealth;
            _npc.text.text = "Health: " + _npc.health;
        }
        else {
            _enemyPlayer.health = enemyhealth;
            _enemyPlayer.text.text = "Health: " + _enemyPlayer.health;
        }
        _me.health = myhealth;
        _me.text.text = "Health: " + _me.health;
        if (_me.health <= 0)
        {
            lose();
        }
        if (enemyhealth <= 0) {
            win();
        }
    }

    export function lose()
    {
        stopBattle();
    }
    export function win()
    {
        stopBattle();
    }

    export function attack()
    {
        if (_myturn && !wait)
        {
            action = BattleAction.ATTACK;
        }
    }

    export function changeEquip(slot: number) {
        if (_myturn && _me.inventory.items.length >= slot && !wait) {
            action = BattleAction.EQUIPCHANGE;
            _me.inventory.inventoryindex = slot;
        }
    }

    export function init()
    {
        active = false;
    }
}