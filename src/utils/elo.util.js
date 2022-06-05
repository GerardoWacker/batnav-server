class EloUtil
{
    static calculateWin(elo1, elo2)
    {
        const k = 60;
        let exp = ((elo2 - elo1) / 400)
        let statistic = 1 / (1 + Math.pow(10, exp))

        return Math.round(k * (1 - statistic))
    }

    static calculateLoss(elo1, elo2)
    {
        const k = 60;
        let exp = ((elo2 - elo1) / 400)
        let statistic = 1 / (1 + Math.pow(10, exp))

        return Math.round(k * (0 - statistic))
    }
}
