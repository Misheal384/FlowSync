//configure redis connection
import {createClient} from 'redis';

export const redisClient = createClient({
    url: 'redis://localhost:6379',
});
