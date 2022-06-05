class EloUtil
{
    static calculateWin(elo1, elo2)
    {

         const k = 60;
	let exp = ((elo2 - elo1)/400)
	let statistic = 1/1+Math.pow(10,exp))

	//si gano se le agrega lo siguiente
	//1 es por haber ganado

	let result = k*(1-statistic)
	
	 
        return result
    }

static calculateLoss(elo1, elo2)
    {

         const k = 60;
	let exp = ((elo2 - elo1)/400)
	let statistic = 1/1+Math.pow(10,exp))

	//0 es por haber perdido
	let result = k*(0-statistic)
	 
        return result
    }


    
}
