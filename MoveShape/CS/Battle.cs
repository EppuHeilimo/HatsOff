using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Hatsoff
{
    public class Battle
    {
        public RemotePlayer player1;
        public RemotePlayer player2;
        public EnemyNpc npc;
        public PlayerActor.Stats player1stats;
        public PlayerActor.Stats player2stats;
        public bool pvp = false;
        //0 = still on, 1 = player1, 2 = player2, 3 = npc
        public int winner = 0;
        //true == Player1 turn, false == player2 or npc turn
        public bool turn;
        public Battle(RemotePlayer player, EnemyNpc npc)
        {
            this.player1 = player;
            player1stats.health = player.GetPlayerShape().stats.health;
            player1stats.attack = player.GetPlayerShape().stats.attack;
            this.npc = npc;
            pvp = false;
        }
        public Battle(RemotePlayer player1, RemotePlayer player2)
        {
            this.player1 = player1;
            player1stats.health = player1.GetPlayerShape().stats.health;
            player1stats.attack = player1.GetPlayerShape().stats.attack;
            this.player2 = player2;
            player2stats.health = player2.GetPlayerShape().stats.health;
            player2stats.attack = player2.GetPlayerShape().stats.attack;
            pvp = true;
        }
        public Battle()
        {

        }
        public void NpcAction()
        {
            if(!pvp && !turn)
            {
                player1stats.health -= npc.attack;
                turn = !turn;
                if (player1stats.health <= 0)
                {
                    winner = 3;
                }
            }

        }
        public void PlayerAction(PlayerActor player, BattleAction action)
        {
            if(pvp)
            {
                int p;
                if (player1.GetPlayerShape().owner == player.LastUpdatedBy && turn)
                {
                    p = 1;
                    turn = !turn;
                }
                else if (player2.GetPlayerShape().owner == player.LastUpdatedBy && !turn)
                {
                    p = 2;
                    turn = !turn;
                }
                else
                {
                    return;
                }
                switch (action)
                {
                    case BattleAction.ATTACK:
                        switch(p)
                        {
                            case 1:
                                player2stats.health -= player1stats.attack; 
                                break;
                            case 2:
                                player1stats.health -= player2stats.attack;
                                break;
                        }
                        break;

                }
                if(player1stats.health <= 0)
                {
                    winner = 2;
                }
                else if(player2stats.health <= 0)
                {
                    winner = 1;
                }
            }
            else
            {
                if(turn)
                {
                    switch (action)
                    {
                        case BattleAction.ATTACK:
                            npc.health -= player1stats.attack;
                            turn = !turn;
                            break;
                    }
                    if(npc.health <= 0)
                    {
                        winner = 1;
                    }
                }
            }
        }
    }
}