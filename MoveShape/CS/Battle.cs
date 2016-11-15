using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.Owin.Security.Provider;
using Newtonsoft.Json;

namespace Hatsoff
{
    public class BattleStatus
    {
        public bool myturn;
        public bool active;
        public Battle battle;

        public BattleStatus(bool turn, bool active, Battle battle)
        {
            this.battle = battle;
            myturn = turn;
            this.active = active;
        }
    }

    public class ClientBattleInformation
    {
        [JsonProperty("player1id")] public double player1id;
        [JsonProperty("player2id")] public double player2id;
        [JsonProperty("player1health")] public double player1health;
        [JsonProperty("player2health")] public double player2health;

        public ClientBattleInformation(double id1, double id2, double h1, double h2)
        {
            player1id = id1;
            player2id = id2;
            player2health = h2;
            player1health = h1;
        }
    }

    public class PvPBattle
    {
        public RemotePlayer player1;
        public RemotePlayer player2;

        public void Update()
        {
            
        }
    }

    public class Battle
    {

    }

    public enum BattleAction
    {
        ATTACK,
        EQUIPCHANGE,
        NONE
    }
}