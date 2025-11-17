import { prisma } from '../../db/db.js';
import redis from '../../db/redis.js';

export default function(agenda) {
    agenda.define('startAuction', async (job) => {
        const { auctionId } = job.attrs.data;

        console.log(`Iniciando subasta con ID: ${auctionId}`);
        
        // actualizar el estado de la subasta en la base de datos
        await prisma.auction.update({
            where: { id: auctionId },
            data: { status: 'active' },
        });

        // actualizar el estado de la subasta en Redis
        await redis.hSet(`auction:${auctionId}`, {
            status: 'active',
        });

        console.log(`Subasta con ID: ${auctionId} ha sido iniciada.`);
});
}