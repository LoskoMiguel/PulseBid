import { prisma } from '../../db/db.js';
import redis from '../../db/redis.js';

export default function (agenda) {
  agenda.define("endAuction", async (job, done) => {
    try {
      const { auctionId } = job.attrs.data;

      console.log(`Finalizando subasta con ID: ${auctionId}`);

      // cerrar la subasta con ID auctionId
      await redis.hSet(`auction:${auctionId}`, {
        status: "ending",
      });

      // Obtener datos actuales de Redis
      const redisData = await redis.hGetAll(`auction:${auctionId}`);

      if (!redisData || !redisData.current_winner) {
        console.log("Auction ended but no bids found.", auctionId);
        
        // marcar subasta como finalizada sin ganador
        await prisma.auction.update({
        where: { id: auctionId },
        data: { status: "finished" }
        });

        return done();
      }

      const finalWinner = redisData.current_winner;
      const finalPrice = Number(redisData.current_price);

      // guardar ganador y precio final en Supabase
        await prisma.auction.update({
        where: { id: auctionId },
        data: {
            winner_id: finalWinner,
            final_price: finalPrice,
            status: "finished"
        }
        });

      // obtener historial completo desde Redis
      const bidList = await redis.lRange(`auction:${auctionId}:bids`, 0, -1);

        for (const bid of bidList) {
        const parsed = JSON.parse(bid);

        await prisma.auctionDetail.create({
            data: {
            auction_id: auctionId,
            user_id: parsed.userId,
            amount: parsed.amount,
            timestamp: new Date(parsed.timestamp)
            }
        });
        }

      // borrar claves de Redis
      await redis.del(`auction:${auctionId}`);
      await redis.del(`auction:${auctionId}:bids`);

      console.log("Auction successfully finalized:", auctionId);

      done();
    } catch (error) {
      console.error("Error ending auction:", error);
      done(error);
    }
  });
}