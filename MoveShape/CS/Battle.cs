using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.Owin.Security.Provider;
using Newtonsoft.Json;
using System.Diagnostics;

namespace Hatsoff
{

    public class ClientBattleInformation
    {
        [JsonProperty("player1id")] public double player1id;
        [JsonProperty("player2id")] public double player2id;
        [JsonProperty("player1health")] public double player1health;
        [JsonProperty("player2health")] public double player2health;
        [JsonProperty("pvp")] public bool pvp;
        [JsonProperty("end")] public bool end;
        [JsonProperty("winner")] public int winner;

        public ClientBattleInformation(double id1, double id2, double h1, double h2, bool pvp, bool end, int winner)
        {
            player1id = id1;
            player2id = id2;
            player2health = h2;
            player1health = h1;
            this.pvp = pvp;
            this.end = end;
            this.winner = winner;
        }
    }


    public class Battle
    {
        public Npc npc;
        public RemotePlayer player1;
        public RemotePlayer player2;
        public bool pvp;
        public Stopwatch timer = new Stopwatch();
        public bool wait;
        //-1 still going
        //0 player1 wins
        //1 player2 wins
        //2 npc wins
        public int winner = -1;
        public bool end = false;

        public Battle(Npc n, RemotePlayer p)
        {
            timer.Start();
            pvp = false;
            player1 = p;
            p.currentbattle = this;
            npc = n;
            wait = true;
            
        }

        public Battle(RemotePlayer p1, RemotePlayer p2)
        {
            timer.Start();
            pvp = true;
            player1 = p1;
            p1.currentbattle = this;
            p2.currentbattle = this;
            player2 = p2;
            wait = true;
            
        }

        public ClientBattleInformation GenerateBattleInfo()
        {
            if(pvp)
            {
                return new ClientBattleInformation(player1.GetPlayerShape().id, player2.GetPlayerShape().id, player1.GetPlayerShape().stats.health, player2.GetPlayerShape().stats.health, true, end, winner);
            }
            else
            {
                return new ClientBattleInformation(player1.GetPlayerShape().id, npc.id, player1.GetPlayerShape().stats.health, npc.stats.health, false, end, winner);
            }  
        }

        private void checkwin()
        {
            if (player1.GetPlayerShape().stats.health <= 0)
            {
                if (pvp)
                    winner = 1;
                else
                {
                    winner = 2;
                    npc.state = Npc.NPC_STATE.MOVE;
                }
                    
            }
            else if (pvp)
            {
                if (player2.GetPlayerShape().stats.health <= 0)
                {
                    winner = 0;
                }
            }
            else
            {
                if (npc.stats.health <= 0)
                {
                    winner = 0;
                }
            }
        }

        public bool Update()
        {       
            if(!wait)
            {
                if (player1.GetPlayerShape().myturn)
                {
                    switch (player1.GetPlayerShape().action)
                    {
                        case BattleAction.ATTACK:
                            if (pvp)
                                player2.GetPlayerShape().stats.AttackedWith(player1.GetPlayerShape().stats);
                            else
                                npc.stats.AttackedWith(player1.GetPlayerShape().stats);
                            wait = true;
                            timer.Restart();
                            player1.GetPlayerShape().action = BattleAction.NONE;
                            checkwin();
                            return true;
                        case BattleAction.EQUIPCHANGE:
                            player1.GetPlayerShape().action = BattleAction.NONE;
                            return true;
                        case BattleAction.NONE:
                            break;
                    }
                }
                else
                {
                    if (pvp)
                    {
                        if (player2.GetPlayerShape().myturn)
                        {
                            switch (player2.GetPlayerShape().action)
                            {
                                case BattleAction.ATTACK:
                                    player1.GetPlayerShape().stats.AttackedWith(player2.GetPlayerShape().stats);
                                    wait = true;
                                    timer.Restart();
                                    player2.GetPlayerShape().action = BattleAction.NONE;
                                    checkwin();
                                    return true;
                                case BattleAction.EQUIPCHANGE:
                                    player2.GetPlayerShape().action = BattleAction.NONE;
                                    return true;
                                case BattleAction.NONE:
                                    break;
                            }
                        }                       
                    }
                    else
                    {
                        player1.GetPlayerShape().stats.AttackedWith(npc.stats);
                        checkwin();
                        wait = true;
                        return true;
                    }
                }


            }
            else
            {
                if(timer.ElapsedMilliseconds >= 1500)
                {
                    if(winner == -1)
                    {
                        wait = false;
                        player1.GetPlayerShape().myturn = !player1.GetPlayerShape().myturn;
                        if (pvp)
                        {
                            player2.GetPlayerShape().myturn = !player2.GetPlayerShape().myturn;
                        }
                    }
                    else
                    {
                         end = true;
                    }

                    return true;
                }

            }
            return false;
        }

    }

    public enum BattleAction
    {
        ATTACK,
        EQUIPCHANGE,
        NONE
    }
}