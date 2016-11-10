
enum BattleAction
{
    ATTACK,
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

    export function startRandomBattle(myturn: boolean, npc: EnemyNpc, me: LocalPlayerClient)
    {
        _myturn = myturn;
        action = BattleAction.NONE;
        _npc = npc;
        _myhealth = me.health;
        _myattack = me.attack;
        active = true;
    }

    export function stopBattle()
    {
        action = BattleAction.NONE;
        active = false;
    }

    export function clearAttacks()
    {
        action = BattleAction.NONE;
    }

    export function startBattle(myturn: boolean, enemy: InterpolatedPlayerClient, me: LocalPlayerClient)
    {
        _myturn = myturn;
        _enemyPlayer = enemy;
        _myhealth = me.health;
        action = BattleAction.NONE;
        _myattack = me.attack;
        active = true;
    }
    export function updateBattle(myhealth: number, enemyhealth: number)
    {
        _npc.health = enemyhealth;
        _myhealth = myhealth;
    }

    export function lose()
    {
        alert("You lose!");
        stopBattle();
    }
    export function win()
    {
        alert("You win!");
        stopBattle();
    }

    export function attack()
    {
        if (_myturn)
        {
            action = BattleAction.ATTACK;
        }
    }

    export function init()
    {
        active = false;
    }
}